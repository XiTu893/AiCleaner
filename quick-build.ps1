# 智清大师 - 快速打包脚本 (PowerShell 版本)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  智清大师 - 快速打包脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 清理旧构建
Write-Host "[1/4] 清理旧的构建文件..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
if (Test-Path "E:\AICleanerBuild\dist-release") { Remove-Item "E:\AICleanerBuild\dist-release" -Recurse -Force }
Write-Host "✓ 清理完成" -ForegroundColor Green
Write-Host ""

# 构建前端
Write-Host "[2/4] 构建前端代码..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=4096"
& bun run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 前端构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 前端构建完成" -ForegroundColor Green
Write-Host ""

# 打包已完成
Write-Host "[3/4] 打包步骤已在 build 命令中完成" -ForegroundColor Gray
Write-Host ""

# 检查是否生成 EXE
Write-Host "[4/4] 检查打包结果..." -ForegroundColor Yellow
if (Test-Path "E:\AICleanerBuild\dist-release\win-unpacked\智清大师.exe") {
    Write-Host "✓ 打包成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  打包完成！" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "EXE 路径：E:\AICleanerBuild\dist-release\win-unpacked\智清大师.exe" -ForegroundColor White
    Write-Host ""
    Write-Host "提示：图标设置需要使用 Resource Hacker 手动处理" -ForegroundColor Gray
    Write-Host "图标文件：dist\XiTu-logo.jpg" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✗ 未找到 EXE 文件，请检查错误信息" -ForegroundColor Red
    Write-Host ""
}

Write-Host "按任意键继续..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
