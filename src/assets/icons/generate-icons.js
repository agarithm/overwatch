const { createCanvas } = require('canvas');
const fs = require('fs');

// Define the path to create icons
const dirPath = __dirname;

// Ensure the directory exists
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Draw red X
  ctx.strokeStyle = 'red';
  ctx.lineWidth = size / 8;
  
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.2);
  ctx.lineTo(size * 0.8, size * 0.8);
  ctx.moveTo(size * 0.8, size * 0.2);
  ctx.lineTo(size * 0.2, size * 0.8);
  ctx.stroke();

  // Save to PNG file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`${dirPath}/icon${size}.png`, buffer);
  console.log(`Generated icon${size}.png`);
}

// Generate icons in required sizes
try {
  [16, 48, 128].forEach(generateIcon);
  console.log('All icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error);
}
