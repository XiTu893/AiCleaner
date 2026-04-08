const fs = require('fs');
const path = require('path');

function deleteDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        deleteDirectory(filePath);
      } else {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
        }
      }
    }
    try {
      fs.rmdirSync(dirPath);
    } catch (e) {
    }
  }
}

exports.default = async function(context) {
  console.log('[afterPack] 开始优化包大小...');
  
  const appPath = context.appOutDir;
  const resourcesPath = path.join(appPath, 'resources');
  
  console.log('[afterPack] 应用路径:', appPath);
  console.log('[afterPack] 资源路径:', resourcesPath);
  
  let totalDeleted = 0;
  
  try {
    const localesPaths = [
      path.join(resourcesPath, 'app.asar.unpacked', 'locales'),
      path.join(appPath, 'locales')
    ];
    
    const keepLocales = ['zh-CN.pak', 'en-US.pak'];
    
    for (const localesPath of localesPaths) {
      if (fs.existsSync(localesPath)) {
        console.log('[afterPack] 清理 locales 目录:', localesPath);
        
        const files = fs.readdirSync(localesPath);
        let deletedCount = 0;
        
        for (const file of files) {
          if (!keepLocales.includes(file) && file.endsWith('.pak')) {
            const filePath = path.join(localesPath, file);
            try {
              fs.unlinkSync(filePath);
              deletedCount++;
              totalDeleted++;
            } catch (err) {
            }
          }
        }
        
        console.log('[afterPack] 已删除', deletedCount, '个 locale 文件');
      }
    }
    
    const swifterShadersPath = path.join(appPath, 'swiftshader');
    if (fs.existsSync(swifterShadersPath)) {
      console.log('[afterPack] 删除 swiftshader 目录...');
      deleteDirectory(swifterShadersPath);
      console.log('[afterPack] swiftshader 已删除');
      totalDeleted++;
    }
    
    const d3dCompilerPath = path.join(appPath, 'd3dcompiler_47.dll');
    if (fs.existsSync(d3dCompilerPath)) {
      console.log('[afterPack] 删除 d3dcompiler_47.dll...');
      try {
        fs.unlinkSync(d3dCompilerPath);
        totalDeleted++;
      } catch (err) {
      }
    }
    
    const vkSwiftShaderPath = path.join(appPath, 'vk_swiftshader.dll');
    if (fs.existsSync(vkSwiftShaderPath)) {
      console.log('[afterPack] 删除 vk_swiftshader.dll...');
      try {
        fs.unlinkSync(vkSwiftShaderPath);
        totalDeleted++;
      } catch (err) {
      }
    }
    
    const vkIcdPath = path.join(appPath, 'vk_swiftshader_icd.json');
    if (fs.existsSync(vkIcdPath)) {
      console.log('[afterPack] 删除 vk_swiftshader_icd.json...');
      try {
        fs.unlinkSync(vkIcdPath);
        totalDeleted++;
      } catch (err) {
      }
    }
    
    const libEGLPath = path.join(appPath, 'libEGL.dll');
    if (fs.existsSync(libEGLPath)) {
      console.log('[afterPack] 删除 libEGL.dll...');
      try {
        fs.unlinkSync(libEGLPath);
        totalDeleted++;
      } catch (err) {
      }
    }
    
    const libGLESv2Path = path.join(appPath, 'libGLESv2.dll');
    if (fs.existsSync(libGLESv2Path)) {
      console.log('[afterPack] 删除 libGLESv2.dll...');
      try {
        fs.unlinkSync(libGLESv2Path);
        totalDeleted++;
      } catch (err) {
      }
    }
    
    // 保留 V8 启动快照文件，这些文件是运行时必需的
    // const snapshotBlobPath = path.join(appPath, 'snapshot_blob.bin');
    // if (fs.existsSync(snapshotBlobPath)) {
    //   console.log('[afterPack] 删除 snapshot_blob.bin...');
    //   try {
    //     fs.unlinkSync(snapshotBlobPath);
    //     totalDeleted++;
    //   } catch (err) {
    //   }
    // }
    
    // const v8ContextPath = path.join(appPath, 'v8_context_snapshot.bin');
    // if (fs.existsSync(v8ContextPath)) {
    //   console.log('[afterPack] 删除 v8_context_snapshot.bin...');
    //   try {
    //     fs.unlinkSync(v8ContextPath);
    //     totalDeleted++;
    //   } catch (err) {
    //   }
    // }
    
    const LICENSEPath = path.join(appPath, 'LICENSE.electron.txt');
    if (fs.existsSync(LICENSEPath)) {
      console.log('[afterPack] 删除 LICENSE.electron.txt...');
      try {
        fs.unlinkSync(LICENSEPath);
        totalDeleted++;
      } catch (err) {
      }
    }
    
    const LICENSESPath = path.join(appPath, 'LICENSES.chromium.html');
    if (fs.existsSync(LICENSESPath)) {
      console.log('[afterPack] 删除 LICENSES.chromium.html...');
      try {
        fs.unlinkSync(LICENSESPath);
        totalDeleted++;
      } catch (err) {
      }
    }
    
    console.log('[afterPack] 包大小优化完成! 共删除', totalDeleted, '项');
  } catch (error) {
    console.error('[afterPack] 优化过程出错:', error);
  }
};
