const axios = require('axios');

class WhatsAppProxyService {
  constructor() {
    this.proxyUrl = process.env.WHATSAPP_PROXY_URL || 'https://api.go4host.net/api';
    this.apiKey = process.env.WHATSAPP_PROXY_API_KEY || 'R8vFj92rNc7eQmZKx5U2hYT4bB9gLz3eTqXpD6wMv1Jc0hL7nAqEyWGsPd0VxQYd';
    this.isConnected = false;
    this.lastCheck = 0;
    this.checkInterval = 30000; // 30 ثانية
    
    console.log('🔗 WhatsApp Proxy URL:', this.proxyUrl);
    console.log('🔑 API Key:', this.apiKey ? '[محدد]' : '[فارغ]');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'User-Agent': 'AttendanceSystem/1.0'
    };
  }

  async checkConnection() {
    try {
      // تجنب الفحص المتكرر
      const now = Date.now();
      if (now - this.lastCheck < this.checkInterval) {
        return this.isConnected;
      }
      
      console.log('🔍 فحص اتصال WhatsApp-Web.js Proxy على:', this.proxyUrl);
      const response = await axios.get(`${this.proxyUrl}/whatsapp/status`, {
        headers: this.getHeaders(),
        timeout: 15000
      });
      
      console.log('📡 استجابة حالة WhatsApp من Proxy:', response.data);
      const statusData = response.data?.data || {};
      
      // فحص شامل للحالة
      this.isConnected = statusData.ready === true || 
                        statusData.connected === true || 
                        statusData.state === 'CONNECTED' ||
                        statusData.state === 'READY';
                        
      this.lastCheck = now;
      
      console.log('📊 حالة WhatsApp-Web.js:', this.isConnected ? 'جاهز للإرسال ✅' : 'غير جاهز ❌');
      console.log('📋 تفاصيل الحالة:', response.data?.data);
      
      return this.isConnected;
    } catch (error) {
      console.error('❌ خطأ في فحص اتصال WhatsApp-Web.js Proxy:', error.message);
      console.error('🔗 URL المستخدم:', this.proxyUrl);
      console.error('🔑 API Key:', this.apiKey ? '[محدد]' : '[فارغ]');
      
      if (error.code === 'ECONNREFUSED') {
        console.error('🔌 لا يمكن الاتصال بـ WhatsApp-Web.js Proxy');
        console.error('💡 تأكد من:');
        console.error('   1. تشغيل start-whatsapp-web-js.bat على جهازك');
        console.error('   2. Cloudflare Tunnel يعمل');
        console.error('   3. الرابط صحيح:', this.proxyUrl);
      }
      
      this.isConnected = false;
      this.lastCheck = Date.now();
      return false;
    }
  }

  async initialize() {
    try {
      console.log('🚀 طلب تهيئة WhatsApp-Web.js من Proxy...');
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/initialize`, {}, {
        headers: this.getHeaders(),
        timeout: 30000
      });
      
      if (response.data.success) {
        this.isConnected = true;
        console.log('✅ تم تهيئة WhatsApp-Web.js عبر Proxy');
        return {
          success: true,
          message: response.data.message,
          alreadyConnected: response.data.alreadyConnected
        };
      } else {
        console.error('❌ فشل في تهيئة WhatsApp-Web.js:', response.data.message);
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('❌ خطأ في تهيئة WhatsApp-Web.js عبر Proxy:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'لا يمكن الاتصال بخادم WhatsApp-Web.js Proxy. تأكد من تشغيله على جهازك الشخصي باستخدام start-whatsapp-web-js.bat'
        };
      }
      
      return {
        success: false,
        message: `خطأ في الاتصال بـ WhatsApp-Web.js Proxy: ${error.message}`
      };
    }
  }

  async sendMessage(phoneNumber, message, messageType = 'custom') {
    try {
      // التحقق من الاتصال أولاً
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('WhatsApp-Web.js Proxy غير متصل أو غير جاهز. تأكد من تشغيل الخادم الوسيط على جهازك وأن QR Code تم مسحه.');
      }

      console.log(`📤 إرسال رسالة عبر WhatsApp-Web.js Proxy إلى: ${phoneNumber}`);
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/send-message`, {
        phoneNumber,
        message,
        messageType
      }, {
        headers: this.getHeaders(),
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log('✅ تم إرسال الرسالة بنجاح عبر WhatsApp-Web.js Proxy');
        return {
          success: true,
          messageId: response.data.messageId,
          timestamp: response.data.timestamp
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة عبر WhatsApp-Web.js Proxy:', error.message);
      throw new Error(`فشل في إرسال الرسالة: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendBulkMessages(messages) {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('WhatsApp-Web.js Proxy غير متصل أو غير جاهز. تأكد من تشغيل الخادم الوسيط على جهازك.');
      }

      console.log(`📤 إرسال ${messages.length} رسالة عبر WhatsApp-Web.js Proxy...`);
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/send-bulk`, {
        messages
      }, {
        headers: this.getHeaders(),
        timeout: 120000 // دقيقتان للرسائل المتعددة
      });
      
      if (response.data.success) {
        console.log('✅ تم إرسال الرسائل المتعددة بنجاح عبر WhatsApp-Web.js Proxy');
        return {
          success: true,
          results: response.data.results,
          summary: response.data.summary
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسائل المتعددة عبر WhatsApp-Web.js Proxy:', error.message);
      throw new Error(`فشل في إرسال الرسائل: ${error.response?.data?.message || error.message}`);
    }
  }

  async testMessage(phoneNumber, message = null) {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('WhatsApp-Web.js Proxy غير متصل أو غير جاهز. تأكد من تشغيل الخادم الوسيط على جهازك وأن QR Code تم مسحه.');
      }

      console.log(`🧪 اختبار إرسال رسالة عبر WhatsApp-Web.js Proxy إلى: ${phoneNumber}`);
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/test-message`, {
        phoneNumber,
        message
      }, {
        headers: this.getHeaders(),
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log('✅ تم إرسال رسالة الاختبار بنجاح عبر WhatsApp-Web.js Proxy');
        return {
          success: true,
          message: response.data.message,
          messageId: response.data.messageId
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في اختبار الرسالة عبر WhatsApp-Web.js Proxy:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  async validateConnection() {
    return await this.checkConnection();
  }

  async disconnect() {
    try {
      console.log('🔌 طلب قطع اتصال WhatsApp-Web.js من Proxy...');
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/disconnect`, {}, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      if (response.data.success) {
        this.isConnected = false;
        console.log('✅ تم قطع الاتصال بنجاح عبر WhatsApp-Web.js Proxy');
        return true;
      } else {
        console.error('❌ فشل في قطع الاتصال:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال عبر WhatsApp-Web.js Proxy:', error.message);
      return false;
    }
  }

  async getAccountInfo() {
    try {
      const response = await axios.get(`${this.proxyUrl}/whatsapp/info`, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب معلومات الحساب:', error.message);
      return null;
    }
  }
}

module.exports = WhatsAppProxyService;