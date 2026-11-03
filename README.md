# Libro-Bot — Smart Library Auditing Robot

**Libro-Bot** is an automated robot designed to revolutionize library inventory management. It scans library shelves rack by rack, reads barcodes using a high-precision vision system, and flags missing or misplaced books on a live web dashboard. The entire system is built to be practical, scalable, and cost-effective for modern libraries.

## 🚀 Key Features
- **Automated Scanning**: Scans library shelves sequentially with high barcode recognition accuracy.
- **Real-time Dashboard**: Live view of audit progress, detected books, and shelf status.
- **Misplacement Detection**: Automatically identifies books that are on the wrong shelves based on the central database.
- **Inventory Sync**: Seamless integration with Excel-based library databases for easy management.

## 🔄 How It Works
1. **Live Camera Feed:** Optical camera captures real-time video of shelf book spines.
2. **Barcode Decoding:** PyZbar decodes barcodes on each spine as the cart moves along the rack.
3. **Database Verification:** Each barcode is verified against catalog records in real time.
4. **Classification:** Books are classified as Available, Missing, Misplaced, or Safely Issued.
5. **Real-time Push:** Status updates and misplacement alerts are pushed via WebSockets to the dashboard.

## 🛠️ Tech Stack
### Hardware
- Custom scanning cart with high-resolution USB optical camera module
- High-speed barcode scanning & real-time frame capture

### Software
- **Backend**: Python, Flask, OpenCV, PyZbar
- **Frontend**: React, Socket.io, Recharts, Tailwind CSS
- **Database**: Excel-synced synchronized inventory

## 🏆 Achievements
- 🥇 **1st Prize** — UDHIYAM'26, KIT Coimbatore
- 🏆 **Best Startup Idea** — SREC INNOVATE, SREC

## 📁 Repository Structure
- `backend/`: Flask server handling computer vision, database logic, and API endpoints.
- `frontend/`: React-based interactive dashboard and audit interface.
- `scripts/`: Utility scripts for system configuration and camera tuning.
- `data/`: Contains database schemas and sample inventory datasets.

## ⚙️ Quick Start
1. **Prerequisites**: Ensure you have Python 3.8+ and Node.js installed.
2. **Setup**: Run `setup.bat` to automatically install all dependencies for both backend and frontend.
3. **Run**: Use `Start_Libro_Bot.bat` to launch the backend server and frontend application simultaneously.

---
*Developed by Nishanth P*
