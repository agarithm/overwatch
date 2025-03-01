const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Define the paths
const distIconsPath = path.resolve(__dirname, 'dist/assets/icons');
const srcIconsPath = path.resolve(__dirname, 'src/assets/icons');

// Ensure the directories exist
[distIconsPath, srcIconsPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

function generateIcon(size, outputPath) {
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
  const filePath = path.join(outputPath, `icon${size}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated icon: ${filePath}`);
}

// Generate icons in required sizes
try {
  const sizes = [16, 48, 128];
  // Generate both in src and dist
  [srcIconsPath, distIconsPath].forEach(dir => {
    sizes.forEach(size => generateIcon(size, dir));
  });
  console.log('All icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error);
}
