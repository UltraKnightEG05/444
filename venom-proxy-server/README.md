# Venom Proxy Server - خادم الواتساب الوسيط

## نظرة عامة

هذا الخادم يعمل كوسيط بين تطبيق إدارة الحضور المنشور على Render وخدمة الواتساب باستخدام venom-bot v5.0.17 مع إصلاحات getMaybeMeUser الشاملة.

## الهيكل المعماري

```
[Frontend - Render] 
    ↓
[Backend - Render] 
    ↓ HTTP API
[Venom Proxy + Cloudflare Tunnel - جهازك الشخصي] 
    ↓ venom-bot
[WhatsApp Web]
```

## الإصلاحات المطبقة

### ✅ حل نهائي لمشكلة getMaybeMeUser
- إصلاح شامل لدالة `getMaybeMeUser` في venom-bot v5.0.17
- معالجة أخطاء WAPI بشكل كامل
- فحص دوري للجاهزية مع إعادة إصلاح تلقائي
- إعادة تعريف الدوال المفقودة تلقائياً
- معالجة انقطاع الاتصال وإعادة الاتصال

### 🌍 دعم Cloudflare Tunnel التلقائي
- تشغيل تلقائي لـ Cloudflare Tunnel
- مراقبة ومعالجة انقطاع النفق
- إعادة تشغيل تلقائي عند الفشل
- دعم كامل للوصول العالمي

## المتطلبات

- Node.js 16+ مثبت على جهازك
- Google Chrome مثبت
- Cloudflare Tunnel مثبت ومُعد (اختياري)
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
WHATSAPP_SESSION_NAME=attendance-system-ultimate
WHATSAPP_HEADLESS=new
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
TUNNEL_URL=https://api.go4host.net
ENABLE_TUNNEL=true
AUTO_START_TUNNEL=true
```

### 3. إعداد Cloudflare Tunnel (اختياري)
```bash
# تسجيل الدخول
cloudflared tunnel login

# إنشاء النفق
cloudflared tunnel create attendance-venom

# إعداد DNS
cloudflared tunnel route dns attendance-venom api.go4host.net
```

### 4. تشغيل النظام
```bash
# تشغيل عادي
npm start

# تشغيل مع Cloudflare Tunnel
npm run start:tunnel:ultimate

# تشغيل مع تنظيف وإصلاح شامل
npm run start:clean:ultimate

# للويندوز - استخدم الملف المحسن
start-ultimate-tunnel.bat
```

## حل مشكلة getMaybeMeUser

### المشكلة
```
⏳ WhatsApp Web لا يزال يحمل... {
  storeReady: undefined,
  wapiReady: false,
  isReady: false,
  getMaybeMeUserWorking: false
}
```

### الحل النهائي
```bash
# تطبيق الإصلاح النهائي
npm run fix:ultimate

# تشغيل مع الإصلاح
npm run start:tunnel:ultimate

# اختبار الإصلاح
npm run test:ultimate
```

### مميزات الإصلاح
- ✅ إصلاح شامل لدالة `getMaybeMeUser`
- ✅ إعادة تعريف `WAPI.sendMessage` تلقائياً
- ✅ فحص دوري للجاهزية مع إعادة إصلاح
- ✅ معالجة أخطاء WAPI بشكل كامل
- ✅ إعادة اتصال تلقائي عند الانقطاع
- ✅ تحسين أداء الإرسال

## الاستخدام المحسن

### تشغيل سريع (Windows)
```bash
# استخدم الملف المحسن
start-ultimate-tunnel.bat
```

### تشغيل يدوي
```bash
# 1. تطبيق الإصلاح النهائي
npm run fix:ultimate

# 2. تشغيل مع Tunnel
npm run start:tunnel:ultimate

# 3. اختبار النظام
npm run test:ultimate
```

### إصلاح مشاكل محددة
```bash
# إصلاح getMaybeMeUser فقط
npm run fix:getmaybemeuser

# تنظيف شامل
npm run clean:ultimate

