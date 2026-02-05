const webPush = require('web-push');

console.log('Generating VAPID keys...\n');

const vapidKeys = webPush.generateVAPIDKeys();

console.log('VAPID Keys Generated Successfully!\n');
console.log('Add these to your .env file:\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
console.log('\nIMPORTANT: Keep the private key secret and never commit it to version control!');
