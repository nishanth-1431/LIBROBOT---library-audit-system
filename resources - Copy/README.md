# LIBRO-BOT - Smart Library Scanner

A fully OpenCV-based full-stack library stock checking web application with a robotics-style interactive React frontend.

## 📁 Folder Structure

```text
d:\projects\final_lib\
│   app.py                  # Flask backend main application
│   books_database.xlsx     # Main database (Excel file)
│   requirements.txt        # Python backend dependencies
│   README.md               # Setup instructions and documentation
│
└───frontend/               # React frontend working directory
    │   package.json        # Frontend dependencies
    │   vite.config.js      # Vite bundler configuration
    │   index.html          # Frontend entry HTML
    │
    └───src/                # React source code files
        │   main.jsx        # App entry point
        │   App.jsx         # App router
        │   index.css       # Pure CSS for custom robotics styling
        │
        └───pages/
            │   Home.jsx      # Landing page w/ animations
            │   Dashboard.jsx # Main Dashboard UI (Live Camera & Status Panels)
```

## 🛠️ Setup Instructions

### 1. Requirements
- Node.js (v18+)
- Python (v3.8+)
- Local Camera (Webcam) connected
- A fully structured `books_database.xlsx` file placed in the backend root containing Columns `Barcode`, `Book Name`, and `Author`.

### 2. Backend Setup
Open a terminal in the root folder (`d:\projects\final_lib`) and run:
```bash
# 1. Install required Python packages
pip install -r requirements.txt

# 2. Start the Flask application
python app.py
```
*The backend will be running on `http://localhost:5000`*

### 3. Frontend Setup
Open another terminal, navigate to the `frontend` folder (`d:\projects\final_lib\frontend`) and run:
```bash
# 1. Install Node.js dependencies
npm install

# 2. Start the Vite React development server
npm run dev
```
*The frontend will be running on `http://localhost:3000`*

## ⚙️ How It Works
- The Home Page displays a futuristic UI with glowing accents. Entering the system opens the Dashboard.
- The **OpenCV Web Camera** feed will automatically start identifying barcodes.
- Scanned barcodes are automatically matched against the permanent `books_database.xlsx` file.
- **AVAILABLE**: Book is found in DB and has been scanned.
- **MISSING**: Book is present in DB but has not been scanned yet.
- **MISPLACED**: Scanned barcode that doesn't exist in the database.
- Click **RESET SESSION** to quickly clear runtime memory (scanned books) without modifying the main database.
