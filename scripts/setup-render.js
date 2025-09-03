#!/usr/bin/env node

/**
 * سكريبت إعداد Render
 * يقوم بإعداد المتغيرات والملفات المطلوبة للنشر على Render
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 بدء إعداد المشروع للنشر على Render...');

// إنشاء المجلدات المطلوبة
const requiredDirs = ['tokens', 'logs', 'dist'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 تم إنشاء المجلد: ${dir}`);
  }
});

// إنشاء ملف .gitignore محدث
const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# WhatsApp tokens (حساسة جداً)
tokens/
*.data.json

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/
`;

fs.writeFileSync('.gitignore', gitignoreContent.trim());
console.log('📝 تم تحديث ملف .gitignore');

// إنشاء ملف README للنشر
const readmeContent = `
# نظام إدارة الحضور الشامل

## النشر على Render

### Backend
- Service Type: Web Service
- Build Command: \`npm install\`
- Start Command: \`npm start\`
- Environment: Node.js

### Frontend
- Service Type: Static Site
- Build Command: \`npm install && npm run build\`
- Publish Directory: \`dist\`

### متغيرات البيئة المطلوبة:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET
- SESSION_SECRET
- WHATSAPP_SESSION_NAME
- CHROME_PATH

## الاستخدام
1. تسجيل الدخول: admin / admin123
2. تهيئة الواتساب من قسم إدارة الواتساب
3. إضافة الطلاب والمجموعات
4. بدء استخدام النظام
`;

fs.writeFileSync('README-RENDER.md', readmeContent.trim());
console.log('📖 تم إنشاء دليل النشر');

console.log('✅ تم إعداد المشروع بنجاح للنشر على Render!');
console.log('\n📋 الخطوات التالية:');
console.log('1. ارفع الكود إلى GitHub');
console.log('2. اربط المستودع بـ Render');
console.log('3. أضف متغيرات البيئة');
console.log('4. انشر الخدمات');