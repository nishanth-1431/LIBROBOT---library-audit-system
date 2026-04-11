@echo off
color 0B
echo ===================================================
echo             Libro-Bot Backup Tool                
echo ===================================================
echo.
echo Creating a clean, compressed backup of your project...
echo (This will exclude large folders like node_modules and venv)

:: Ensure git is available
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo Error: Git is not installed. 
    echo Please install Git to use this backup feature.
    pause
    exit /b 1
)

:: Create the archive on the Desktop
git archive --format zip --output "%USERPROFILE%\Desktop\LibroBot_Backup.zip" HEAD

if %errorlevel% neq 0 (
    color 0C
    echo Failed to create backup. Have you committed your changes?
) else (
    color 0A
    echo.
    echo SUCCESS! 
    echo A clean backup file has been placed on your Desktop:
    echo "%USERPROFILE%\Desktop\LibroBot_Backup.zip"
    echo.
    echo You can email this file to yourself, or put it on Google Drive 
    echo to access it from any device!
)

echo.
pause
