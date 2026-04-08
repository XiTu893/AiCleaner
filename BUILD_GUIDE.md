# 智清大师 - 快速打包指南

## 🚀 快速打包（推荐）

### 方法 1：使用批处理脚本（最简单）
```bash
# 双击运行或命令行执行
quick-build.bat
```

### 方法 2：使用 PowerShell 脚本
```powershell
# 右键以 PowerShell 运行
.\quick-build.ps1
```

### 方法 3：使用 npm 脚本
```bash
# 快速打包（跳过签名）
bun run build:fast

# 完整打包
bun run build
```

## 📦 打包输出

**输出目录：** `E:\AICleanerBuild\dist-release\win-unpacked\`

**EXE 文件：** `智清大师.exe`

## ⚡ 优化说明

### 打包优化
1. **输出到 E 盘** - 避免 C 盘权限问题
2. **ASAR 打包** - 将代码打包成单个文件，显著提升速度
3. **跳过签名** - 避免 winCodeSign 下载失败问题
4. **增量构建** - 只重新构建变更的部分

### 构建时间
- **前端构建**: ~20 秒
- **Electron 打包**: ~30-60 秒
- **总计**: ~1-2 分钟

## 🖼️ 图标设置

由于 Windows 权限限制，需要手动设置 EXE 图标：

### 使用 Resource Hacker
1. 下载 Resource Hacker：http://www.angusj.com/resourcehacker/
2. 打开 `E:\AICleanerBuild\dist-release\win-unpacked\智清大师.exe`
3. 点击 `Action` → `Add an icon or other resource`
4. 选择 `dist\XiTu-logo.jpg`
5. 保存并替换

### 或者创建快捷方式
```powershell
$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut("E:\AICleanerBuild\智清大师.lnk")
$shortcut.TargetPath = "E:\AICleanerBuild\dist-release\win-unpacked\智清大师.exe"
$shortcut.Save()
```

## 📝 版权信息

- **作者**: 溪土红薯 <28491599@qq.com>
- **版权**: https://github.com/XiTu893 溪土红薯所有
- **商标**: https://github.com/XiTu893 溪土红薯所有

## 🔧 故障排除

### 问题 1：打包失败
```bash
# 清理缓存后重试
Remove-Item "dist" -Recurse -Force
Remove-Item "E:\AICleanerBuild\dist-release" -Recurse -Force
bun run build:fast
```

### 问题 2：权限错误
以管理员身份运行 PowerShell 或 CMD

### 问题 3：网络问题导致下载失败
打包配置已设置 `"sign": null` 跳过签名，不会下载 winCodeSign

## 📊 打包配置详情

```json
{
  "build": {
    "appId": "com.aicleaner.app",
    "productName": "智清大师",
    "directories": {
      "output": "E:/AICleanerBuild/dist-release"
    },
    "asar": true,  // 启用 ASAR 打包
    "win": {
      "target": "dir",
      "icon": "dist/XiTu-logo.jpg",
      "sign": null  // 跳过签名
    }
  }
}
```

## 💡 提示

- 首次打包可能需要下载 Electron，请稍等
- 后续打包会使用缓存，速度更快
- 建议定期清理 `node_modules\.cache` 目录
- 打包后的 EXE 大小约 170MB
