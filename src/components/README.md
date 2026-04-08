# 组件目录结构

## 📁 文件夹分类

按照导航大类组织组件，便于管理和维护。

### 📂 文件夹说明

| 文件夹 | 说明 | 主要组件 |
|--------|------|---------|
| **overview/** | 首页 | Overview.tsx |
| **hardware/** | 硬件检测 | HardwareDetection, HardwareCheck, HardwareInfo, GPUStatus, ScreenTest |
| **benchmark/** | 性能评测 | Benchmark, BenchmarkOverall, BenchmarkSub, StressTest |
| **monitor/** | 硬件监控 | HardwareMonitor, TemperatureMonitor, HardwareHealth |
| **cleaner/** | 清理优化 | Cleaner, JunkCleaner, CDriveCleaner, MemoryRelease, OptimizeSpeed |
| **driver/** | 驱动管理 | DriverManager, DriverDetect, DriverBackup |
| **software/** | 软件管理 | SoftwareManager, SoftwareUninstall, SoftwareUpgrade, PackageCleaner |
| **tools/** | 实用工具 | Tools, DesktopMonitor, PowerCalculator, DataRecovery, FileShredder |
| **support/** | 技术支持 | Support, About, HelpPage, FeedbackPage |
| **common/** | 公共组件 | HorizontalTabs, DebugPanel |

## 🗂️ 文件结构

```
components/
├── overview/          # 首页组件
│   └── Overview.tsx
├── hardware/          # 硬件检测组件
│   ├── HardwareDetection.tsx
│   ├── HardwareCheck.tsx
│   ├── HardwareInfo.tsx
│   ├── GPUStatus.tsx
│   └── ScreenTest.tsx
├── benchmark/         # 性能评测组件
│   ├── Benchmark.tsx
│   ├── BenchmarkOverall.tsx
│   ├── BenchmarkSub.tsx
│   ├── BenchmarkRank.tsx
│   └── StressTest.tsx
├── monitor/           # 硬件监控组件
│   ├── HardwareMonitor.tsx
│   ├── TemperatureMonitor.tsx
│   ├── HardwareHealth.tsx
│   └── Temperature.tsx
├── cleaner/           # 清理优化组件
│   ├── Cleaner.tsx
│   ├── JunkCleaner.tsx
│   ├── CDriveCleaner.tsx
│   ├── DesktopOrganizer.tsx
│   ├── MemoryRelease.tsx
│   ├── OptimizeSpeed.tsx
│   └── PowerSaving.tsx
├── driver/            # 驱动管理组件
│   ├── DriverManager.tsx
│   ├── DriverDetect.tsx
│   └── DriverBackup.tsx
├── software/          # 软件管理组件
│   ├── SoftwareManager.tsx
│   ├── SoftwareUninstall.tsx
│   ├── SoftwareUninstaller.tsx
│   ├── SoftwareUpgrade.tsx
│   └── PackageCleaner.tsx
├── tools/             # 实用工具组件
│   ├── Tools.tsx
│   ├── DesktopMonitor.tsx
│   ├── PowerCalculator.tsx
│   ├── DataRecovery.tsx
│   ├── FileShredder.tsx
│   └── TaskManager.tsx
├── support/           # 技术支持组件
│   ├── Support.tsx
│   ├── About.tsx
│   ├── AboutPage.tsx
│   ├── HelpPage.tsx
│   └── FeedbackPage.tsx
└── common/            # 公共组件
    ├── HorizontalTabs.tsx
    └── DebugPanel.tsx
```

## 📝 导入示例

```typescript
// 主应用导入
import Overview from './components/overview/Overview';
import HardwareDetection from './components/hardware/HardwareDetection';
import Benchmark from './components/benchmark/Benchmark';
import HardwareMonitor from './components/monitor/HardwareMonitor';
import Cleaner from './components/cleaner/Cleaner';
import DriverManager from './components/driver/DriverManager';
import SoftwareManager from './components/software/SoftwareManager';
import Tools from './components/tools/Tools';
import Support from './components/support/Support';

// 公共组件导入
import HorizontalTabs from './components/common/HorizontalTabs';
import DebugPanel from './components/common/DebugPanel';
```

## 🎯 组织原则

1. **按功能模块划分**：每个导航大类对应一个文件夹
2. **主组件与子组件同级**：便于查找和维护
3. **公共组件独立**：HorizontalTabs、DebugPanel 等通用组件放在 common 文件夹
4. **命名规范**：组件文件名使用 PascalCase，与组件名保持一致

## 🔄 热加载

所有组件支持 Vite 热加载，修改后自动更新无需刷新页面。
