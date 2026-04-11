import os

filepath = r'd:\projects\final_lib\backend\app.py'
with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update COLUMNS
code = code.replace(
    "COLUMNS = ['Barcode', 'Book Name', 'Author', 'Department']",
    "COLUMNS = ['Barcode', 'Book Name', 'Author', 'Department', 'Status', 'Issued To', 'Issue Date', 'Due Date']"
)

# 2. Add target_department global after BACKUP_FILE
code = code.replace(
    "BACKUP_FILE = os.path.join(DATA_DIR, \"books_database_backup.xlsx\")",
    "BACKUP_FILE = os.path.join(DATA_DIR, \"books_database_backup.xlsx\")\ntarget_department = None"
)

# 3. Replace standardize_df function completely
old_standardize = """def standardize_df(df):
    \"\"\"Normalize a DataFrame to strictly have COLUMNS=['Barcode', 'Book Name', 'Author', 'Department']
    This handles cases where headers are mislabeled or duplicated.
    \"\"\"
    if df.empty:
        return pd.DataFrame(columns=COLUMNS)
        
    barcode_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['barcode', 'access no', 'accession', 'id'])]
    name_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['name', 'book', 'title', 'identity'])]
    author_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['author', 'writer'])]
    dept_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['dept', 'subject', 'category', 'class', 'department', 'section'])]
    
    rows = []
    for _, row in df.iterrows():
        # Coalesce: pick the first non-null value from any matching column
        b = next((str(row[c]).strip() for c in barcode_cols if pd.notna(row[c])), "").strip()
        
        # Clean up barcodes that came in as floats (.0) or have quotes
        if b.endswith('.0'):
            b = b[:-2]
        b = b.replace("'", "").strip()
            
        n = next((str(row[c]).strip() for c in name_cols if pd.notna(row[c])), "Unknown Book").strip()
        a = next((str(row[c]).strip() for c in author_cols if pd.notna(row[c])), "Unknown Author").strip()
        d = next((str(row[c]).strip() for c in dept_cols if pd.notna(row[c])), "General").strip()
        
        if b and b != 'nan' and b != 'None':
            rows.append({COLUMNS[0]: b, COLUMNS[1]: n, COLUMNS[2]: a, COLUMNS[3]: d})
            
    return pd.DataFrame(rows, columns=COLUMNS)"""

new_standardize = """def standardize_df(df):
    if df.empty:
        return pd.DataFrame(columns=COLUMNS)
    b_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['barcode', 'access', 'id'])]
    n_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['name', 'book', 'title'])]
    a_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['author', 'writer'])]
    d_cols = [c for c in df.columns if any(x in str(c).lower() for x in ['dept', 'subject', 'category', 'class', 'department'])]
    s_cols = [c for c in df.columns if 'status' in str(c).lower()]
    it_cols = [c for c in df.columns if 'issued to' in str(c).lower() or 'student name' in str(c).lower()]
    id_cols = [c for c in df.columns if 'issue date' in str(c).lower()]
    dd_cols = [c for c in df.columns if 'due date' in str(c).lower()]
    rows = []
    for _, row in df.iterrows():
        b = next((str(row[c]).strip() for c in b_cols if pd.notna(row[c])), "").strip()
        if b.endswith('.0'): b = b[:-2]
        b = b.replace("'", "").strip()
        n = next((str(row[c]).strip() for c in n_cols if pd.notna(row[c])), "Unknown Book").strip()
        a = next((str(row[c]).strip() for c in a_cols if pd.notna(row[c])), "Unknown Author").strip()
        d = next((str(row[c]).strip() for c in d_cols if pd.notna(row[c])), "General").strip()
        st = next((str(row[c]).strip() for c in s_cols if pd.notna(row[c])), "Available").strip()
        it = next((str(row[c]).strip() for c in it_cols if pd.notna(row[c])), "").strip()
        id_ = next((str(row[c]).strip() for c in id_cols if pd.notna(row[c])), "").strip()
        dd = next((str(row[c]).strip() for c in dd_cols if pd.notna(row[c])), "").strip()
        if not st or str(st).lower() == 'nan': st = 'Available'
        if str(it).lower() == 'nan': it = ''
        if str(id_).lower() == 'nan': id_ = ''
        if str(dd).lower() == 'nan': dd = ''
        if b and b != 'nan' and b != 'None':
            rows.append({
                COLUMNS[0]: b, COLUMNS[1]: n, COLUMNS[2]: a, COLUMNS[3]: d, 
                COLUMNS[4]: st, COLUMNS[5]: it, COLUMNS[6]: id_, COLUMNS[7]: dd
            })
    return pd.DataFrame(rows, columns=COLUMNS)"""

