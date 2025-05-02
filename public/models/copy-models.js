const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', '..', 'node_modules', '@vladmandic', 'face-api', 'model');
const targetDir = path.join(__dirname);

// Create models directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

// Copy all model files
fs.readdirSync(sourceDir).forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${file} to models directory`);
});