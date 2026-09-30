const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const showcaseDir = path.join(__dirname, '..', 'public', 'showcase');
if (!fs.existsSync(showcaseDir)) {
  fs.mkdirSync(showcaseDir, { recursive: true });
}

const projects = [
  { name: 'aura.png', title: 'AURA CAPITAL', color1: '#111317', color2: '#1e293b', accent: '#315EF7' },
  { name: 'kroma.png', title: 'KROMA STUDIO', color1: '#18181b', color2: '#27272a', accent: '#a855f7' },
  { name: 'vektor.png', title: 'VEKTOR SYSTEMS', color1: '#0f172a', color2: '#1e293b', accent: '#06b6d4' },
  { name: 'nexus.png', title: 'NEXUS COMMERCE', color1: '#172554', color2: '#1e1b4b', accent: '#3b82f6' },
  { name: 'strata.png', title: 'STRATA AI', color1: '#0c0a09', color2: '#1c1917', accent: '#f59e0b' },
  { name: 'pulse.png', title: 'PULSE MEDTECH', color1: '#022c22', color2: '#064e3b', accent: '#10b981' },
];

async function generateAssets() {
  for (const p of projects) {
    const svg = `
      <svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${p.color1}" />
            <stop offset="100%" stop-color="${p.color2}" />
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="800" height="500" fill="url(#bg)" />
        <rect width="800" height="500" fill="url(#grid)" />
        <circle cx="400" cy="220" r="160" fill="${p.accent}" opacity="0.12" filter="blur(60px)" />
        <rect x="80" y="80" width="640" height="340" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <text x="120" y="240" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="28" letter-spacing="2">${p.title}</text>
        <text x="120" y="280" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="16">Runix Production Case Study</text>
        <circle cx="660" cy="140" r="8" fill="${p.accent}" />
      </svg>
    `;

    const dest = path.join(showcaseDir, p.name);
    await sharp(Buffer.from(svg))
      .png({ quality: 85, compressionLevel: 8 })
      .toFile(dest);

    console.log(`Generated: ${p.name} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
  }
}

generateAssets().catch(console.error);