code = code.replace(old_standardize, new_standardize)

# 4. Replace load_books_db loop
old_load = '''        for _, row in df.iterrows():
            barcode = str(row[COLUMNS[0]]).strip()
            books[barcode] = {
                "barcode": barcode,
                "name": str(row[COLUMNS[1]]).strip(),
                "author": str(row[COLUMNS[2]]).strip(),
                "department": str(row[COLUMNS[3]]).strip()
            }'''
new_load = '''        for _, row in df.iterrows():
            barcode = str(row[COLUMNS[0]]).strip()
            books[barcode] = {
                "barcode": barcode,
                "name": str(row[COLUMNS[1]]).strip(),
                "author": str(row[COLUMNS[2]]).strip(),
                "department": str(row[COLUMNS[3]]).strip(),
                "status": str(row[COLUMNS[4]]).strip(),
                "issued_to": str(row[COLUMNS[5]]).strip() if pd.notna(row[COLUMNS[5]]) else "",
                "issue_date": str(row[COLUMNS[6]]).strip() if pd.notna(row[COLUMNS[6]]) else "",
                "due_date": str(row[COLUMNS[7]]).strip() if pd.notna(row[COLUMNS[7]]) else ""
            }'''
code = code.replace(old_load, new_load)

# Add /api/target_department endpoint
api_td = '''
@app.route('/api/target_department', methods=['GET', 'POST'])
def handle_target_department():
    global target_department
    if request.method == 'POST':
        data = request.json
        target_department = data.get('department')
        return jsonify({"message": "Target department updated", "target_department": target_department})
    return jsonify({"target_department": target_department})
'''
code = code.replace("@app.route('/')", api_td + "\n@app.route('/')")

# 5. Build Status
old_build = '''def build_status():
    available = []
    missing = []
    misplaced = []
    
    with lock:
        current_scanned = list(scanned_books)
        
    for barcode, book_info in books_db.items():
        if barcode in current_scanned:
            available.append(book_info)
        else:
            missing.append(book_info)
            
    for scanned_barcode in current_scanned:
        if scanned_barcode not in books_db:
            misplaced.append({"barcode": scanned_barcode, "name": "Unknown Book", "author": "Unknown Author"})
            
    return {
        "available": available,
        "missing": missing,
        "misplaced": misplaced
    }'''

new_build = '''def build_status():
    available = []
    missing_general = []
    safely_issued = []
    misplaced = []
    missing_dept = []
    with lock:
        current_scanned = list(scanned_books)
        
    for barcode, book_info in books_db.items():
        is_scanned = barcode in current_scanned
        book_dept = book_info.get('department', 'General')
        book_status = book_info.get('status', 'Available')
        
        if is_scanned:
            if target_department and book_dept != target_department:
                book_info_copy = dict(book_info)
                book_info_copy['found_in'] = target_department
                misplaced.append(book_info_copy)
            else:
                available.append(book_info)
        else:
            if target_department:
                if book_dept == target_department:
                    if book_status.strip().lower() == 'issued': safely_issued.append(book_info)
                    else: missing_dept.append(book_info)
            else:
                if book_status.strip().lower() == 'issued': safely_issued.append(book_info)
                else: missing_general.append(book_info)
            
    for scanned_barcode in current_scanned:
        if scanned_barcode not in books_db:
            misplaced.append({"barcode": scanned_barcode, "name": "Unknown Book", "author": "Unknown Author", "department": "Unknown", "found_in": target_department or "Unknown"})
            
    return {
        "available": available,
        "missing": missing_dept if target_department else missing_general,
        "safely_issued": safely_issued,
        "misplaced": misplaced,
        "target_department": target_department
    }'''
