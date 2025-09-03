#!/bin/bash

# سكريبت تثبيت Venom Proxy Server
# للاستخدام على Linux/macOS

echo "🚀 بدء تثبيت Venom Proxy Server..."

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. يرجى تثبيته أولاً من: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js الإصدار 16 أو أحدث مطلوب. الإصدار الحالي: $(node --version)"
    exit 1
fi

echo "✅ Node.js متوفر: $(node --version)"

# التحقق من Chrome
if command -v google-chrome &> /dev/null; then
    CHROME_PATH=$(which google-chrome)
    echo "✅ Chrome متوفر: $CHROME_PATH"
elif command -v chromium-browser &> /dev/null; then
    CHROME_PATH=$(which chromium-browser)
    echo "✅ Chromium متوفر: $CHROME_PATH"
else
    echo "❌ Chrome أو Chromium غير مثبت"
    echo "💡 لتثبيت Chrome على Ubuntu/Debian:"
    echo "   wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -"
    echo "   sudo sh -c 'echo \"deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main\" >> /etc/apt/sources.list.d/google-chrome.list'"
    echo "   sudo apt update && sudo apt install google-chrome-stable"
    exit 1
fi

# تثبيت المكتبات
echo "📦 تثبيت المكتبات..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ فشل في تثبيت المكتبات"
    exit 1
fi

echo "✅ تم تثبيت المكتبات بنجاح"

# إنشاء ملف .env إذا لم يكن موجوداً
if [ ! -f .env ]; then
    echo "📝 إنشاء ملف .env..."
    cp .env.example .env
    
    # تحديث مسار Chrome تلقائياً
    sed -i "s|CHROME_PATH=.*|CHROME_PATH=$CHROME_PATH|" .env
    
    echo "⚠️  يرجى تحديث ملف .env بالإعدادات الصحيحة:"
    echo "   - API_SECRET_KEY"
    echo "   - ALLOWED_ORIGINS"
fi

# إنشاء المجلدات المطلوبة
echo "📁 إنشاء المجلدات..."
mkdir -p tokens logs backups

# تعيين الصلاحيات
chmod 755 tokens logs backups
chmod +x scripts/*.sh

echo "🎉 تم تثبيت Venom Proxy Server بنجاح!"
echo ""
echo "📋 الخطوات التالية:"
echo "1. عدّل ملف .env بالإعدادات الصحيحة"
echo "2. شغّل الخادم: npm start"
echo "3. امسح QR Code بهاتفك"
echo "4. اختبر الاتصال: npm test"
echo ""
echo "📖 للمزيد من التفاصيل، راجع README.md"