const WhatsAppService = require('./services/whatsappService');

async function testWhatsAppWebJS() {
  console.log('🧪 اختبار WhatsApp-Web.js...');
  console.log('🎯 اختبار شامل للخدمة المحسنة');
  
  const service = new WhatsAppService();
  
  try {
    console.log('🚀 بدء التهيئة...');
    const initResult = await service.initialize();
    
    if (!initResult.success) {
      console.error('❌ فشل في التهيئة:', initResult.message);
      return;
    }
    
    console.log('✅ تم بدء التهيئة بنجاح');
    
    // انتظار الجاهزية الكاملة
    console.log('⏳ انتظار الجاهزية الكاملة...');
    let readyAttempts = 0;
    const maxReadyAttempts = 60; // 5 دقائق
    
    while (!service.isReady && readyAttempts < maxReadyAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      readyAttempts++;
      
      const status = service.getConnectionStatus();
      
      if (readyAttempts % 6 === 0) { // كل 30 ثانية
        console.log(`🔍 محاولة ${readyAttempts}/${maxReadyAttempts}:`);
        console.log(`   🔗 متصل: ${status.connected ? '✅' : '❌'}`);
        console.log(`   ✅ جاهز: ${status.ready ? '✅' : '❌'}`);
        console.log(`   📱 آخر نشاط: ${status.lastActivity || 'لا يوجد'}`);
      }
      
      if (status.ready) {
        break;
      }
    }
    
    // فحص نهائي شامل
    console.log('🔍 فحص نهائي شامل...');
    const finalStatus = service.getConnectionStatus();
    
    console.log('📊 الحالة النهائية:');
    console.log(`   🔗 متصل: ${finalStatus.connected ? '✅' : '❌'}`);
    console.log(`   ✅ جاهز للإرسال: ${finalStatus.ready ? '✅' : '❌'}`);
    console.log(`   📱 الخدمة: ${finalStatus.service}`);
    console.log(`   🔢 الإصدار: ${finalStatus.version}`);
    console.log(`   📅 آخر نشاط: ${finalStatus.lastActivity || 'لا يوجد'}`);
    
    if (finalStatus.ready) {
      console.log('🎉 النظام جاهز بالكامل للإرسال!');
      
      // اختبار إرسال رسالة نهائي
      const testPhone = process.env.TEST_PHONE_NUMBER || '201002246668';
      console.log(`📱 اختبار إرسال نهائي إلى: ${testPhone}`);
      
      const testResult = await service.testMessage(testPhone, 
        '🎉 تم التحويل إلى WhatsApp-Web.js بنجاح!\n\nالنظام يعمل بشكل مثالي بدون مشاكل.\n\nالوقت: ' + new Date().toLocaleString('en-GB')
      );
      
      if (testResult.success) {
        console.log('🎉🎉🎉 تم إرسال رسالة الاختبار بنجاح!');
        console.log('✅✅✅ WhatsApp-Web.js يعمل بشكل مثالي!');
        console.log('🚀 النظام جاهز للاستخدام الكامل');
        
        // جلب معلومات الحساب
        const accountInfo = await service.getClientInfo();
        if (accountInfo) {
          console.log('👤 معلومات الحساب:');
          console.log(`   📱 الرقم: ${accountInfo.phone}`);
          console.log(`   👤 الاسم: ${accountInfo.name}`);
          console.log(`   🔋 البطارية: ${accountInfo.battery}%`);
          console.log(`   📶 متصل: ${accountInfo.connected ? 'نعم' : 'لا'}`);
        }
      } else {
        console.error('❌ فشل في إرسال رسالة الاختبار:', testResult.error);
      }
    } else {
      console.error('❌ النظام غير جاهز للإرسال');
      console.log('💡 جرب إعادة تشغيل الخادم مرة أخرى');
      console.log('💡 أو استخدم: npm run clean:ultimate && start-whatsapp-web-js.bat');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    console.log('🔌 قطع الاتصال...');
    await service.disconnect();
    process.exit(0);
  }
}

testWhatsAppWebJS();