code = code.replace(old_build, new_build)

# 6. Circulation API
circ_apis = '''
import datetime

@app.route('/api/books/checkout', methods=['POST'])
def checkout_book():
    global books_db
    data = request.json
    barcode = str(data.get('barcode', '')).strip()
    student_id = str(data.get('student_id', '')).strip()
    if not barcode or not student_id: return jsonify({"error": "Barcode and Student ID are required"}), 400
    if barcode not in books_db: return jsonify({"error": "Book not found"}), 404
    if books_db[barcode].get('status', 'Available').strip().lower() == 'issued': return jsonify({"error": "Book is already issued"}), 400
    try:
        with lock:
            iss_date = datetime.datetime.now()
            d_date = iss_date + datetime.timedelta(days=14)
            books_db[barcode]['status'] = 'Issued'
            books_db[barcode]['issued_to'] = student_id
            books_db[barcode]['issue_date'] = iss_date.strftime("%Y-%m-%d")
            books_db[barcode]['due_date'] = d_date.strftime("%Y-%m-%d")
            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            mask = df[COLUMNS[0]].astype(str).str.strip() == barcode
            if mask.any():
                df.loc[mask, COLUMNS[4]] = 'Issued'
                df.loc[mask, COLUMNS[5]] = student_id
                df.loc[mask, COLUMNS[6]] = books_db[barcode]['issue_date']
                df.loc[mask, COLUMNS[7]] = books_db[barcode]['due_date']
            df.to_excel(DB_FILE, index=False)
        return jsonify(books_db[barcode]), 200
    except Exception as e:
        return jsonify({"error": "Failed to check out book: " + str(e)}), 500

@app.route('/api/books/return', methods=['POST'])
def return_book():
    global books_db
    data = request.json
    barcode = str(data.get('barcode', '')).strip()
    if not barcode: return jsonify({"error": "Barcode is required"}), 400
    if barcode not in books_db: return jsonify({"error": "Book not found"}), 404
    try:
        with lock:
            books_db[barcode]['status'] = 'Available'
            books_db[barcode]['issued_to'] = ''
            books_db[barcode]['issue_date'] = ''
            books_db[barcode]['due_date'] = ''
            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            mask = df[COLUMNS[0]].astype(str).str.strip() == barcode
            if mask.any():
                df.loc[mask, COLUMNS[4]] = 'Available'
                df.loc[mask, COLUMNS[5]] = ''
                df.loc[mask, COLUMNS[6]] = ''
                df.loc[mask, COLUMNS[7]] = ''
            df.to_excel(DB_FILE, index=False)
        return jsonify(books_db[barcode]), 200
    except Exception as e:
        return jsonify({"error": "Failed to return book: " + str(e)}), 500
'''
if 'checkout_book' not in code:
    code = code.replace("@app.route('/api/books', methods=['GET'])", circ_apis + "\n@app.route('/api/books', methods=['GET'])")

# 7. Add_book logic
old_new_book = '''    new_book = {
        "barcode": barcode,
        "name": str(data['name']).strip(),
        "author": str(data['author']).strip(),
        "department": str(data.get('department', 'General')).strip()
    }'''
new_new_book = '''    new_book = {
        "barcode": barcode,
        "name": str(data['name']).strip(),
        "author": str(data['author']).strip(),
        "department": str(data.get('department', 'General')).strip(),
        "status": "Available",
        "issued_to": "",
        "issue_date": "",
        "due_date": ""
    }'''
