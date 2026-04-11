import eventlet
eventlet.monkey_patch()
from flask import Flask, Response, jsonify, send_file, request
import io
from flask_cors import CORS
from flask_socketio import SocketIO
import cv2
from pyzbar.pyzbar import decode
import openpyxl
import docx
import os
import pandas as pd
import threading
import time
import random
import datetime
import json

# Conditional Import for FPDF
try:
    import fpdf
    HAS_FPDF = True
except ImportError:
    HAS_FPDF = False

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), 'data')
DB_FILE = os.path.join(DATA_DIR, "books_database.xlsx")
BACKUP_FILE = os.path.join(DATA_DIR, "books_database_backup.xlsx")

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR, exist_ok=True)

# ── Schema & Shelf Map ─────────────────────────────────────────────────────
COLUMNS = ['Barcode', 'Book Name', 'Author', 'Department', 'Status', 'Shelf']

SHELF_MAP_FILE = os.path.join(DATA_DIR, "shelf_map.json")

def load_shelf_map():
    if not os.path.exists(SHELF_MAP_FILE):
        initial_map = {
            'General': 'A1',
            'Civil Engineering': 'B1',
            'Computer Science': 'C1',
            'Electrical Engineering': 'D1',
            'Mechanical Engineering': 'E1',
            'Electronics': 'F1',
            'Information Technology': 'G1',
            'Mathematics': 'H1',
            'Physics': 'H2',
            'Chemistry': 'H3',
            'English': 'I1',
            'Management': 'J1',
        }
        with open(SHELF_MAP_FILE, 'w') as f:
            json.dump(initial_map, f, indent=4)
        return initial_map
    with open(SHELF_MAP_FILE, 'r') as f:
        return json.load(f)

def save_shelf_map(new_map):
    with open(SHELF_MAP_FILE, 'w') as f:
        json.dump(new_map, f, indent=4)

SHELF_MAP = load_shelf_map()

def get_shelf_for_dept(dept):
    """Return the shelf label for a given department, defaulting to A1."""
    if not dept or str(dept).strip().lower() in ('', 'nan', 'none'):
        return 'A1'
    
    # Case-insensitive matching
    dept_clean = str(dept).strip().lower()
    for d, s in SHELF_MAP.items():
        if d.strip().lower() == dept_clean:
            return s
    return 'A1'

# ── Runtime state ──────────────────────────────────────────────────────────
target_shelf = None        # The shelf currently being audited
scanned_books = set()
camera = None
lock = threading.Lock()
session_start_time = time.time()
scan_records = []
camera_state = "STOPPED"

camera_config = {
    "index": 0,
    "width": 640,
    "height": 480
}

# ── DB Utilities ───────────────────────────────────────────────────────────

