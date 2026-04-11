@echo off
color 0A
echo ===================================================
echo       Libro-Bot Project Setup and Installation       
echo ===================================================
echo.

:: Check for Python
echo [1/4] Checking for Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo Python is not installed! Please install Python 3.8 or higher.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo Python found.
echo.

:: Check for Node.js
echo [2/4] Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo Node.js is not installed! Please install Node.js.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found.
echo.

:: Check for ZBar (Windows dependency for pyzbar just in case)
echo [3/4] Note about ZBar Barcode Reader...
echo If you face pyzbar DLL errors later, you will need to install ZBar:
echo 1. Download: https://sourceforge.net/projects/zbar/files/zbar/0.10/zbar-0.10-setup.exe/download
echo 2. Run the installer.
echo (Most Windows systems will work fine with just pyzbar installed via pip)
echo.

:: Setup Backend
echo [4/4] Setting up Backend dependencies...
cd backend
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)
echo Activating virtual environment and installing packages...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
echo Backend setup complete!
echo.

:: Setup Frontend
echo [5/5] Setting up Frontend dependencies...
cd frontend
echo Installing Node modules (this might take a few minutes)...
call npm install
cd ..
echo Frontend setup complete!
echo.

echo ===================================================
echo Setup is fully complete!
echo Use Start_Libro_Bot.bat to run the project.
echo ===================================================
pause