code = code.replace(old_new_book, new_new_book)

old_df_concat = '''            new_row = pd.DataFrame([{
                COLUMNS[0]: new_book['barcode'],
                COLUMNS[1]: new_book['name'],
                COLUMNS[2]: new_book['author'],
                COLUMNS[3]: new_book['department']
            }])'''
new_df_concat = '''            new_row = pd.DataFrame([{
                COLUMNS[0]: new_book['barcode'],
                COLUMNS[1]: new_book['name'],
                COLUMNS[2]: new_book['author'],
                COLUMNS[3]: new_book['department'],
                COLUMNS[4]: new_book['status'],
                COLUMNS[5]: new_book['issued_to'],
                COLUMNS[6]: new_book['issue_date'],
                COLUMNS[7]: new_book['due_date']
            }])'''
code = code.replace(old_df_concat, new_df_concat)

# 8. Update book logic
old_upd_book = '''            books_db[barcode]['name'] = str(data.get('name', books_db[barcode]['name'])).strip()
            books_db[barcode]['author'] = str(data.get('author', books_db[barcode]['author'])).strip()
            books_db[barcode]['department'] = str(data.get('department', books_db[barcode].get('department', 'General'))).strip()
            
            # 2. Update Excel File Safely
            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            
            # Find row and update
            mask = df[COLUMNS[0]].astype(str).str.strip() == barcode
            if mask.any():
                df.loc[mask, COLUMNS[1]] = books_db[barcode]['name']
                df.loc[mask, COLUMNS[2]] = books_db[barcode]['author']
                df.loc[mask, COLUMNS[3]] = books_db[barcode]['department']'''
new_upd_book = '''            books_db[barcode]['name'] = str(data.get('name', books_db[barcode]['name'])).strip()
            books_db[barcode]['author'] = str(data.get('author', books_db[barcode]['author'])).strip()
            books_db[barcode]['department'] = str(data.get('department', books_db[barcode].get('department', 'General'))).strip()
            books_db[barcode]['status'] = str(data.get('status', books_db[barcode].get('status', 'Available'))).strip()
            books_db[barcode]['issued_to'] = str(data.get('issued_to', books_db[barcode].get('issued_to', ''))).strip()
            books_db[barcode]['issue_date'] = str(data.get('issue_date', books_db[barcode].get('issue_date', ''))).strip()
            books_db[barcode]['due_date'] = str(data.get('due_date', books_db[barcode].get('due_date', ''))).strip()
            
            # 2. Update Excel File Safely
            df = pd.read_excel(DB_FILE)
            df = standardize_df(df)
            
            # Find row and update
            mask = df[COLUMNS[0]].astype(str).str.strip() == barcode
            if mask.any():
                df.loc[mask, COLUMNS[1]] = books_db[barcode]['name']
                df.loc[mask, COLUMNS[2]] = books_db[barcode]['author']
                df.loc[mask, COLUMNS[3]] = books_db[barcode]['department']
                df.loc[mask, COLUMNS[4]] = books_db[barcode]['status']
                df.loc[mask, COLUMNS[5]] = books_db[barcode]['issued_to']
                df.loc[mask, COLUMNS[6]] = books_db[barcode]['issue_date']
                df.loc[mask, COLUMNS[7]] = books_db[barcode]['due_date']'''
code = code.replace(old_upd_book, new_upd_book)

# 9. import books rebuilding dict
old_new_db = '''            new_db = {}
            for _, row in df_merged.iterrows():
                b = str(row[COLUMNS[0]]).strip()
                new_db[b] = {
                    "barcode": b,
                    "name": str(row[COLUMNS[1]]).strip(),
                    "author": str(row[COLUMNS[2]]).strip(),
                    "department": str(row[COLUMNS[3]]).strip()
                }'''
