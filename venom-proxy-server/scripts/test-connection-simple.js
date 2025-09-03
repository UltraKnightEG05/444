const axios = require('axios');

async function testSimpleConnection() {
  console.log('🧪 اختبار اتصال بسيط...');
  
  const API_BASE_URL = 'http://localhost:3002/api';
  const API_KEY = 'venom-ultimate-fix-2024';
  
  try {
    // اختبار 1: فحص حالة الخادم
    console.log('1️⃣ فحص حالة الخادم...');
    const testResponse = await axios.get(`${API_BASE_URL}/test`);
    console.log('✅ الخادم يعمل:', testResponse.data.message);
    
    // اختبار 2: فحص حالة الواتساب
    console.log('2️⃣ فحص حالة الواتساب...');
    const statusResponse = await axios.get(`${API_BASE_URL}/whatsapp/status`);
    console.log('📊 حالة الواتساب:', statusResponse.data.data);
    
    if (statusResponse.data.data.connected && statusResponse.data.data.ready) {
      console.log('🎉 الواتساب متصل وجاهز للإرسال!');
      
      // اختبار 3: إرسال رسالة اختبار
      const testPhone = '201002246668';
      console.log(`3️⃣ اختبار إرسال رسالة إلى: ${testPhone}`);
      
      const messageResponse = await axios.post(`${API_BASE_URL}/whatsapp/test-message`, {
        phoneNumber: testPhone,
        message: '🎉 تم حل جميع مشاكل venom v5.3.0!\n\nالنظام يعمل بشكل مثالي الآن.\n\nالوقت: ' + new Date().toLocaleString('en-GB')
      }, {
        headers: { 'X-API-Key': API_KEY }
      });
      
      if (messageResponse.data.success) {
        console.log('🎉🎉🎉 تم إرسال رسالة الاختبار بنجاح!');
        console.log('✅✅✅ جميع المشاكل تم حلها!');
        console.log('🚀 النظام جاهز للاستخدام الكامل');
      } else {
        console.error('❌ فشل في إرسال رسالة الاختبار:', messageResponse.data.message);
      }
    } else {
      console.log('⏳ الواتساب متصل لكن لا يزال يحمل...');
      console.log('💡 انتظر قليلاً ثم أعد الاختبار');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 تأكد من تشغيل الخادم أولاً: npm run start:tunnel:ultimate');
    }
  }
}

testSimpleConnection();