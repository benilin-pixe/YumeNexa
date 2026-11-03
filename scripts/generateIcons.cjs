const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const svgPath = path.resolve(__dirname, '../public/icon.svg');
const publicDir = path.resolve(__dirname, '../public');

async function generateIcons() {
  console.log('Generating YumeNexa PWA and Favicon assets from master SVG...');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
  ];

  for (const t of targets) {
    const dest = path.join(publicDir, t.name);
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(dest);
    console.log(`Generated ${t.name} (${t.size}x${t.size})`);
  }

  // Generate pwa-maskable-512x512.png (padded)
  const maskableDest = path.join(publicDir, 'pwa-maskable-512x512.png');
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 11, g: 15, b: 25, alpha: 1 }, // #0b0f19
    })
    .png()
    .toFile(maskableDest);
  console.log('Generated pwa-maskable-512x512.png');

  // Copy 32x32 png to favicon.ico for fallback compatibility
  const icoDest = path.join(publicDir, 'favicon.ico');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(icoDest);
  console.log('Generated favicon.ico');

  console.log('All favicon and PWA assets generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
