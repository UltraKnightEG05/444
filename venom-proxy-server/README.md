# Venom Proxy Server - خادم الواتساب الوسيط

## نظرة عامة

هذا الخادم يعمل كوسيط بين تطبيق إدارة الحضور المنشور على Render وخدمة الواتساب باستخدام venom-bot على جهازك الشخصي.

## الهيكل المعماري

```
[Frontend - Render] 
    ↓
[Backend - Render] 
    ↓ HTTP API
[Venom Proxy - جهازك الشخصي] 
    ↓ venom-bot
[WhatsApp Web]
```

## المتطلبات

- Node.js 16+ مثبت على جهازك
- Google Chrome مثبت
- اتصال إنترنت مستقر
- هاتف ذكي مع واتساب

## التثبيت والإعداد

### 1. تثبيت المكتبات
```bash
cd venom-proxy-server
npm install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example .env
```

عدّل ملف `.env`:
```env
PORT=3002
API_SECRET_KEY=your-super-secret-api-key-here
ALLOWED_ORIGINS=https://hossam-students-backend.onrender.com,https://api.go4host.net,http://localhost:3001
WHATSAPP_SESSION_NAME=attendance-system-proxy
WHATSAPP_HEADLESS=true
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
TUNNEL_URL=https://api.go4host.net
```

### 3. تشغيل الخادم
```bash
# للتطوير
npm run dev

# للإنتاج
npm start

# تنظيف الجلسة وبدء جديد
npm run start:clean
```

## إعداد Cloudflare Tunnel

### 1. تثبيت cloudflared
```bash
# Windows
winget install --id Cloudflare.cloudflared

# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### 2. تسجيل الدخول
```bash
cloudflared tunnel login
```

### 3. إنشاء النفق
```bash
cloudflared tunnel create attendance-venom
```

### 4. إعداد DNS
```bash
cloudflared tunnel route dns attendance-venom api.go4host.net
```

### 5. تشغيل النفق
```bash
cloudflared tunnel run --url http://localhost:3002 attendance-venom
```

أو إنشاء ملف config:
```yaml
# ~/.cloudflared/config.yml
tunnel: attendance-venom
credentials-file: ~/.cloudflared/[tunnel-id].json

ingress:
  - hostname: api.go4host.net
    service: http://localhost:3002
  - service: http_status:404
```

ثم تشغيل:
```bash
cloudflared tunnel run attendance-venom
```

## الاستخدام

### إصلاح مشكلة getMaybeMeUser

إذا واجهت خطأ `Cannot read properties of undefined (reading 'getMaybeMeUser')`:

```bash
# إصلاح المشكلة وإعادة التشغيل
npm run start:clean:enhanced

# أو تشغيل الإصلاح منفصلاً
npm run fix:getmaybemeuser
npm run start:enhanced

# اختبار الإصلاح
npm run test:enhanced
```

### تشغيل محسن (Windows)
```bash
# استخدم الملف المحسن
start-enhanced.bat
```

### تهيئة الواتساب
1. شغّل الخادم
2. شغّل Cloudflare Tunnel
3. ستظهر QR Code في Terminal
4. امسح QR Code بهاتفك
5. انتظر رسالة التأكيد

### اختبار الاتصال
```bash
# الاختبار العادي
npm test

# الاختبار المحسن (مع فحص getMaybeMeUser)
npm run test:enhanced
```

## API Endpoints

### GET /api/test
اختبار حالة الخادم

### POST /api/whatsapp/initialize
تهيئة اتصال الواتساب

### GET /api/whatsapp/status
فحص حالة اتصال الواتساب

### POST /api/whatsapp/test-message
إرسال رسالة اختبار
```json
{
  "phoneNumber": "966501234567",
  "message": "رسالة اختبار"
}
```

### POST /api/whatsapp/send-message
إرسال رسالة واحدة
```json
{
  "phoneNumber": "966501234567",
  "message": "نص الرسالة",
  "messageType": "custom"
}
```

### POST /api/whatsapp/send-bulk
إرسال رسائل متعددة
```json
{
  "messages": [
    {
      "phoneNumber": "966501234567",
      "message": "رسالة 1",
      "messageType": "absence"
    },
    {
      "phoneNumber": "966501234568",
      "message": "رسالة 2",
      "messageType": "performance"
    }
  ]
}
```

## الأمان

- جميع الطلبات المحمية تتطلب `X-API-Key` في headers
- CORS محدود للنطاقات المسموحة
- Rate limiting مفعل (100 طلب/دقيقة)

## استكشاف الأخطاء

### مشكلة: QR Code لا يظهر
- تأكد من تثبيت Chrome
- تحقق من مسار Chrome في `.env`

### مشكلة: انقطاع الاتصال
- تحقق من استقرار الإنترنت
- أعد تشغيل الخادم

### مشكلة: فشل إرسال الرسائل
- تحقق من صحة أرقام الهواتف
- تأكد من اتصال الواتساب
- إذا ظهر خطأ getMaybeMeUser، استخدم: `npm run fix:getmaybemeuser`
- انتظر رسالة "جاهز بالكامل للإرسال" قبل الاختبار

## الصيانة

### نسخ احتياطي
```bash
# نسخ احتياطي لملفات التوكن
tar -czf tokens-backup-$(date +%Y%m%d).tar.gz tokens/
```

### تنظيف الجلسة
```bash
# حذف ملفات التوكن لإعادة البدء
rm -rf tokens/
mkdir tokens
```

## المراقبة

- السجلات تُحفظ في مجلد `logs/`
- مراقبة حالة الاتصال كل 30 ثانية
- إعادة اتصال تلقائي عند الانقطاع

## الدعم

للمساعدة أو الإبلاغ عن مشاكل:
- تحقق من السجلات في Terminal
- راجع ملف `logs/` للتفاصيل
- تأكد من تحديث المكتبات