new_new_db = '''            new_db = {}
            for _, row in df_merged.iterrows():
                b = str(row[COLUMNS[0]]).strip()
                new_db[b] = {
                    "barcode": b,
                    "name": str(row[COLUMNS[1]]).strip(),
                    "author": str(row[COLUMNS[2]]).strip(),
                    "department": str(row[COLUMNS[3]]).strip(),
                    "status": str(row[COLUMNS[4]]).strip(),
                    "issued_to": str(row[COLUMNS[5]]).strip() if pd.notna(row[COLUMNS[5]]) else "",
                    "issue_date": str(row[COLUMNS[6]]).strip() if pd.notna(row[COLUMNS[6]]) else "",
                    "due_date": str(row[COLUMNS[7]]).strip() if pd.notna(row[COLUMNS[7]]) else ""
                }'''
code = code.replace(old_new_db, new_new_db)

# 10. undo import rebuilding dict
old_undo_db = '''        new_db = {}
        for _, row in df.iterrows():
            b = str(row[COLUMNS[0]]).strip()
            new_db[b] = {
                "barcode": b,
                "name": str(row[COLUMNS[1]]).strip(),
                "author": str(row[COLUMNS[2]]).strip(),
                "department": str(row[COLUMNS[3]]).strip()
            }'''
new_undo_db = '''        new_db = {}
        for _, row in df.iterrows():
            b = str(row[COLUMNS[0]]).strip()
            new_db[b] = {
                "barcode": b,
                "name": str(row[COLUMNS[1]]).strip(),
                "author": str(row[COLUMNS[2]]).strip(),
                "department": str(row[COLUMNS[3]]).strip(),
                "status": str(row[COLUMNS[4]]).strip(),
                "issued_to": str(row[COLUMNS[5]]).strip() if pd.notna(row[COLUMNS[5]]) else "",
                "issue_date": str(row[COLUMNS[6]]).strip() if pd.notna(row[COLUMNS[6]]) else "",
                "due_date": str(row[COLUMNS[7]]).strip() if pd.notna(row[COLUMNS[7]]) else ""
            }'''
code = code.replace(old_undo_db, new_undo_db)

# 11. export_word
old_export = '''        total_missing = len(status['missing'])
        total_available = len(status['available'])
        total_misplaced = len(status['misplaced'])
        
        session_duration = round(time.time() - session_start_time, 2)
        doc.add_paragraph(f"Total Session Time: {session_duration} seconds")
        
        # --- 3. Scan Speed ---
        avg_speed = "N/A"
        if len(scan_records) > 0:
            avg_speed = round(session_duration / len(scan_records), 2)
        doc.add_paragraph(f"Average Scan Speed: {avg_speed} seconds per item")
        
        doc.add_paragraph(f"Total Missing: {total_missing}")
        doc.add_paragraph(f"Total Found (Available): {total_available}")
        doc.add_paragraph(f"Total Misplaced (Not in DB): {total_misplaced}")'''
new_export = '''        total_missing = len(status['missing'])
        total_available = len(status['available'])
        total_misplaced = len(status['misplaced'])
        total_safely_issued = len(status.get('safely_issued', []))
        
        session_duration = round(time.time() - session_start_time, 2)
        doc.add_paragraph(f"Total Session Time: {session_duration} seconds")
        
        # --- 3. Scan Speed ---
        avg_speed = "N/A"
        if len(scan_records) > 0:
            avg_speed = round(session_duration / len(scan_records), 2)
        doc.add_paragraph(f"Average Scan Speed: {avg_speed} seconds per item")
        
        doc.add_paragraph(f"Target Department: {status.get('target_department') or 'All General'}")
        doc.add_paragraph(f"Total Missing: {total_missing}")
        doc.add_paragraph(f"Total Found (Available): {total_available}")
        doc.add_paragraph(f"Total Safely Issued: {total_safely_issued}")
        doc.add_paragraph(f"Total Misplaced (Wrong Dept or Not in DB): {total_misplaced}")'''
code = code.replace(old_export, new_export)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(code)

print("Patch script applied!")
