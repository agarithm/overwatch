const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

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
  fs.writeFileSync(`icon${size}.png`, buffer);
}

// Generate icons in required sizes
[16, 48, 128].forEach(generateIcon);
