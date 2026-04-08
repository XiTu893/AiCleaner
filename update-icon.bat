@echo off
echo 使用 rcedit 修改 EXE 图标...
set EXE_PATH=e:\zzp\project\github\AI\AICLeaner\dist-release\win-unpacked\智清大师.exe
set ICON_PATH=e:\zzp\project\github\AI\AICLeaner\dist-release\.icon-ico\icon.ico
set APP_BUILDER=e:\zzp\project\github\AI\AICLeaner\node_modules\app-builder-bin\win\x64\app-builder.exe

echo EXE: %EXE_PATH%
echo ICO: %ICON_PATH%

REM 备份原文件
copy /Y "%EXE_PATH%" "%EXE_PATH%.backup" > nul
echo 已备份原 EXE 文件

REM 使用 rcedit 修改图标
"%APP_BUILDER%" rcedit --args "\"%EXE_PATH%\" --set-icon=\"%ICON_PATH%\""

if %ERRORLEVEL% EQU 0 (
    echo 图标修改成功！
) else (
    echo 图标修改失败，错误代码：%ERRORLEVEL%
)

pause
