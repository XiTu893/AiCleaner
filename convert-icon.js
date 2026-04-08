const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');

const inputPath = path.join(__dirname, 'public', 'XiTu-logo.jpg');
const outputPath = path.join(__dirname, 'public', 'XiTu-logo.ico');

console.log('正在转换logo为ICO格式...');

// 读取输入图片
const inputBuffer = fs.readFileSync(inputPath);

// 转换为ICO
toIco(inputBuffer, {
  sizes: [16, 32, 48, 64, 128, 256]
}).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log('ICO文件已生成:', outputPath);
}).catch(error => {
  console.error('转换失败:', error);
});
