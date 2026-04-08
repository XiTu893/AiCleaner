# 使用 app-builder 的 rcedit 命令来修改 EXE 图标
$exePath = "e:\zzp\project\github\AI\AICLeaner\dist-release\win-unpacked\智清大师.exe"
$iconPath = "e:\zzp\project\github\AI\AICLeaner\dist-release\.icon-ico\icon.ico"
$appBuilder = "e:\zzp\project\github\AI\AICLeaner\node_modules\app-builder-bin\win\x64\app-builder.exe"

if (Test-Path $appBuilder) {
    Write-Host "找到 app-builder，使用 rcedit 修改图标..."
    Write-Host "EXE: $exePath"
    Write-Host "ICO: $iconPath"
    
    # 备份原文件
    $backupPath = $exePath + ".backup"
    Copy-Item $exePath $backupPath -Force
    Write-Host "已备份原 EXE 文件"
    
    # 使用 rcedit 命令修改图标
    & $appBuilder rcedit --args "`"$exePath`" --set-icon=`"$iconPath`""
    
    if ($?) {
        Write-Host "图标修改成功！" -ForegroundColor Green
    } else {
        Write-Host "图标修改失败，请检查错误信息" -ForegroundColor Red
    }
} else {
    Write-Host "app-builder 未找到" -ForegroundColor Red
}
