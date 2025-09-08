const { executeQuery } = require('../config/database');
const WhatsAppProxyService = require('./whatsappProxyService');

class WhatsAppService extends WhatsAppProxyService {
  constructor() {
    super();
    this.proxyUrl = process.env.WHATSAPP_PROXY_URL || 'https://api.go4host.net/api';
    console.log('🌐 Proxy URL:', this.proxyUrl);
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⏳ الواتساب قيد التهيئة بالفعل...');
      return { success: false, message: 'جاري التهيئة بالفعل...' };
    }

    if (this.isConnected && this.client) {
      console.log('✅ الواتساب متصل بالفعل');
      return { success: true, message: 'WhatsApp-Web.js متصل بالفعل', alreadyConnected: true };
    }
    
    // استدعاء تهيئة WhatsApp-Web.js Proxy
    return await super.initialize();
  }

  async sendSessionReport(sessionId) {
    try {
      console.log('📊 بدء إرسال تقرير الحصة:', sessionId);
      
      // التحقق من حالة الاتصال
      const isConnected = await this.checkConnection();
      console.log('🔍 نتيجة فحص الاتصال:', isConnected);
      
      if (!isConnected) {
        // محاولة فحص مفصل
        try {
          const detailedStatus = await this.getDetailedStatus();
          console.log('📋 حالة مفصلة:', detailedStatus);
          
          if (detailedStatus.ready || detailedStatus.state === 'CONNECTED') {
            console.log('✅ WhatsApp جاهز حسب الفحص المفصل');
            // المتابعة مع الإرسال
          } else {
            throw new Error(`WhatsApp-Web.js غير جاهز. الحالة: ${JSON.stringify(detailedStatus)}`);
          }
        } catch (detailError) {
          throw new Error('WhatsApp-Web.js Proxy غير متصل أو غير جاهز. تأكد من تشغيل start-whatsapp-web-js.bat على جهازك وأن QR Code تم مسحه.');
        }
      }

      // الحصول على بيانات الحصة
      const sessionQuery = `
        SELECT s.*, c.name as class_name, t.name as teacher_name, 
               sub.name as subject_name, l.name as location_name
        FROM sessions s
        JOIN classes c ON s.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN subjects sub ON c.subject_id = sub.id
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE s.id = ?
      `;
      
      const sessionResults = await executeQuery(sessionQuery, [sessionId]);
      if (sessionResults.length === 0) {
        throw new Error('الحصة غير موجودة');
      }
      
      const session = sessionResults[0];
      console.log('📋 بيانات الحصة:', session.class_name, session.teacher_name);
      
      // الحصول على طلاب المجموعة مع حالة الحضور والتقارير
      const studentsQuery = `
        SELECT s.id, s.name, s.parent_phone, s.barcode,
               a.status as attendance_status,
               r.teacher_rating, r.quiz_score, r.participation, 
               r.behavior, r.homework, r.comments
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
        LEFT JOIN reports r ON s.id = r.student_id AND r.session_id = ?
        WHERE s.class_id = ? AND s.is_active = TRUE AND s.parent_phone IS NOT NULL AND s.parent_phone != ''
        ORDER BY s.name
      `;
      
      const students = await executeQuery(studentsQuery, [sessionId, sessionId, session.class_id]);
      console.log(`👥 عدد الطلاب المؤهلين للإرسال: ${students.length}`);
      
      const results = [];
      const sessionDate = new Date(session.start_time).toLocaleDateString('en-GB');
      const sessionTime = new Date(session.start_time).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      let sentCount = 0;
      let failedCount = 0;
      const messagesToSend = [];
      
      for (const student of students) {
        console.log(`📱 معالجة الطالب: ${student.name} - ${student.parent_phone}`);
        
        let message = '';
        let messageType = '';
        
        // التحقق من حالة الحضور والتقرير
        const hasAttendance = student.attendance_status && student.attendance_status !== 'absent';
        const hasReport = student.teacher_rating && student.participation;
        
        if (!hasAttendance) {
          // رسالة غياب
          message = `🔔 تنبيه غياب - نظام الحسام لإدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

نود إعلامكم بأن الطالب/ة: *${student.name}*
تغيب عن حصة اليوم

📚 تفاصيل الحصة:
• المادة: ${session.subject_name || 'غير محدد'}
• المعلم: ${session.teacher_name || 'غير محدد'}
• التاريخ: ${sessionDate}
• الوقت: ${sessionTime}${session.location_name ? `\n• المكان: ${session.location_name}` : ''}

نرجو المتابعة والتواصل مع الإدارة لمعرفة سبب الغياب.


📚 نظام الحسام لإدارة الحضور
`;

          messageType = 'absence';
        } else if (hasAttendance && hasReport) {
          // تقرير أداء
          message = `📊 تقرير أداء الطالب - نظام الحسام لإدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

👤 الطالب/ة: *${student.name}*
📚 المادة: ${session.subject_name || 'غير محدد'}
👨‍🏫 المعلم: ${session.teacher_name || 'غير محدد'}
📅 التاريخ: ${sessionDate}
⏰ الوقت: ${sessionTime}

📈 تقييم الأداء:
⭐ تقييم المعلم: *${student.teacher_rating}/5*
🙋 المشاركة: *${student.participation}/5*
😊 السلوك: *${student.behavior || 'غير محدد'}*
📝 الواجب: *${student.homework === 'completed' ? 'مكتمل ✅' : student.homework === 'incomplete' ? 'غير مكتمل ❌' : 'جزئي ⚠️'}*`;
          
          if (student.quiz_score) {
            message += `\n📋 درجة الاختبار: *${student.quiz_score}%*`;
          }
          
          if (student.recitation_score !== null && student.recitation_score !== undefined) {
            message += `\n📖 درجة التسميع: *${student.recitation_score}/10*`;
          }
          
          if (student.comments) {
            message += `\n\n💬 ملاحظات المعلم:\n_${student.comments}_`;
          }
          
          message += `\n\n📚 نظام الحسام لإدارة الحضور
شكراً لمتابعتكم المستمرة 🌟
`;
          messageType = 'performance';
        } else if (hasAttendance) {
          // رسالة حضور بدون تقرير
          message = `✅ تأكيد حضور - نظام الحسام لإدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

نود إعلامكم بحضور الطالب/ة: *${student.name}*
في حصة اليوم بنجاح

📚 تفاصيل الحصة:
• المادة: ${session.subject_name || 'غير محدد'}
• المعلم: ${session.teacher_name || 'غير محدد'}
• التاريخ: ${sessionDate}
• الوقت: ${sessionTime}${session.location_name ? `\n• المكان: ${session.location_name}` : ''}


📚 نظام الحسام لإدارة الحضور
`;

          messageType = 'attendance';
        } else {
          console.log(`⏭️ تخطي الطالب ${student.name} - لا توجد بيانات كافية`);
          continue;
        }
        
        messagesToSend.push({
          phoneNumber: student.parent_phone,
          message: message,
          messageType: messageType,
          studentId: student.id,
          studentName: student.name
        });
      }
      
      // إرسال الرسائل بشكل مجمع
      if (messagesToSend.length > 0) {
        console.log(`📤 إرسال ${messagesToSend.length} رسالة عبر WhatsApp-Web.js Proxy...`);
        
        const bulkResult = await this.sendBulkMessages(messagesToSend);
        
        if (bulkResult.success) {
          sentCount = bulkResult.summary.success;
          failedCount = bulkResult.summary.failed;
          
          // تسجيل النتائج في قاعدة البيانات
          for (const result of bulkResult.results) {
            const messageData = messagesToSend.find(m => m.phoneNumber === result.phoneNumber);
            if (messageData) {
              try {
                await executeQuery(
                  'INSERT INTO whatsapp_logs (student_id, session_id, message_type, message, phone_number, status) VALUES (?, ?, ?, ?, ?, ?)',
                  [messageData.studentId, sessionId, messageData.messageType, messageData.message, result.phoneNumber, result.success ? 'sent' : 'failed']
                );
              } catch (dbError) {
                console.error('❌ خطأ في تسجيل الرسالة في قاعدة البيانات:', dbError);
              }
            }
          }
        } else {
          throw new Error('فشل في إرسال الرسائل عبر WhatsApp-Web.js Proxy');
        }
      }
      
      console.log(`📊 ملخص الإرسال: ${sentCount} نجح، ${failedCount} فشل من أصل ${messagesToSend.length} رسالة`);
      
      return {
        success: true,
        totalStudents: messagesToSend.length,
        sentMessages: sentCount,
        failedMessages: failedCount,
        results: messagesToSend.map(msg => ({
          studentName: msg.studentName,
          phoneNumber: msg.phoneNumber,
          messageType: msg.messageType
        }))
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال تقرير الحصة:', error);
      throw error;
    }
  }

  // إرسال رسالة واحدة (للتوافق مع الكود الحالي)
  async sendMessage(phoneNumber, message, messageType = 'custom') {
    try {
      console.log(`📤 إرسال رسالة واحدة عبر WhatsApp-Web.js Proxy إلى: ${phoneNumber}`);
      const result = await super.sendMessage(phoneNumber, message, messageType);
      return result;
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      throw error;
    }
  }

  // دالة اختبار إرسال رسالة واحدة
  async testMessage(phoneNumber, message = null) {
    try {
      console.log(`🧪 اختبار إرسال رسالة عبر WhatsApp-Web.js Proxy إلى: ${phoneNumber}`);
      const result = await super.testMessage(phoneNumber, message);
      return result;
    } catch (error) {
      console.error('❌ فشل اختبار الرسالة:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // إرسال رسائل متعددة (محسنة)
  async sendBulkMessages(messages) {
    try {
      console.log(`📤 إرسال ${messages.length} رسالة عبر WhatsApp-Web.js Proxy...`);
      const result = await super.sendBulkMessages(messages);
      return result;
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسائل المتعددة:', error);
      
      // في حالة فشل الإرسال المجمع، جرب الإرسال الفردي
      console.log('🔄 محاولة الإرسال الفردي كبديل...');
      const results = [];
      let successCount = 0;
      let failedCount = 0;
      
      for (const msg of messages) {
        try {
          const result = await this.sendMessage(msg.phoneNumber, msg.message, msg.messageType);
          results.push({
            phoneNumber: msg.phoneNumber,
            success: true,
            messageId: result.messageId,
            timestamp: result.timestamp
          });
          successCount++;
        } catch (error) {
          results.push({
            phoneNumber: msg.phoneNumber,
            success: false,
            error: error.message
          });
          failedCount++;
        }
      }
      
      return {
        success: true,
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount
        }
      };
    }
  }

  // دالة للحصول على معلومات الحساب
  async getAccountInfo() {
    return await super.getAccountInfo();
  }

  // دالة للحصول على حالة الاتصال مع تفاصيل
  async getDetailedStatus() {
    try {
      const response = await axios.get(`${this.proxyUrl}/whatsapp/status`, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      return response.data?.data || { connected: false, ready: false };
    } catch (error) {
      console.error('❌ خطأ في جلب حالة WhatsApp-Web.js:', error.message);
      return { connected: false, ready: false, error: error.message };
    }
  }
}

// إنشاء instance واحد
const whatsappService = new WhatsAppService();

// معالجة إغلاق التطبيق
process.on('SIGINT', async () => {
  console.log('\n🛑 إيقاف خدمة الواتساب...');
  await whatsappService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 إيقاف خدمة الواتساب...');
  await whatsappService.disconnect();
  process.exit(0);
});

module.exports = whatsappService;
