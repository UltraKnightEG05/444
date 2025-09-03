const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = `http://localhost:${process.env.PORT || 3002}/api`;
const API_KEY = process.env.API_SECRET_KEY;

async function testConnection() {
  console.log('🧪 اختبار اتصال Venom Proxy Server...\n');
  
  try {
    // اختبار 1: فحص حالة الخادم
    console.log('1️⃣ اختبار حالة الخادم...');
    const testResponse = await axios.get(`${API_BASE_URL}/test`);
    console.log('✅ الخادم يعمل:', testResponse.data.message);
    
    // اختبار 2: فحص حالة الواتساب
    console.log('\n2️⃣ فحص حالة الواتساب...');
    const statusResponse = await axios.get(`${API_BASE_URL}/whatsapp/status`);
    console.log('📊 حالة الواتساب:', statusResponse.data.data.connected ? 'متصل' : 'غير متصل');
    
    // اختبار 3: تهيئة الواتساب (إذا لم يكن متصلاً)
    if (!statusResponse.data.data.connected) {
      console.log('\n3️⃣ محاولة تهيئة الواتساب...');
      const initResponse = await axios.post(`${API_BASE_URL}/whatsapp/initialize`, {}, {
        headers: { 'X-API-Key': API_KEY }
      });
      console.log('🚀 نتيجة التهيئة:', initResponse.data.message);
    }
    
    // اختبار 4: إرسال رسالة اختبار (اختياري)
    const testPhoneNumber = process.env.TEST_PHONE_NUMBER;
    if (testPhoneNumber) {
      console.log('\n4️⃣ اختبار إرسال رسالة...');
      const messageResponse = await axios.post(`${API_BASE_URL}/whatsapp/test-message`, {
        phoneNumber: testPhoneNumber,
        message: 'رسالة اختبار من Venom Proxy Server'
      }, {
        headers: { 'X-API-Key': API_KEY }
      });
      console.log('📱 نتيجة الإرسال:', messageResponse.data.message);
    }
    
    console.log('\n✅ جميع الاختبارات مكتملة بنجاح!');
    
  } catch (error) {
    console.error('\n❌ فشل في الاختبار:', error.response?.data?.message || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 نصيحة: تأكد من تشغيل الخادم أولاً باستخدام: npm start');
    }
    
    process.exit(1);
  }
}

// تشغيل الاختبار
testConnection();