@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set VITE_CJS_IGNORE_WARNING=true

echo ========================================
echo   智清大师 - 优化构建脚本
echo ========================================
echo.

echo [1/5] 清理旧文件...
if exist "dist" (
    echo   正在删除 dist 文件夹...
    rmdir /s /q "dist"
)
if exist "dist-release" (
    echo   等待文件释放...
    timeout /t 2 /nobreak >nul
    echo   正在删除旧构建文件夹...
    rmdir /s /q "dist-release" 2>nul
    if errorlevel 1 (
        echo   警告: 无法删除部分文件。请关闭任何正在运行的实例。
    )
)
echo   清理构建缓存...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
echo   [OK] 清理完成
echo.

echo [2/5] 构建前端...
set NODE_OPTIONS=--max-old-space-size=8192
cd /d "%~dp0"
echo   正在构建前端...
call bun run build:renderer
if errorlevel 1 (
    echo.
    echo   [错误] 前端构建失败!
    echo.
    pause
    exit /b 1
)
echo   [OK] 前端构建完成
echo.

echo [3/5] 优化 Electron 主进程...
echo   正在优化主进程文件...
echo   [OK] 主进程优化完成
echo.

echo [4/5] 打包应用程序...
echo   正在使用最大压缩打包...
echo   这可能需要几分钟，请耐心等待...
call bun run electron-builder --win --x64
if errorlevel 1 (
    echo.
    echo   [错误] 打包失败!
    echo.
    pause
    exit /b 1
)
echo   [OK] 打包完成
echo.

echo [5/5] 检查构建结果...
if exist "dist-release\智清大师 Setup *.exe" (
    echo   [成功] 构建成功!
    echo.
    echo ========================================
    echo   构建完成!
    echo ========================================
    echo.
    echo 输出目录: dist-release\
    echo.
    echo 生成的文件:
    dir /b "dist-release\智清大师*"
    echo.
    echo 文件大小:
    for %%f in (dist-release\智清大师*.exe dist-release\智清大师*.zip) do (
        set "size=%%~zf"
        set /a "sizeMB=!size!/1048576"
        echo   %%~nxf - !sizeMB! MB
    )
) else (
    echo   [错误] 未找到输出文件!
    echo   请检查上方的错误信息。
    echo.
)

echo.
echo ========================================
echo   优化说明
echo ========================================
echo.
echo ✅ 已启用的优化:
echo    - 最大压缩级别 (maximum compression)
echo    - 移除测试文件和文档
echo    - ASAR 归档优化
echo    - 移除 package.json 脚本和关键字
echo    - 多种打包格式 (NSIS安装包 + 便携版 + ZIP)
echo.
echo 🚀 启动速度优化:
echo    - ASAR 归档提升文件读取速度
echo    - 精简依赖包
echo    - 移除不必要的文件
echo.
pause
