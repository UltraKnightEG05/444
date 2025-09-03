# Dockerfile للـ Backend
FROM node:18-alpine

# تثبيت Chrome للـ WhatsApp
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# تعيين متغير البيئة لـ Chrome
ENV CHROME_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# إنشاء مجلد العمل
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت المكتبات
RUN npm ci --only=production

# نسخ الكود
COPY . .

# إنشاء المجلدات المطلوبة
RUN mkdir -p tokens logs

# تعيين الصلاحيات
RUN chmod -R 755 tokens logs

# تعريض المنفذ
EXPOSE 3001

# تشغيل التطبيق
CMD ["npm", "start"]