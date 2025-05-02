const https = require('https');
const fs = require('fs');
const path = require('path');

const modelFiles = [
    'tiny_face_detector_model-shard1',
    'tiny_face_detector_model-weights_manifest',
    'face_landmark_68_model-shard1',
    'face_landmark_68_model-weights_manifest',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    'face_recognition_model-weights_manifest'
];

const baseUrl = 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights/';

if (!fs.existsSync('./models')) {
    fs.mkdirSync('./models');
}

modelFiles.forEach(file => {
    const fileName = `${file}${file.includes('manifest') ? '.json' : ''}`; 
    const fileUrl = `${baseUrl}${fileName}`;
    
    https.get(fileUrl, (response) => {
        const filePath = path.join('./models', fileName);
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
            console.log(`Downloaded ${fileName}`);
            fileStream.close();
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${fileName}:`, err);
    });
});