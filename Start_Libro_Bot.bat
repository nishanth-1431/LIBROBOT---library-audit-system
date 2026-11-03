@echo off
title LIBRO-BOT System Launcher
color 0B

echo ========================================================
echo                 LIBRO-BOT LAUNCHER
echo ========================================================
echo.

echo [+] Starting Python AI Vision Backend Server...
start "LIBRO-BOT Backend Server" cmd /k "cd /d %~dp0legacy\backend && venv\Scripts\python.exe app.py"

echo [+] Starting React Frontend UI Server...
start "LIBRO-BOT Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [+] Waiting 5 seconds for systems to initialize...
timeout /t 5 /nobreak > nul

echo [+] Launching Home Page in your default web browser...
start http://localhost:3000/

echo.
echo ========================================================
echo  All systems are GO! 
echo  You can now close this blue launcher window.
echo.
echo  Note: To stop the website later, simply close the 
echo  two black server windows that just opened.
echo ========================================================
timeout /t 5 > nul
