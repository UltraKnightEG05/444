const WhatsAppService = require('./services/whatsappService');

async function ultimateTest() {
  console.log('🧪 الاختبار النهائي لـ venom v5.3.0...');
  console.log('🎯 اختبار شامل لحل مشكلة getMaybeMeUser + WebSocket مع v5.3.0');
  
  const service = new WhatsAppService();
  
  try {
    console.log('🚀 بدء التهيئة النهائية مع v5.3.0...');
    const initResult = await service.initialize();
    
    if (!initResult.success) {
      console.error('❌ فشل في التهيئة:', initResult.message);
      return;
    }
    
    console.log('✅ تم الاتصال بنجاح مع v5.3.0');
    
    // انتظار الجاهزية الكاملة مع فحص مكثف لـ v5.3.0
    console.log('⏳ انتظار الجاهزية الكاملة مع فحص مكثف لـ v5.3.0...');
    let readyAttempts = 0;
    const maxReadyAttempts = 100; // 8 دقائق
    
    while ((!service.isReady || !service.wapiReady || !service.getMaybeMeUserWorking) && readyAttempts < maxReadyAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const status = await service.checkFullReadinessWithV530Fix();
      readyAttempts++;
      
      console.log(`🔍 محاولة ${readyAttempts}/${maxReadyAttempts} (v5.3.0):`);
      console.log(`   📊 Store: ${status.storeReady ? '✅' : '❌'}`);
      console.log(`   🔧 WAPI: ${status.wapiReady ? '✅' : '❌'}`);
      console.log(`   👤 getMaybeMeUser: ${status.getMaybeMeUserWorking ? '✅' : '❌'}`);
      console.log(`   🎯 جاهز بالكامل: ${status.isFullyReady ? '✅' : '❌'}`);
      
      if (status.isFullyReady) {
        service.storeReady = status.storeReady;
        service.wapiReady = status.wapiReady;
        service.isReady = status.wapiReady;
        service.getMaybeMeUserWorking = status.getMaybeMeUserWorking;
        break;
      }
      
      // تطبيق إصلاحات كل 10 محاولات
      if (readyAttempts % 10 === 0 && service.fixAttempts < service.maxFixAttempts) {
        console.log('🔧 تطبيق إصلاحات v5.3.0...');
        await service.applyV530GetMaybeMeUserFixes();
      }
    }
    
    // فحص نهائي شامل
    console.log('🔍 فحص نهائي شامل لـ v5.3.0...');
    const finalStatus = service.getConnectionStatus();
    
    console.log('📊 الحالة النهائية لـ v5.3.0:');
    console.log(`   🔗 متصل: ${finalStatus.connected ? '✅' : '❌'}`);
    console.log(`   📊 Store جاهز: ${finalStatus.storeReady ? '✅' : '❌'}`);
    console.log(`   🔧 WAPI جاهز: ${finalStatus.wapiReady ? '✅' : '❌'}`);
    console.log(`   👤 getMaybeMeUser يعمل: ${finalStatus.getMaybeMeUserWorking ? '✅' : '❌'}`);
    console.log(`   ✅ جاهز للإرسال: ${finalStatus.ready ? '✅' : '❌'}`);
    console.log(`   🔧 محاولات الإصلاح: ${finalStatus.fixAttempts}/${service.maxFixAttempts}`);
    console.log(`   📱 إصدار venom: ${finalStatus.version}`);
    
    if (finalStatus.ready && finalStatus.getMaybeMeUserWorking) {
      console.log('🎉 النظام جاهز بالكامل للإرسال مع v5.3.0!');
      
      // اختبار إرسال رسالة نهائي
      const testPhone = process.env.TEST_PHONE_NUMBER || '201002246668';
      console.log(`📱 اختبار إرسال نهائي مع v5.3.0 إلى: ${testPhone}`);
      
      const testResult = await service.testMessage(testPhone, 
        '🎉 تم حل مشكلة getMaybeMeUser نهائياً مع venom v5.3.0!\n\nالنظام يعمل بشكل مثالي الآن.\n\nالوقت: ' + new Date().toLocaleString('en-GB')
      );
      
      if (testResult.success) {
        console.log('🎉🎉🎉 تم إرسال رسالة الاختبار بنجاح مع v5.3.0!');
        console.log('✅✅✅ مشكلة getMaybeMeUser تم حلها نهائياً مع v5.3.0!');
        console.log('🚀 النظام جاهز للاستخدام الكامل');
      } else {
        console.error('❌ فشل في إرسال رسالة الاختبار:', testResult.error);
      }
    } else {
      console.error('❌ النظام غير جاهز للإرسال');
      console.log('💡 جرب إعادة تشغيل الخادم مرة أخرى');
      console.log('💡 أو استخدم: npm run clean:ultimate && npm run start:tunnel:ultimate');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار النهائي:', error);
  } finally {
    console.log('🔌 قطع الاتصال...');
    await service.disconnect();
    process.exit(0);
  }
}

ultimateTest();