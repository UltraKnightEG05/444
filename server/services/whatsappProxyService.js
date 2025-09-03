const axios = require('axios');

class WhatsAppProxyService {
  constructor() {
    this.proxyUrl = process.env.VENOM_PROXY_URL || 'https://api.go4host.net/api';
    this.apiKey = process.env.VENOM_PROXY_API_KEY || '';
    this.isConnected = false;
    this.lastCheck = 0;
    this.checkInterval = 30000; // 30 ثانية
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
      
      console.log('🔍 فحص اتصال Venom Proxy...');
      const response = await axios.get(`${this.proxyUrl}/whatsapp/status`, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      this.isConnected = response.data?.data?.connected || false;
      this.lastCheck = now;
      
      console.log('📊 حالة Venom Proxy:', this.isConnected ? 'متصل' : 'غير متصل');
      return this.isConnected;
    } catch (error) {
      console.error('❌ خطأ في فحص اتصال Venom Proxy:', error.message);
      this.isConnected = false;
      this.lastCheck = Date.now();
      return false;
    }
  }

  async initialize() {
    try {
      console.log('🚀 طلب تهيئة الواتساب من Venom Proxy...');
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/initialize`, {}, {
        headers: this.getHeaders(),
        timeout: 30000
      });
      
      if (response.data.success) {
        this.isConnected = true;
        console.log('✅ تم تهيئة الواتساب عبر Venom Proxy');
        return {
          success: true,
          message: response.data.message,
          alreadyConnected: response.data.alreadyConnected
        };
      } else {
        console.error('❌ فشل في تهيئة الواتساب:', response.data.message);
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('❌ خطأ في تهيئة الواتساب عبر Venom Proxy:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'لا يمكن الاتصال بخادم Venom Proxy. تأكد من تشغيله على جهازك الشخصي.'
        };
      }
      
      return {
        success: false,
        message: `خطأ في الاتصال بـ Venom Proxy: ${error.message}`
      };
    }
  }

  async sendMessage(phoneNumber, message, messageType = 'custom') {
    try {
      // التحقق من الاتصال أولاً
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Venom Proxy غير متصل. تأكد من تشغيل الخادم الوسيط على جهازك.');
      }

      console.log(`📤 إرسال رسالة عبر Venom Proxy إلى: ${phoneNumber}`);
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/send-message`, {
        phoneNumber,
        message,
        messageType
      }, {
        headers: this.getHeaders(),
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log('✅ تم إرسال الرسالة بنجاح عبر Venom Proxy');
        return {
          success: true,
          messageId: response.data.messageId,
          timestamp: response.data.timestamp
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة عبر Venom Proxy:', error.message);
      throw new Error(`فشل في إرسال الرسالة: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendBulkMessages(messages) {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Venom Proxy غير متصل. تأكد من تشغيل الخادم الوسيط على جهازك.');
      }

      console.log(`📤 إرسال ${messages.length} رسالة عبر Venom Proxy...`);
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/send-bulk`, {
        messages
      }, {
        headers: this.getHeaders(),
        timeout: 120000 // دقيقتان للرسائل المتعددة
      });
      
      if (response.data.success) {
        console.log('✅ تم إرسال الرسائل المتعددة بنجاح عبر Venom Proxy');
        return {
          success: true,
          results: response.data.results,
          summary: response.data.summary
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسائل المتعددة عبر Venom Proxy:', error.message);
      throw new Error(`فشل في إرسال الرسائل: ${error.response?.data?.message || error.message}`);
    }
  }

  async testMessage(phoneNumber, message = null) {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Venom Proxy غير متصل. تأكد من تشغيل الخادم الوسيط على جهازك.');
      }

      console.log(`🧪 اختبار إرسال رسالة عبر Venom Proxy إلى: ${phoneNumber}`);
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/test-message`, {
        phoneNumber,
        message
      }, {
        headers: this.getHeaders(),
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log('✅ تم إرسال رسالة الاختبار بنجاح عبر Venom Proxy');
        return {
          success: true,
          message: response.data.message,
          messageId: response.data.messageId
        };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('❌ خطأ في اختبار الرسالة عبر Venom Proxy:', error.message);
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
      console.log('🔌 طلب قطع اتصال الواتساب من Venom Proxy...');
      
      const response = await axios.post(`${this.proxyUrl}/whatsapp/disconnect`, {}, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      if (response.data.success) {
        this.isConnected = false;
        console.log('✅ تم قطع الاتصال بنجاح عبر Venom Proxy');
        return true;
      } else {
        console.error('❌ فشل في قطع الاتصال:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في قطع الاتصال عبر Venom Proxy:', error.message);
      return false;
    }
  }
}

module.exports = WhatsAppProxyService;