def standardize_df(df):
    """Normalize any incoming DataFrame into the canonical 6-column schema."""
    if df.empty:
        return pd.DataFrame(columns=COLUMNS)

    # If already in exact schema — just clean it
    if list(df.columns) == COLUMNS:
        df = df.fillna('')
        df[COLUMNS[0]] = df[COLUMNS[0]].astype(str).str.replace(r'\.0$', '', regex=True).str.strip()
        df = df[df[COLUMNS[0]] != '']
        # Auto-fill missing shelves
        df['Shelf'] = df.apply(
            lambda r: r['Shelf'] if str(r['Shelf']).strip() not in ('', 'nan') else get_shelf_for_dept(r['Department']),
            axis=1
        )
        return df

    # Fuzzy-map columns from unknown import formats
    b_cols  = [c for c in df.columns if any(x in str(c).lower() for x in ['barcode', 'access', 'id'])]
    n_cols  = [c for c in df.columns if any(x in str(c).lower() for x in ['name', 'book', 'title'])]
    a_cols  = [c for c in df.columns if any(x in str(c).lower() for x in ['author', 'writer'])]
    d_cols  = [c for c in df.columns if any(x in str(c).lower() for x in ['dept', 'subject', 'category', 'class', 'department'])]
    s_cols  = [c for c in df.columns if 'status' in str(c).lower()]
    sh_cols = [c for c in df.columns if 'shelf' in str(c).lower() or 'rack' in str(c).lower()]

    rows = []
    for _, row in df.iterrows():
        b  = next((str(row[c]).strip() for c in b_cols  if pd.notna(row[c])), '').strip()
        if b.endswith('.0'): b = b[:-2]
        b = b.replace("'", "").strip()
        n  = next((str(row[c]).strip() for c in n_cols  if pd.notna(row[c])), 'Unknown Book').strip()
        a  = next((str(row[c]).strip() for c in a_cols  if pd.notna(row[c])), 'Unknown Author').strip()
        d  = next((str(row[c]).strip() for c in d_cols  if pd.notna(row[c])), 'General').strip()
        st = next((str(row[c]).strip() for c in s_cols  if pd.notna(row[c])), 'Available').strip()
        sh = next((str(row[c]).strip() for c in sh_cols if pd.notna(row[c])), '').strip()

        if not st or str(st).lower() == 'nan': st = 'Available'
        if not sh or str(sh).lower() == 'nan': sh = get_shelf_for_dept(d)
        if not d  or str(d).lower()  == 'nan': d  = 'General'

        if b and b != 'nan' and b != 'None':
            rows.append({
                COLUMNS[0]: b,
                COLUMNS[1]: n,
                COLUMNS[2]: a,
                COLUMNS[3]: d,
                COLUMNS[4]: st,
                COLUMNS[5]: sh,
            })
    return pd.DataFrame(rows, columns=COLUMNS)


def load_books_db():
    """Load books from Excel into a dict keyed by barcode."""
    try:
        if not os.path.exists(DB_FILE):
            print(f"DB_FILE not found: {DB_FILE}")
            return {}

        df = pd.read_excel(DB_FILE, engine='openpyxl')
        df = standardize_df(df)

        books = {}
        for _, row in df.iterrows():
            barcode = str(row[COLUMNS[0]]).strip()
            books[barcode] = {
                "barcode":    barcode,
                "name":       str(row[COLUMNS[1]]).strip(),
                "author":     str(row[COLUMNS[2]]).strip(),
                "department": str(row[COLUMNS[3]]).strip(),
                "status":     str(row[COLUMNS[4]]).strip(),
                "shelf":      str(row[COLUMNS[5]]).strip(),
            }
        return books
    except PermissionError as e:
        return {"ERROR": f"Database file is locked (close Excel first). {e}"}
    except Exception as e:
        import traceback; traceback.print_exc()
        return {"ERROR": f"Internal Load Error: {type(e).__name__}: {e}"}


# Load once at startup
books_db = load_books_db()

# ── Threading ──────────────────────────────────────────────────────────────
cam_lock   = threading.Lock()
frame_lock = threading.Lock()
det_lock   = threading.Lock()

latest_frame      = None
latest_detections = []

# ── Camera Workers ─────────────────────────────────────────────────────────

def get_camera():
    global camera
    with cam_lock:
        if camera is None or not camera.isOpened():
            idx = camera_config["index"]
            for backend in [cv2.CAP_DSHOW, cv2.CAP_ANY]:
                cam = cv2.VideoCapture(idx, backend)
                if cam.isOpened():
                    cam.set(cv2.CAP_PROP_FRAME_WIDTH,  camera_config["width"])
                    cam.set(cv2.CAP_PROP_FRAME_HEIGHT, camera_config["height"])
                    cam.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    camera = cam
                    print(f"Camera opened: index={idx}, backend={backend}")
                    break
            else:
                camera = None
    return camera

_cam_fail_count = 0

