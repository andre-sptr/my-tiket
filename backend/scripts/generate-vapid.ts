/**
 * Generate VAPID keys untuk Web Push
 * Jalankan: npm run vapid:generate
 */
import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('\n✅ VAPID Keys generated! Tambahkan ke .env:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\n⚠️  Simpan VAPID_PRIVATE_KEY dengan aman. Jangan share ke siapapun.\n');
