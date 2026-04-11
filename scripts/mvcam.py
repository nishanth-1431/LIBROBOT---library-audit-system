import cv2
from pyzbar.pyzbar import decode
from datetime import datetime
from openpyxl import Workbook, load_workbook
import os

# ==========================
# EXCEL FILE SETUP
# ==========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_name = os.path.join(os.path.dirname(BASE_DIR), "data", "scanned_barcodes.xlsx")

if not os.path.exists(file_name):
    wb = Workbook()
    ws = wb.active
    ws.title = "Scans"
    ws.append(["Barcode", "Date", "Time"])  # Column headers
    wb.save(file_name)
    wb.close()

wb = load_workbook(file_name)
ws = wb.active

# ==========================
# START CAMERA
# ==========================
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Camera not accessible")
    exit()

print("📷 Scanner started")
print("📄 Data will be saved to Excel")
print("Press 'q' to quit")

scanned_codes = set()

# ==========================
# MAIN LOOP
# ==========================
while True:
    ret, frame = cap.read()
    if not ret:
        break

    for barcode in decode(frame):
        # Ignore QR codes
        if barcode.type == "QRCODE":
            continue

        barcode_data = barcode.data.decode("utf-8")

        if barcode_data not in scanned_codes:
            now = datetime.now()

            # ✅ Append new row
            ws.append([
                barcode_data,
                now.strftime("%Y-%m-%d"),
                now.strftime("%H:%M:%S")
            ])
            wb.save(file_name)

            print("✅ Appended:", barcode_data)
            scanned_codes.add(barcode_data)

        # Draw rectangle
        x, y, w, h = barcode.rect
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(
            frame,
            barcode_data,
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

    cv2.imshow("Barcode Scanner", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ==========================
# CLEANUP
# ==========================
cap.release()
wb.close()
cv2.destroyAllWindows()
print("🛑 Scanner stopped")