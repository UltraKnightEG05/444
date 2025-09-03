const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات قاعدة البيانات للإنتاج
if (process.env.NODE_ENV === 'production') {
  console.log('🔧 إعدادات قاعدة البيانات (الإنتاج):');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[محدد]' : '[فارغ]');
}

// إعدادات قاعدة البيانات
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance_system',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 120000,
  timeout: 120000,
  reconnect: true,
  multipleStatements: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: false,
  // إعدادات SSL للإنتاج
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// إنشاء pool للاتصالات
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 5 : 10,
  queueLimit: 0,
  acquireTimeout: 120000,
  timeout: 120000
});

// معالجة أحداث Pool
pool.on('connection', function (connection) {
  console.log('🔗 اتصال جديد بقاعدة البيانات:', connection.threadId);
});

pool.on('error', function(err) {
  console.error('❌ خطأ في pool قاعدة البيانات:', err);
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 محاولة إعادة الاتصال...');
  } else {
    throw err;
  }
});

// اختبار الاتصال
async function testConnection() {
  try {
    console.log('🧪 اختبار الاتصال بقاعدة البيانات...');
    const connection = await pool.getConnection();
    
    // اختبار استعلام بسيط
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('📊 نتيجة الاختبار:', rows);
    
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    console.error('تفاصيل الخطأ:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:');
    console.error('   الرسالة:', error.message);
    console.error('   الكود:', error.code);
    console.error('   errno:', error.errno);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 نصيحة: تأكد من إنشاء قاعدة البيانات attendance_system في phpMyAdmin');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 نصيحة: تأكد من تشغيل MySQL في XAMPP');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 نصيحة: تحقق من اسم المستخدم وكلمة المرور في ملف .env');
    }
    
    console.log('🛑 إيقاف الخادم بسبب فشل الاتصال بقاعدة البيانات');
    process.exit(1);
    return false;
  }
}

// دالة تنفيذ الاستعلامات
async function executeQuery(query, params = []) {
  try {
    console.log('🔍 تنفيذ الاستعلام:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
    console.log('📊 المعاملات:', params);
    
    const [results] = await pool.execute(query, params);
    
    if (Array.isArray(results)) {
      console.log('✅ نتائج الاستعلام: تم جلب', results.length, 'صف');
    } else {
      console.log('✅ نتائج الاستعلام:', results.affectedRows || 'تم التنفيذ');
    }
    
    return results;
  } catch (error) {
    console.error('❌ خطأ في تنفيذ الاستعلام:', error);
    console.error('📝 الاستعلام:', query.substring(0, 200) + (query.length > 200 ? '...' : ''));
    console.error('📊 المعاملات:', params);
    console.error('تفاصيل الخطأ:', {
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    
    // تحسين رسائل الخطأ للكلمات المحجوزة
    if (error.code === 'ER_PARSE_ERROR' && error.sqlMessage && error.sqlMessage.includes('timestamp')) {
      console.error('💡 نصيحة: يبدو أن هناك مشكلة مع كلمة محجوزة "timestamp". تأكد من استخدام قاعدة البيانات المصححة.');
    }
    
    throw error;
  }
}

// دالة تنفيذ المعاملات
async function executeTransaction(queries) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  executeQuery,
  executeTransaction,
  testConnection
};