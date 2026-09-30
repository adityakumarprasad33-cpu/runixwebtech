const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const conf = {};
for (const line of lines) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    conf[k] = v;
  }
}
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const privateKey = conf.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
const app = initializeApp({
  credential: cert({
    projectId: conf.FIREBASE_PROJECT_ID,
    clientEmail: conf.FIREBASE_CLIENT_EMAIL,
    privateKey,
  })
});
const db = getFirestore(app);

const coupons = [
  {
    code: 'LAUNCH1',
    type: 'percentage',
    value: 25,
    maxDiscount: 0,
    minOrderValue: 0,
    usageLimit: 500,
    usedCount: 0,
    pendingReservations: 0,
    scope: 'all',
    applicablePlans: ['all'],
    applicableAddons: ['all'],
    isActive: true,
    bannerText: 'Special Launch Offer: Get 25% OFF on your website sprint with code LAUNCH1!',
    showAsBanner: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    code: 'RUNIX50',
    type: 'percentage',
    value: 10,
    maxDiscount: 0,
    minOrderValue: 0,
    usageLimit: 1000,
    usedCount: 0,
    pendingReservations: 0,
    scope: 'all',
    applicablePlans: ['all'],
    applicableAddons: ['all'],
    isActive: true,
    bannerText: 'Exclusive Launch Promo: Save 10% on your full website build sprint!',
    showAsBanner: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

async function seed() {
  for (const c of coupons) {
    const existing = await db.collection('coupons').where('code', '==', c.code).get();
    if (existing.empty) {
      const ref = await db.collection('coupons').add(c);
      console.log('Created coupon:', c.code, 'with id:', ref.id);
    } else {
      console.log('Coupon already exists:', c.code);
    }
  }
  console.log('Seed completed successfully.');
}
seed();