def camera_worker():
    global latest_frame, camera, _cam_fail_count
    while True:
        if camera_state == 'STOPPED':
            with cam_lock:
                if camera is not None and camera.isOpened():
                    camera.release()
                    camera = None
            with frame_lock:
                latest_frame = None
            _cam_fail_count = 0
            eventlet.sleep(0.5)
            continue

        if camera_state == 'PAUSED':
            eventlet.sleep(0.1)
            continue

        cam = get_camera()
        if cam is None:
            _cam_fail_count += 1
            backoff = min(2.0, 0.5 * _cam_fail_count)
            eventlet.sleep(backoff)
            continue

        _cam_fail_count = 0
        with cam_lock:
            if cam is not None and cam.isOpened():
                success, frame = cam.read()
            else:
                success = False

        if success:
            with frame_lock:
                latest_frame = frame.copy()
        else:
            with cam_lock:
                if camera is not None:
                    camera.release()
                    camera = None
            eventlet.sleep(0.2)
        eventlet.sleep(0.01)


def build_status():
    """Compute available / missing / safely_issued / misplaced from current scan state."""
    available     = []
    missing_books = []
    safely_issued = []
    misplaced     = []

    with lock:
        current_scanned = list(scanned_books)

    for barcode, book_info in books_db.items():
        is_scanned  = barcode in current_scanned
        book_shelf  = book_info.get('shelf', 'A1')
        book_status = book_info.get('status', 'Available')

        if is_scanned:
            if target_shelf and book_shelf != target_shelf:
                book_copy = dict(book_info)
                book_copy['found_on_shelf'] = target_shelf
                misplaced.append(book_copy)
            else:
                available.append(book_info)
        else:
            if target_shelf:
                if book_shelf == target_shelf:
                    if book_status.strip().lower() == 'issued':
                        safely_issued.append(book_info)
                    else:
                        missing_books.append(book_info)
            else:
                if book_status.strip().lower() == 'issued':
                    safely_issued.append(book_info)
                else:
                    missing_books.append(book_info)

    for scanned_barcode in current_scanned:
        if scanned_barcode not in books_db:
            misplaced.append({
                "barcode": scanned_barcode,
                "name": "Unknown Book",
                "author": "Unknown",
                "department": "Unknown",
                "shelf": "Unknown",
                "found_on_shelf": target_shelf or "Unknown"
            })

    return {
        "available":       available,
        "missing":         missing_books,
        "safely_issued":   safely_issued,
        "misplaced":       misplaced,
        "target_shelf":    target_shelf,
    }


def vision_worker():
    global latest_detections
    while True:
        if camera_state != 'PLAYING':
            eventlet.sleep(0.1)
            continue

        with frame_lock:
            frame = latest_frame.copy() if latest_frame is not None else None

        if frame is None:
            eventlet.sleep(0.1)
            continue

        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            decoded_objects = decode(gray)
            decoded_objects = sorted(decoded_objects, key=lambda obj: obj.rect.left, reverse=True)

            current_dets = []
            new_scans    = []

            for obj in decoded_objects:
                barcode_data = obj.data.decode('utf-8')
                (x, y, w, h) = obj.rect
                current_dets.append({"data": barcode_data, "rect": (x, y, w, h)})

                with lock:
                    if barcode_data not in scanned_books:
                        scanned_books.add(barcode_data)
                        new_scans.append(barcode_data)

            with det_lock:
                latest_detections = current_dets

            for barcode_data in new_scans:
                if barcode_data in books_db:
                    book_info = books_db[barcode_data]
                    if target_shelf and book_info.get('shelf') != target_shelf:
                        status = "misplaced"
                    else:
                        status = "available"
                else:
                    book_info = {"barcode": barcode_data, "name": "Unknown Book", "author": "Unknown Author", "shelf": "Unknown"}
                    status    = "unknown"

                with lock:
                    scan_records.append({
                        "barcode":          barcode_data,
                        "book":             book_info,
                        "status":           status.upper(),
                        "time_took_seconds": round(time.time() - session_start_time, 2)
                    })

                socketio.emit('new_scan', {
                    "barcode":     barcode_data,
                    "book":        book_info,
                    "status":      status,
                    "full_status": build_status()
                })
                eventlet.sleep(0.3)

        except Exception as e:
            print(f"Barcode decoding error: {e}")

        eventlet.sleep(0.05)


# Start background workers
eventlet.spawn(camera_worker)
eventlet.spawn(vision_worker)


