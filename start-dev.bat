@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   ZhiQing Master - Development Mode
echo ========================================
echo.

echo Step 1/3: Cleaning cache...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
echo   [OK] Cache cleaned
echo.

echo Step 2/3: Setting environment...
set NODE_OPTIONS=--max-old-space-size=4096
cd /d "%~dp0"
echo   [OK] Environment ready
echo.

echo Step 3/3: Starting development server...
echo   Running: bun run dev
echo.
echo   Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call bun run dev

if errorlevel 1 (
    echo.
    echo   [ERROR] Development server failed to start!
    echo.
    pause
    exit /b 1
)

pause
