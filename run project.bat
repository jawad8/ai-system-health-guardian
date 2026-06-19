@echo off
setlocal EnableExtensions

title AI System Health Guardian Launcher
cd /d "%~dp0"

echo.
echo ============================================================
echo       AI System Health Guardian Monitoring Platform
echo ============================================================
echo.

set "PYTHON_CMD="
where py >nul 2>&1
if not errorlevel 1 (
    py -3.13 -c "import sys" >nul 2>&1 && set "PYTHON_CMD=py -3.13"
    if not defined PYTHON_CMD py -3.12 -c "import sys" >nul 2>&1 && set "PYTHON_CMD=py -3.12"
    if not defined PYTHON_CMD py -3.11 -c "import sys" >nul 2>&1 && set "PYTHON_CMD=py -3.11"
)

if not defined PYTHON_CMD (
    where python >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    echo [ERROR] Python is not installed or is not available in PATH.
    echo Install Python 3.11 or newer and run this file again.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or is not available in PATH.
    echo Install Node.js 20 or newer and run this file again.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or is not available in PATH.
    pause
    exit /b 1
)

if not exist "backend\.venv-guardian\Scripts\python.exe" (
    echo [SETUP] Creating the Python virtual environment...
    %PYTHON_CMD% -m venv "backend\.venv-guardian"
    if errorlevel 1 (
        echo [ERROR] Could not create the Python virtual environment.
        pause
        exit /b 1
    )
)

if not exist "backend\.venv-guardian\.dependencies-installed" (
    echo [SETUP] Installing backend dependencies...
    "backend\.venv-guardian\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
    if errorlevel 1 (
        echo [ERROR] Backend dependency installation failed.
        pause
        exit /b 1
    )
    type nul > "backend\.venv-guardian\.dependencies-installed"
)

if not exist "frontend\node_modules" (
    echo [SETUP] Installing frontend dependencies...
    pushd "frontend"
    call npm.cmd install
    if errorlevel 1 (
        popd
        echo [ERROR] Frontend dependency installation failed.
        pause
        exit /b 1
    )
    popd
)

echo [START] Launching FastAPI backend on http://localhost:8000 ...
start "Guardian Backend" /D "%~dp0backend" cmd /k ""%~dp0backend\.venv-guardian\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [START] Launching Next.js frontend on http://localhost:3000 ...
start "Guardian Frontend" /D "%~dp0frontend" cmd /k "npm.cmd run dev"

echo.
echo Services are starting in separate terminal windows.
echo.
echo Dashboard:     http://localhost:3000
echo API:           http://localhost:8000
echo API Documents: http://localhost:8000/docs
echo.
echo Keep the service windows open while using the platform.
echo Press any key to open the dashboard in your browser.
pause >nul

start "" "http://localhost:3000"
exit /b 0
