const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS = [
  'public/images/heroes/home/home-01.jpg',
  'public/images/heroes/home/home-02.jpg',
  'public/images/heroes/home/home-03.jpg',
  'public/images/heroes/home/home-04.jpg',
  'public/images/heroes/home/home-05.jpg',
  'public/images/heroes/work/work-hero.jpg',
  'public/images/heroes/services/services-hero.jpg',
  'public/images/heroes/pricing/pricing-hero.jpg',
  'public/images/heroes/about/about-hero.jpg',
  'public/images/heroes/contact/contact-hero.jpg',
  'public/images/heroes/login/login-hero.jpg',
  'public/images/heroes/signup/signup-hero.jpg',
];

async function processAsset(inputPath) {
  if (!fs.existsSync(inputPath)) {
    console.warn(`File not found: ${inputPath}`);
    return;
  }

  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);

  const desktopAvif = path.join(dir, `${base}.avif`);
  const desktopWebp = path.join(dir, `${base}.webp`);
  const mobileAvif = path.join(dir, `${base}-mobile.avif`);
  const mobileWebp = path.join(dir, `${base}-mobile.webp`);

  const initialSize = fs.statSync(inputPath).size;

  // 1. Desktop AVIF (1920x1080 cover)
  await sharp(inputPath)
    .resize(1920, 1080, { fit: 'cover', position: 'center' })
    .avif({ quality: 80, effort: 4 })
    .toFile(desktopAvif);

  // 2. Desktop WebP (1920x1080 cover)
  await sharp(inputPath)
    .resize(1920, 1080, { fit: 'cover', position: 'center' })
    .webp({ quality: 84, effort: 4 })
    .toFile(desktopWebp);

  // 3. Mobile WebP (750x1000 art-directed vertical crop focused on right 70% subject)
  await sharp(inputPath)
    .resize(750, 1000, { fit: 'cover', position: 'right' })
    .webp({ quality: 82, effort: 4 })
    .toFile(mobileWebp);

  // 4. Mobile AVIF (750x1000 art-directed vertical crop)
  await sharp(inputPath)
    .resize(750, 1000, { fit: 'cover', position: 'right' })
    .avif({ quality: 78, effort: 4 })
    .toFile(mobileAvif);

  const dAvifSize = fs.statSync(desktopAvif).size;
  const dWebpSize = fs.statSync(desktopWebp).size;
  const mAvifSize = fs.statSync(mobileAvif).size;
  const mWebpSize = fs.statSync(mobileWebp).size;

  console.log(`[${base}]`);
  console.log(`  Original: ${(initialSize / 1024).toFixed(1)} KB`);
  console.log(`  Desktop AVIF: ${(dAvifSize / 1024).toFixed(1)} KB | WebP: ${(dWebpSize / 1024).toFixed(1)} KB`);
  console.log(`  Mobile AVIF: ${(mAvifSize / 1024).toFixed(1)} KB | WebP: ${(mWebpSize / 1024).toFixed(1)} KB`);
}

async function main() {
  console.log('Optimizing all 12 hero assets to responsive AVIF and WebP...\n');
  for (const asset of ASSETS) {
    await processAsset(asset);
  }
  console.log('\nAll hero assets successfully optimized!');
}

main().catch(console.error);
