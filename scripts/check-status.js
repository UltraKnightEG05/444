const venom = require('venom-bot');

venom
  .create({
    session: 'session-name', // اسم الجلسة
    multidevice: true
  })
  .then((client) => {
    console.log('✅ تم الاتصال بنجاح');

    client.onStateChange((state) => {
      console.log('📡 حالة الاتصال:', state);

      // الحالات التي تُعتبر اتصال سليم بعد تحديث Venom
      const stableStates = ['isLogged', 'CONNECTED', 'waitChat', 'qrReadSuccess'];

      if (stableStates.includes(state)) {
        console.log('🔗 الاتصال مستقر');
      }

      if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
        client.useHere(); // إعادة محاولة الاتصال في حال التعارض
      }
    });

    client.getHostDevice().then((device) => {
      console.log('🧾 معلومات الجهاز:', device);
    });

    // أغلق بعد 10 ثواني (اختياري)
    setTimeout(() => {
      console.log('🛑 إنهاء الفحص');
      process.exit();
    }, 10000);
  })
  .catch((err) => {
    console.error('❌ فشل الاتصال:', err);
  });