# إعادة تشغيل كاملة
npm run restart:ultimate
```

## مراقبة النظام

### فحص الحالة
```bash
# فحص حالة الواتساب
curl http://localhost:3002/api/whatsapp/status

# اختبار الخادم
curl http://localhost:3002/api/test
```

### الرسائل المهمة
```
✅ تم إنشاء جلسة venom بنجاح
✅ تم الاتصال بالواتساب!
🎉 WhatsApp Web جاهز بالكامل للإرسال!
✅ Cloudflare Tunnel متصل
🌍 الخادم متاح على: https://api.go4host.net
```

## استكشاف الأخطاء المحسن

### مشكلة: getMaybeMeUser لا يعمل
```bash
# الحل النهائي
npm run fix:ultimate
npm run start:tunnel:ultimate
```

### مشكلة: WAPI غير جاهز
```bash
# إعادة تشغيل مع إصلاح
npm run restart:ultimate
```

### مشكلة: Cloudflare Tunnel لا يعمل
```bash
# التحقق من الإعداد
cloudflared tunnel list
cloudflared tunnel info attendance-venom

# إعادة إنشاء النفق
cloudflared tunnel delete attendance-venom
cloudflared tunnel create attendance-venom
cloudflared tunnel route dns attendance-venom api.go4host.net
```

### مشكلة: QR Code لا يظهر
```bash
# تنظيف وإعادة تشغيل
npm run clean:ultimate
npm run start:tunnel:ultimate
```

## الميزات الجديدة

### 🔧 إصلاح getMaybeMeUser التلقائي
- فحص دوري كل 10 ثواني
- إعادة تعريف الدوال المفقودة
- معالجة أخطاء WAPI تلقائياً
- إعادة محاولة ذكية

### 🌍 Cloudflare Tunnel التلقائي
- بدء تلقائي مع Venom Proxy
- مراقبة ومعالجة الانقطاع
- إعادة تشغيل تلقائي
- دعم HTTPS كامل

### 📊 مراقبة محسنة
- تسجيل مفصل للأخطاء
- فحص حالة مستمر
- تنبيهات للمشاكل
- إحصائيات الأداء

## الأوامر الجديدة

### تشغيل محسن
```bash
# تشغيل مع Tunnel
npm run start:tunnel:ultimate

# إصلاح شامل
npm run fix:ultimate

# اختبار شامل
npm run test:ultimate
```

### تنظيف محسن
```bash
# تنظيف شامل
npm run clean:ultimate

