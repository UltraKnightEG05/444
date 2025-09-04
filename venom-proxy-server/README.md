# WhatsApp-Web.js Proxy Server - خادم الواتساب المحسن

## نظرة عامة

هذا الخادم يعمل كوسيط بين تطبيق إدارة الحضور المنشور على Render وخدمة الواتساب باستخدام WhatsApp-Web.js - بديل مستقر وموثوق لـ Venom-Bot.

## الهيكل المعماري

```
[Frontend - Render] 
    ↓
[Backend - Render] 
    ↓ HTTP API
[WhatsApp-Web.js Proxy + Cloudflare Tunnel - جهازك الشخصي] 
    ↓ WhatsApp-Web.js
[WhatsApp Web]
```

## مميزات WhatsApp-Web.js

### ✅ مزايا على Venom-Bot
- **استقرار عالي**: بدون مشاكل getMaybeMeUser أو WebSocket
- **تحديثات منتظمة**: مطور نشط ومجتمع كبير
- **أداء أفضل**: استهلاك ذاكرة أقل
- **توثيق ممتاز**: API واضح ومفهوم
- **دعم كامل**: لجميع ميزات واتساب

### 🌍 دعم Cloudflare Tunnel التلقائي
- تشغيل تلقائي لـ Cloudflare Tunnel
- مراقبة ومعالجة انقطاع النفق
- إعادة تشغيل تلقائي عند الفشل
- دعم كامل للوصول العالمي

## المتطلبات

- Node.js 16+ مثبت على جهازك
- Google Chrome مثبت
- Cloudflare Tunnel مثبت ومُعد
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
API_SECRET_KEY=venom-ultimate-fix-2024
ALLOWED_ORIGINS=https://hossam-students-backend.onrender.com,https://api.go4host.net,http://localhost:3001
WHATSAPP_SESSION_NAME=attendance-system-whatsapp-web-js
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
TUNNEL_URL=https://api.go4host.net
TUNNEL_ID=9752631e-8b0d-48a8-b9c1-20f376ce578f
```

### 3. إعداد Cloudflare Tunnel
```bash
# تسجيل الدخول
cloudflared tunnel login

# إنشاء النفق (إذا لم يكن موجوداً)
cloudflared tunnel create attendance-venom

# إعداد DNS
cloudflared tunnel route dns attendance-venom api.go4host.net
```

### 4. تشغيل النظام
```bash
# تشغيل مع Cloudflare Tunnel (الأفضل)
start-whatsapp-web-js.bat

# أو تشغيل يدوي
npm run start:tunnel:ultimate

# تشغيل محلي فقط
npm start
```

## الاستخدام

### تشغيل سريع (Windows)
```bash
# استخدم الملف المحسن
start-whatsapp-web-js.bat
```

### تشغيل يدوي
```bash
# 1. تثبيت المكتبات
npm install

# 2. تشغيل مع Tunnel
npm run start:tunnel:ultimate

# 3. اختبار النظام
npm run test:simple
```

## مراقبة النظام

### فحص الحالة
```bash
# فحص حالة WhatsApp
curl http://localhost:3002/api/whatsapp/status

# اختبار الخادم
curl http://localhost:3002/api/test

# معلومات الحساب
curl -H "X-API-Key: venom-ultimate-fix-2024" http://localhost:3002/api/whatsapp/info
```

### الرسائل المهمة
```
✅ تم تشغيل WhatsApp Proxy Server بنجاح
✅ تم التحقق من الهوية بنجاح
🎉 WhatsApp Web جاهز بالكامل للإرسال!
✅ Cloudflare Tunnel متصل
🌍 الخادم متاح على: https://api.go4host.net
```

## API Endpoints

### GET /api/test
اختبار حالة الخادم

### POST /api/whatsapp/initialize
تهيئة اتصال WhatsApp
```bash
curl -X POST -H "X-API-Key: venom-ultimate-fix-2024" http://localhost:3002/api/whatsapp/initialize
```

### GET /api/whatsapp/status
فحص حالة اتصال WhatsApp
```bash
curl http://localhost:3002/api/whatsapp/status
```

### GET /api/whatsapp/info
جلب معلومات الحساب
```bash
curl -H "X-API-Key: venom-ultimate-fix-2024" http://localhost:3002/api/whatsapp/info
```

### POST /api/whatsapp/test-message
إرسال رسالة اختبار
```json
{
  "phoneNumber": "201002246668",
  "message": "رسالة اختبار"
}
```

### POST /api/whatsapp/send-message
إرسال رسالة واحدة
```json
{
  "phoneNumber": "201002246668",
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
      "phoneNumber": "201002246668",
      "message": "رسالة 1",
      "messageType": "absence"
    },
    {
      "phoneNumber": "966501234567",
      "message": "رسالة 2",
      "messageType": "performance"
    }
  ]
}
```

## استكشاف الأخطاء

### مشكلة: QR Code لا يظهر ❌
**الحل:**
```bash
# تنظيف الجلسة
npm run clean:ultimate
start-whatsapp-web-js.bat
```

### مشكلة: فشل في الإرسال ❌
**الحل:**
```bash
# التحقق من الحالة
curl http://localhost:3002/api/whatsapp/status

