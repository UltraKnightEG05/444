const venom = require('venom-bot');

const phoneNumber = process.env.TEST_PHONE_NUMBER || '201002246668';
const message = '📢 تم إرسال هذه الرسالة بنجاح من نظام الحضور لاختبار الاتصال بالواتساب.';

console.log('🧪 بدء اختبار الواتساب...');

// إعداد خيارات Venom
const venomOptions = {
  session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system-proxy',
  folderNameToken: './tokens', // مهم لتخزين بيانات الجلسة
  headless: true,
  multidevice: true,
  disableWelcome: true,
  disableSpins: true
};

// إنشاء الجلسة
venom
  .create(venomOptions)
  .then(client => start(client))
  .catch(error => console.error('❌ خطأ أثناء إنشاء الجلسة:', error));

async function start(client) {
  try {
    console.log('⏳ جاري التحقق من حالة الاتصال...');
    const state = await client.getConnectionState();
    console.log('📡 حالة الاتصال الحالية:', state);

    if (!['CONNECTED', 'SYNCING', 'PAIRING', 'OPENING'].includes(state)) {
      console.error('❌ الجلسة غير متصلة حالياً، أعد المحاولة بعد التأكد من الربط.');
      process.exit(1);
    }

    // تنسيق الرقم
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    const formattedNumber = `${cleanNumber}@c.us`;

    const sentMsg = await client.sendText(formattedNumber, message);
    console.log('✅ تم إرسال الرسالة بنجاح:', sentMsg.id);

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ أثناء إرسال الرسالة:', error);
    process.exit(1);
  }
}