def gen_frames():
    while True:
        with frame_lock:
            frame = latest_frame.copy() if latest_frame is not None else None
        with det_lock:
            dets = list(latest_detections)

        if frame is None:
            eventlet.sleep(0.1)
            continue

        try:
            for i, det in enumerate(dets):
                (x, y, w, h) = det["rect"]
                data  = det["data"]
                color = (0, 255, 0) if i == 0 else (0, 255, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.putText(frame, data, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        except Exception as e:
            print(f"Frame yield error: {e}")
            break
        eventlet.sleep(0.01)


# ── API Routes ─────────────────────────────────────────────────────────────

@app.route('/')
def health_check():
    return jsonify({"status": "healthy", "message": "Libro-Bot Backend Running"})

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def get_status():
    return jsonify(build_status())

@app.route('/api/shelves', methods=['GET'])
def get_shelves():
    """Return the full SHELF_MAP and a list of unique shelves in use."""
    global SHELF_MAP
    SHELF_MAP = load_shelf_map() # Reload
    shelves_in_use = sorted(set(b.get('shelf', 'A1') for b in books_db.values()))
    return jsonify({
        "shelf_map": SHELF_MAP,
        "shelves_in_use": shelves_in_use
    })

@app.route('/api/settings/shelf_map', methods=['POST'])
def update_shelf_map():
    global SHELF_MAP
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid data format"}), 400
    
    SHELF_MAP = data
    save_shelf_map(SHELF_MAP)
    return jsonify({"message": "Shelf map updated successfully", "shelf_map": SHELF_MAP})

@app.route('/api/target_shelf', methods=['GET', 'POST'])
def handle_target_shelf():
    global target_shelf
    if request.method == 'POST':
        data = request.json
        val  = data.get('shelf', '').strip()
        target_shelf = val if val else None
        
        new_status = build_status()
        socketio.emit('status_update', new_status)
        return jsonify({"message": "Target shelf updated", "target_shelf": target_shelf})
    return jsonify({"target_shelf": target_shelf})

@app.route('/api/departments', methods=['GET'])
def get_departments():
    depts = set()
    for b in books_db.values():
        d = b.get('department', '').strip()
        if d: depts.add(d)
    return jsonify({"departments": sorted(list(depts))})

@app.route('/api/books', methods=['GET'])
def get_books():
    return jsonify(books_db)

@app.route('/api/books/reload', methods=['POST'])
def reload_books():
    global books_db
    with lock:
        new_db = load_books_db()
        if "ERROR" in new_db:
            return jsonify({"error": new_db["ERROR"]}), 423
        books_db = new_db
    return jsonify({"message": f"Database re-synced. {len(books_db)} books loaded.", "count": len(books_db)})

@app.route('/api/books', methods=['POST'])
def add_book():
    global books_db
    data = request.json
    if not data or 'barcode' not in data or 'name' not in data or 'author' not in data:
        return jsonify({"error": "Missing required fields (barcode, name, author)"}), 400

    barcode = str(data['barcode']).strip()
    if barcode in books_db:
        return jsonify({"error": "Barcode already exists"}), 400

    dept  = str(data.get('department', 'General')).strip()
    shelf = str(data.get('shelf', '')).strip() or get_shelf_for_dept(dept)

    new_book = {
        "barcode":    barcode,
        "name":       str(data['name']).strip(),
        "author":     str(data['author']).strip(),
        "department": dept,
        "status":     "Available",
        "shelf":      shelf,
    }

    try:
        with lock:
            books_db[barcode] = new_book
            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            new_row = pd.DataFrame([{
                COLUMNS[0]: new_book['barcode'],
                COLUMNS[1]: new_book['name'],
                COLUMNS[2]: new_book['author'],
                COLUMNS[3]: new_book['department'],
                COLUMNS[4]: new_book['status'],
                COLUMNS[5]: new_book['shelf'],
            }])
            df = pd.concat([df, new_row], ignore_index=True)
            df.to_excel(DB_FILE, index=False)
        return jsonify(new_book), 201
    except Exception as e:
        return jsonify({"error": f"Failed to add book: {e}"}), 500

@app.route('/api/books/<barcode>', methods=['PUT'])
def update_book(barcode):
    global books_db
    data    = request.json
    barcode = str(barcode).strip()
    if barcode not in books_db:
        return jsonify({"error": "Book not found"}), 404

    try:
        with lock:
            dept  = str(data.get('department', books_db[barcode]['department'])).strip()
            shelf = str(data.get('shelf', books_db[barcode].get('shelf', ''))).strip() or get_shelf_for_dept(dept)

            books_db[barcode]['name']       = str(data.get('name',   books_db[barcode]['name'])).strip()
            books_db[barcode]['author']     = str(data.get('author', books_db[barcode]['author'])).strip()
            books_db[barcode]['department'] = dept
            books_db[barcode]['status']     = str(data.get('status', books_db[barcode].get('status', 'Available'))).strip()
            books_db[barcode]['shelf']      = shelf

            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            mask = df[COLUMNS[0]].astype(str).str.strip() == barcode
            if mask.any():
                df.loc[mask, COLUMNS[1]] = books_db[barcode]['name']
                df.loc[mask, COLUMNS[2]] = books_db[barcode]['author']
                df.loc[mask, COLUMNS[3]] = books_db[barcode]['department']
                df.loc[mask, COLUMNS[4]] = books_db[barcode]['status']
                df.loc[mask, COLUMNS[5]] = books_db[barcode]['shelf']
            df.to_excel(DB_FILE, index=False)
        return jsonify(books_db[barcode]), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update book: {e}"}), 500

@app.route('/api/books/<barcode>', methods=['DELETE'])
def delete_book(barcode):
    global books_db
    barcode = str(barcode).strip()
    if barcode not in books_db:
        return jsonify({"error": "Book not found"}), 404
    try:
        with lock:
            del books_db[barcode]
            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            df = df[df[COLUMNS[0]].astype(str).str.strip() != barcode]
            df.to_excel(DB_FILE, index=False)
        return jsonify({"message": "Book deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete book: {e}"}), 500

@app.route('/api/books/bulk-delete', methods=['POST'])
def bulk_delete_books():
    global books_db
    data = request.json
    if not data or 'barcodes' not in data:
        return jsonify({"error": "Missing barcodes array"}), 400

    barcodes_to_delete = [str(b).strip() for b in data['barcodes']]
    try:
        with lock:
            for barcode in barcodes_to_delete:
                if barcode in books_db:
                    del books_db[barcode]
            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            df = df[~df[COLUMNS[0]].astype(str).str.strip().isin(barcodes_to_delete)]
            df.to_excel(DB_FILE, index=False)
        return jsonify({"message": f"{len(barcodes_to_delete)} books deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to bulk delete: {e}"}), 500

@app.route('/api/books/import', methods=['POST'])
def import_books():
    global books_db
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    allowed = ['.xlsx', '.xls', '.csv', '.ods']
    if ext not in allowed:
        return jsonify({"error": f"Invalid format. Must be one of {', '.join(allowed)}"}), 400

    try:
        if ext == '.csv':
            df_new = pd.read_csv(file)
        elif ext == '.ods':
            df_new = pd.read_excel(file, engine="odf")
        else:
            df_new = pd.read_excel(file)

        with lock:
            if os.path.exists(DB_FILE):
                import shutil
                shutil.copy2(DB_FILE, BACKUP_FILE)

        df_new = standardize_df(df_new)
        if df_new.empty:
            return jsonify({"error": "No valid book entries found in uploaded file"}), 400

        with lock:
            df_existing = pd.read_excel(DB_FILE) if os.path.exists(DB_FILE) else pd.DataFrame(columns=COLUMNS)
            df_merged = pd.concat([df_existing, df_new], ignore_index=True)
            df_merged = df_merged.drop_duplicates(subset=[COLUMNS[0]], keep='last')
            df_merged.to_excel(DB_FILE, index=False)

            new_db = {}
            for _, row in df_merged.iterrows():
                b = str(row[COLUMNS[0]]).strip()
                new_db[b] = {
                    "barcode":    b,
                    "name":       str(row[COLUMNS[1]]).strip(),
                    "author":     str(row[COLUMNS[2]]).strip(),
                    "department": str(row[COLUMNS[3]]).strip(),
                    "status":     str(row[COLUMNS[4]]).strip(),
                    "shelf":      str(row[COLUMNS[5]]).strip() if pd.notna(row[COLUMNS[5]]) else get_shelf_for_dept(str(row[COLUMNS[3]]).strip()),
                }
            books_db = new_db

        return jsonify({"message": f"Successfully imported. Total books: {len(books_db)}"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to parse file: {e}"}), 500

@app.route('/api/books/undo_import', methods=['POST'])
def undo_import():
    global books_db
    if not os.path.exists(BACKUP_FILE):
        return jsonify({"error": "No backup available to undo."}), 400
    try:
        df = pd.read_excel(BACKUP_FILE)
        df = standardize_df(df)
        new_db = {}
        for _, row in df.iterrows():
            b = str(row[COLUMNS[0]]).strip()
            new_db[b] = {
                "barcode":    b,
                "name":       str(row[COLUMNS[1]]).strip(),
                "author":     str(row[COLUMNS[2]]).strip(),
                "department": str(row[COLUMNS[3]]).strip(),
                "status":     str(row[COLUMNS[4]]).strip(),
                "shelf":      str(row[COLUMNS[5]]).strip() if pd.notna(row[COLUMNS[5]]) else get_shelf_for_dept(str(row[COLUMNS[3]]).strip()),
            }
        with lock:
            books_db = new_db
            df.to_excel(DB_FILE, index=False)
            os.remove(BACKUP_FILE)
        return jsonify({"message": f"Restored {len(new_db)} books from backup."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to restore backup: {e}"}), 500

@app.route('/api/books/export', methods=['GET'])
def export_books_db():
    fmt = request.args.get('format', 'xlsx').lower()
    if not os.path.exists(DB_FILE):
        return jsonify({"error": "Database file does not exist"}), 404
    try:
        timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        df = pd.read_excel(DB_FILE)
        out = io.BytesIO()

        if fmt == 'csv':
            df.to_csv(out, index=False); out.seek(0)
            return send_file(out, as_attachment=True, download_name=f'LibroBot_Database_{timestamp_str}.csv', mimetype='text/csv')
        elif fmt == 'ods':
            df.to_excel(out, index=False, engine='odf'); out.seek(0)
            return send_file(out, as_attachment=True, download_name=f'LibroBot_Database_{timestamp_str}.ods', mimetype='application/vnd.oasis.opendocument.spreadsheet')
        else:
            return send_file(DB_FILE, as_attachment=True, download_name=f'LibroBot_Database_{timestamp_str}.xlsx')
    except Exception as e:
        return jsonify({"error": f"Failed to export: {e}"}), 500

@app.route('/reset_session', methods=['POST'])
def reset_session():
    global session_start_time
    with lock:
        scanned_books.clear()
        scan_records.clear()
        session_start_time = time.time()
    socketio.emit('session_reset', build_status())
    return jsonify({"status": "success", "message": "Session reset successfully."})

@app.route('/camera_control', methods=['POST'])
def camera_control():
    global camera_state, camera
    data = request.json
    if not data or 'action' not in data:
        return jsonify({"error": "invalid data"}), 400

    action = data['action'].upper()
    config_changed = False
    if 'config' in data:
        new_config = data['config']
        if 'index' in new_config and new_config['index'] != camera_config['index']:
            camera_config['index'] = int(new_config['index'])
            config_changed = True
        if 'width'  in new_config: camera_config['width']  = int(new_config['width']);  config_changed = True
        if 'height' in new_config: camera_config['height'] = int(new_config['height']); config_changed = True

    if config_changed:
        with cam_lock:
            if camera is not None:
                camera.release()
                camera = None

    if action in ['START', 'PLAYING']:
        camera_state = 'PLAYING'
    elif action == 'PAUSE':
        camera_state = 'PAUSED'
    elif action == 'STOP':
        camera_state = 'STOPPED'
    else:
        return jsonify({"error": "invalid action"}), 400

    socketio.emit('camera_state_changed', {'state': camera_state, 'config': camera_config})
    return jsonify({"status": "success", "camera_state": camera_state, "config": camera_config})

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({"camera": camera_config, "db_file": DB_FILE})

@app.route('/export_word')
def export_word():
    try:
        status = build_status()
        doc = docx.Document()
        doc.add_heading('Libro-Bot Audit Report', 0)

        session_id = f"LBR-{random.randint(10000, 99999)}"
        doc.add_paragraph(f"Scan Operator: Library Admin")
        doc.add_paragraph(f"Session ID: {session_id}")
        doc.add_paragraph(f"System Version: Libro-Bot Core v2.0")
        doc.add_paragraph(f"Report Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        doc.add_heading('Summary', level=1)
        total_missing  = len(status['missing'])
        total_avail    = len(status['available'])
        total_misp     = len(status['misplaced'])
        total_issued   = len(status.get('safely_issued', []))
        session_dur    = round(time.time() - session_start_time, 2)

        doc.add_paragraph(f"Target Shelf: {status.get('target_shelf') or 'All Shelves'}")
        doc.add_paragraph(f"Session Duration: {session_dur}s")
        avg_speed = round(session_dur / len(scan_records), 2) if scan_records else "N/A"
        doc.add_paragraph(f"Avg Scan Speed: {avg_speed} sec/book")
        doc.add_paragraph(f"Found (Available): {total_avail}")
        doc.add_paragraph(f"Missing: {total_missing}")
        doc.add_paragraph(f"Safely Issued: {total_issued}")
        doc.add_paragraph(f"Misplaced (Wrong Shelf): {total_misp}")

        # Missing books
        doc.add_heading('Missing Books', level=1)
        if total_missing > 0:
            by_shelf = {}
            for b in status['missing']:
                sh = b.get('shelf', 'A1')
                by_shelf.setdefault(sh, []).append(b)
            for sh, books in by_shelf.items():
                doc.add_heading(f"Shelf {sh}", level=2)
                tbl = doc.add_table(rows=1, cols=4); tbl.style = 'Table Grid'
                hdr = tbl.rows[0].cells
                hdr[0].text = 'Barcode'; hdr[1].text = 'Book Name'; hdr[2].text = 'Author'; hdr[3].text = 'Department'
                for b in books:
                    r = tbl.add_row().cells
                    r[0].text = str(b.get('barcode', '')); r[1].text = str(b.get('name', ''))
                    r[2].text = str(b.get('author', '')); r[3].text = str(b.get('department', ''))
        else:
            doc.add_paragraph("All books accounted for!")

        # Misplaced books
        doc.add_heading('Misplaced Books (Wrong Shelf)', level=1)
        if total_misp > 0:
            doc.add_paragraph("WARNING: The following books were found on the wrong shelf.")
            tbl2 = doc.add_table(rows=1, cols=4); tbl2.style = 'Table Grid'
            hdr2 = tbl2.rows[0].cells
            hdr2[0].text = 'Barcode'; hdr2[1].text = 'Book Name'; hdr2[2].text = 'Registered Shelf'; hdr2[3].text = 'Found On Shelf'
            for b in status['misplaced']:
                r = tbl2.add_row().cells
                r[0].text = str(b.get('barcode', '')); r[1].text = str(b.get('name', ''))
                r[2].text = str(b.get('shelf', '')); r[3].text = str(b.get('found_on_shelf', ''))
        else:
            doc.add_paragraph("No misplaced items detected.")

        out = io.BytesIO()
        doc.save(out); out.seek(0)
        filename = f"LibroBot_Report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
        return send_file(out, mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         as_attachment=True, download_name=filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@socketio.on('connect')
def handle_connect():
    state = build_status()
    state['camera_state'] = camera_state
    socketio.emit('initial_state', state)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
