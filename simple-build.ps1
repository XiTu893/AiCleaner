# 智清大师 - 简化构建脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  智清大师 - 简化构建脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 清理旧构建
Write-Host "[1/3] 清理旧的构建文件..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
if (Test-Path "dist-release") { Remove-Item "dist-release" -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "✓ 清理完成" -ForegroundColor Green
Write-Host ""

# 构建前端
Write-Host "[2/3] 构建前端代码..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=4096"
& npm run build:renderer
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ 前端构建失败" -ForegroundColor Red
    exit 1
}
Write-Host "✓ 前端构建完成" -ForegroundColor Green
Write-Host ""

# 检查构建结果
Write-Host "[3/3] 检查构建结果..." -ForegroundColor Yellow
if (Test-Path "dist\index.html") {
    Write-Host "✓ 前端构建成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  构建完成！" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "构建输出目录：dist\" -ForegroundColor White
    Write-Host ""
    Write-Host "生成的文件：" -ForegroundColor White
    Get-ChildItem "dist" -Recurse | Select-Object Name, Length | ForEach-Object {
        $size = $_.Length / 1KB
        Write-Host "  $($_.Name) - $([math]::Round($size, 2)) KB" -ForegroundColor White
    }
} else {
    Write-Host "✗ 未找到构建文件，请检查错误信息" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""