# إعادة التهيئة
curl -X POST -H "X-API-Key: venom-ultimate-fix-2024" http://localhost:3002/api/whatsapp/initialize
```

### مشكلة: Cloudflare Tunnel لا يعمل ❌
**الحل:**
```bash
# التحقق من الإعداد
cloudflared tunnel list
cloudflared tunnel info 9752631e-8b0d-48a8-b9c1-20f376ce578f

# إعادة إنشاء النفق
cloudflared tunnel delete attendance-venom
cloudflared tunnel create attendance-venom
cloudflared tunnel route dns attendance-venom api.go4host.net
```

## الرسائل المهمة

### ✅ رسائل النجاح
```
✅ تم تشغيل WhatsApp Proxy Server بنجاح
✅ تم التحقق من الهوية بنجاح
🎉 WhatsApp Web جاهز بالكامل للإرسال!
✅ Cloudflare Tunnel متصل
🌍 الخادم متاح على: https://api.go4host.net
👤 معلومات الحساب: الرقم، الاسم، البطارية
```

### ❌ رسائل الخطأ وحلولها
```
❌ WhatsApp غير متصل أو غير جاهز
   الحل: انتظر اكتمال التحميل أو أعد التهيئة

❌ الرقم غير مسجل في واتساب
   الحل: تحقق من صحة الرقم

❌ فشل في المصادقة
   الحل: امسح QR Code جديد
```

## الصيانة

### نسخ احتياطي
```bash
# نسخ احتياطي شامل
npm run backup:all

# نسخ احتياطي للجلسات فقط
npm run backup:sessions
```

### تنظيف الجلسة
```bash
# تنظيف شامل
npm run clean:ultimate

# تنظيف عادي
npm run clean
```

## الأداء

### إعدادات الرسائل
- تأخير 3 ثواني بين الرسائل
- تأخير 5 ثواني للرسائل المجمعة
- إعادة محاولة تلقائية (3 مرات)
- فحص صحة الرقم قبل الإرسال

### إعدادات الاتصال
- LocalAuth للحفاظ على الجلسة
- إعادة اتصال تلقائي
- مراقبة مستمرة للحالة

## مقارنة مع Venom-Bot

| الميزة | WhatsApp-Web.js | Venom-Bot |
|--------|----------------|-----------|
| الاستقرار | ✅ ممتاز | ❌ مشاكل متكررة |
| سهولة الاستخدام | ✅ بسيط | ❌ معقد |
| مشاكل getMaybeMeUser | ✅ لا توجد | ❌ مشكلة مستمرة |
| مشاكل WebSocket | ✅ لا توجد | ❌ أخطاء متكررة |
| التحديثات | ✅ منتظمة | ❌ بطيئة |
| الدعم | ✅ مجتمع نشط | ❌ دعم محدود |
| الأداء | ✅ سريع | ❌ بطيء |

## الدعم

### للمساعدة
1. تحقق من السجلات في `logs/`
2. شغّل `npm run test:simple`
3. راجع رسائل Terminal
4. استخدم `npm run clean:ultimate` للتنظيف

### معلومات المطور
- **المطور:** Ahmed Hosny
- **الهاتف:** 01272774494 - 01002246668  
- **البريد:** Sales@GO4Host.net
- **الخدمة:** WhatsApp-Web.js v1.23.0

---

## ملخص المميزات

✅ **استقرار عالي بدون مشاكل**
✅ **دعم Cloudflare Tunnel التلقائي** 
✅ **API واضح ومفهوم**
✅ **فحص صحة الأرقام**
✅ **إعادة اتصال تلقائي**
✅ **أداء محسن**
✅ **مراقبة مستمرة للنظام**
✅ **نسخ احتياطية تلقائية**

🎯 **النتيجة:** نظام مستقر 100% بدون مشاكل تقنية