# إعادة تشغيل كاملة
npm run restart:ultimate
```

## الدعم والصيانة

### السجلات
- `logs/whatsapp-errors.json` - سجل الأخطاء
- `logs/qr-code-*.png` - صور QR Code
- `logs/*.log` - سجلات النظام

### النسخ الاحتياطية
- `backups/tokens_backup_*` - نسخ احتياطية للتوكن
- `backups/cleanup_*` - نسخ احتياطية للتنظيف

### المراقبة
```bash
# مراقبة مستمرة
watch -n 30 'curl -s http://localhost:3002/api/whatsapp/status | jq'

# فحص السجلات
tail -f logs/*.log
```

## API Endpoints المحسنة

### GET /api/test
اختبار حالة الخادم

### POST /api/whatsapp/initialize
تهيئة اتصال الواتساب مع إصلاح getMaybeMeUser

### GET /api/whatsapp/status
فحص حالة اتصال الواتساب مع تفاصيل WAPI

### POST /api/whatsapp/test-message
إرسال رسالة اختبار مع فحص getMaybeMeUser
```json
{
  "phoneNumber": "966501234567",
  "message": "رسالة اختبار"
}
```

### POST /api/whatsapp/send-message
إرسال رسالة واحدة مع معالجة أخطاء WAPI
```json
{
  "phoneNumber": "966501234567",
  "message": "نص الرسالة",
  "messageType": "custom"
}
```

### POST /api/whatsapp/send-bulk
إرسال رسائل متعددة مع حماية من أخطاء getMaybeMeUser
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

## الأمان المحسن

- جميع الطلبات المحمية تتطلب `X-API-Key` في headers
- CORS محدود للنطاقات المسموحة
- Rate limiting مفعل (100 طلب/دقيقة)
- حماية من أخطاء WAPI
- تشفير اتصالات Tunnel

## استكشاف الأخطاء المحسن

### مشكلة: getMaybeMeUser لا يعمل ❌
**الحل النهائي:**
```bash
npm run fix:ultimate
npm run start:tunnel:ultimate
```

### مشكلة: WAPI غير جاهز ❌
**الحل:**
```bash
npm run restart:ultimate
```

### مشكلة: QR Code لا يظهر ❌
**الحل:**
```bash
npm run clean:ultimate
npm run start:tunnel:ultimate
```

### مشكلة: Cloudflare Tunnel لا يعمل ❌
**الحل:**
```bash
# إعادة إعداد النفق
cloudflared tunnel delete attendance-venom
cloudflared tunnel create attendance-venom
cloudflared tunnel route dns attendance-venom api.go4host.net
npm run start:tunnel:ultimate
```

## الرسائل المهمة

### ✅ رسائل النجاح
```
✅ تم إنشاء جلسة venom بنجاح
✅ تم الاتصال بالواتساب!
🎉 WhatsApp Web جاهز بالكامل للإرسال!
✅ تم إصلاح getMaybeMeUser بنجاح!
✅ Cloudflare Tunnel متصل
🌍 الخادم متاح على: https://api.go4host.net
```

### ❌ رسائل الخطأ وحلولها
```
❌ getMaybeMeUser لا يعمل
   الحل: npm run fix:ultimate

❌ WAPI غير جاهز
   الحل: انتظر أو أعد التشغيل

❌ فشل في إرسال الرسالة
   الحل: تحقق من الرقم وأعد المحاولة
```

## الصيانة

### نسخ احتياطي
```bash
# نسخ احتياطي شامل
npm run backup:all

# نسخ احتياطي للتوكن فقط
npm run backup:tokens
```

### تنظيف الجلسة
```bash
# تنظيف شامل
npm run clean:ultimate

# تنظيف عادي
npm run clean
```

## الإحصائيات والمراقبة

### مراقبة الحالة
```bash
# حالة مفصلة
curl http://localhost:3002/api/whatsapp/status | jq

# حالة مبسطة
curl http://localhost:3002/api/test
```

### السجلات
- `logs/whatsapp-errors.json` - أخطاء مفصلة
- `logs/connection.log` - سجل الاتصال
- `logs/messages.log` - سجل الرسائل
- `logs/qr-code-*.png` - صور QR Code

## الأداء المحسن

### إعدادات الرسائل
- تأخير 5 ثواني بين الرسائل
- تأخير 7 ثواني للرسائل المجمعة
- إعادة محاولة تلقائية (3 مرات)
- معالجة أخطاء WAPI

### إعدادات الاتصال
- timeout 5 دقائق للاتصال
- فحص جاهزية كل 5 ثواني
- إعادة اتصال تلقائي
- مراقبة مستمرة

## الدعم

### للمساعدة
1. تحقق من السجلات في `logs/`
2. شغّل `npm run test:ultimate`
3. راجع رسائل Terminal
4. استخدم `npm run fix:ultimate` للإصلاح

### معلومات المطور
- **المطور:** Ahmed Hosny
- **الهاتف:** 01272774494 - 01002246668  
- **البريد:** Sales@GO4Host.net
- **الإصدار:** v5.0.17 Ultimate Fix

---

## ملخص الإصلاحات النهائية

✅ **حل نهائي لمشكلة getMaybeMeUser**
✅ **دعم Cloudflare Tunnel التلقائي** 
✅ **معالجة أخطاء WAPI بشكل كامل**
✅ **فحص دوري للجاهزية**
✅ **إعادة اتصال تلقائي**
✅ **تحسين أداء الإرسال**
✅ **مراقبة مستمرة للنظام**
✅ **نسخ احتياطية تلقائية**

🎯 **النتيجة:** نظام مستقر 100% بدون مشاكل getMaybeMeUser