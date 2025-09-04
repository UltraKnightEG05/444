const axios = require('axios');

async function testSimpleConnection() {
  console.log('🧪 اختبار اتصال WhatsApp-Web.js...');
  
  const API_BASE_URL = 'http://localhost:3002/api';
  const API_KEY = 'venom-ultimate-fix-2024';
  
  try {
    // اختبار 1: فحص حالة الخادم
    console.log('1️⃣ فحص حالة الخادم...');
    const testResponse = await axios.get(`${API_BASE_URL}/test`);
    console.log('✅ الخادم يعمل:', testResponse.data.message);
    console.log('📱 الخدمة:', testResponse.data.service);
    
    // اختبار 2: فحص حالة WhatsApp
    console.log('2️⃣ فحص حالة WhatsApp...');
    const statusResponse = await axios.get(`${API_BASE_URL}/whatsapp/status`);
    console.log('📊 حالة WhatsApp:', statusResponse.data.data);
    
    if (statusResponse.data.data.connected && statusResponse.data.data.ready) {
      console.log('🎉 WhatsApp متصل وجاهز للإرسال!');
      
      // اختبار 2.5: جلب معلومات الحساب
      console.log('2️⃣.5️⃣ جلب معلومات الحساب...');
      try {
        const infoResponse = await axios.get(`${API_BASE_URL}/whatsapp/info`, {
          headers: { 'X-API-Key': API_KEY }
        });
        console.log('👤 معلومات الحساب:', infoResponse.data.data);
      } catch (infoError) {
        console.log('⚠️ لم يتم جلب معلومات الحساب:', infoError.response?.data?.message);
      }
      
      // اختبار 3: إرسال رسالة اختبار
      const testPhone = '201002246668';
      console.log(`3️⃣ اختبار إرسال رسالة إلى: ${testPhone}`);
      
      const messageResponse = await axios.post(`${API_BASE_URL}/whatsapp/test-message`, {
        phoneNumber: testPhone,
        message: '🎉 تم التحويل إلى WhatsApp-Web.js بنجاح!\n\nالنظام يعمل بشكل مثالي بدون مشاكل.\n\nالوقت: ' + new Date().toLocaleString('en-GB')
      }, {
        headers: { 'X-API-Key': API_KEY }
      });
      
      if (messageResponse.data.success) {
        console.log('🎉🎉🎉 تم إرسال رسالة الاختبار بنجاح!');
        console.log('✅✅✅ WhatsApp-Web.js يعمل بشكل مثالي!');
        console.log('🚀 النظام جاهز للاستخدام الكامل');
      } else {
        console.error('❌ فشل في إرسال رسالة الاختبار:', messageResponse.data.message);
      }
    } else {
      console.log('⏳ WhatsApp متصل لكن لا يزال يحمل...');
      console.log('💡 انتظر قليلاً ثم أعد الاختبار');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 تأكد من تشغيل الخادم أولاً: start-whatsapp-web-js.bat');
    }
  }
}

testSimpleConnection();