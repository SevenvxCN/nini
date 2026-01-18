@echo off
cd /d "%~dp0"
title SillyTavern GPT-SoVITS Launcher

echo [INFO] Starting up...
echo [INFO] Current path: %cd%

:: 1. Attempt to detect Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 'python' command not found!
    echo Please confirm that Python is installed and "Add Python to PATH" was checked during installation.
    echo Or try reinstalling Python 3.10+.
    echo.
    pause
    exit
)

:: 2. Install/Update dependencies
echo [INFO] Checking dependencies...
pip install -r requirements.txt

:: 3. Start Service
echo.
echo [INFO] Preparing to start Manager...
echo [INFO] If "Uvicorn running..." appears, the startup is successful.
echo [INFO] Admin UI will open automatically in your browser...
echo ---------------------------------------------------

:: 后台启动一个延迟任务,5秒后自动打开浏览器
start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000/admin"

python manager.py

:: 4. Pause on exit
echo.
echo ---------------------------------------------------
echo [INFO] Program has stopped running.
pause
