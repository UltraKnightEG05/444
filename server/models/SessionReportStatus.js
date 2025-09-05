const { executeQuery } = require('../config/database');

class SessionReportStatus {
  // جلب حالة إرسال التقارير لحصة معينة
  static async getBySessionId(sessionId) {
    const query = `
      SELECT * FROM session_reports_status 
      WHERE session_id = ?
    `;
    const results = await executeQuery(query, [sessionId]);
    return results[0] || null;
  }

  // جلب جميع حالات إرسال التقارير
  static async getAll() {
    const query = `
      SELECT srs.*, s.start_time, s.end_time, c.name as class_name
      FROM session_reports_status srs
      JOIN sessions s ON srs.session_id = s.id
      JOIN classes c ON s.class_id = c.id
      ORDER BY srs.updated_at DESC
    `;
    return await executeQuery(query);
  }

  // إنشاء أو تحديث حالة إرسال التقارير
  static async createOrUpdate(sessionId, statusData) {
    const { status, totalStudents, successfulSends, failedSends, errorMessage, details } = statusData;
    
    const query = `
      INSERT INTO session_reports_status 
      (session_id, status, total_students, successful_sends, failed_sends, last_attempt_at, error_message, details, completed_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        total_students = VALUES(total_students),
        successful_sends = VALUES(successful_sends),
        failed_sends = VALUES(failed_sends),
        last_attempt_at = CURRENT_TIMESTAMP,
        error_message = VALUES(error_message),
        details = VALUES(details),
        completed_at = VALUES(completed_at),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const completedAt = (status === 'sent' || status === 'failed') ? new Date() : null;
    
    const result = await executeQuery(query, [
      sessionId,
      status,
      totalStudents || 0,
      successfulSends || 0,
      failedSends || 0,
      errorMessage || null,
      details ? JSON.stringify(details) : null,
      completedAt
    ]);
    
    return result.affectedRows > 0;
  }

  // تحديث حالة الإرسال عند بدء العملية
  static async markAsSending(sessionId, totalStudents) {
    return this.createOrUpdate(sessionId, {
      status: 'sending',
      totalStudents,
      successfulSends: 0,
      failedSends: 0,
      errorMessage: null,
      details: { startedAt: new Date().toISOString() }
    });
  }

  // تحديث حالة الإرسال عند الانتهاء
  static async markAsCompleted(sessionId, results) {
    const { totalStudents, sentMessages, failedMessages, results: detailedResults, errorMessage } = results;
    
    let status;
    if (failedMessages === 0) {
      status = 'sent';
    } else if (sentMessages === 0) {
      status = 'failed';
    } else {
      status = 'partial_failed';
    }
    
    const details = {
      completedAt: new Date().toISOString(),
      results: detailedResults || [],
      summary: {
        total: totalStudents,
        success: sentMessages,
        failed: failedMessages
      }
    };
    
    return this.createOrUpdate(sessionId, {
      status,
      totalStudents,
      successfulSends: sentMessages,
      failedSends: failedMessages,
      errorMessage,
      details
    });
  }

  // جلب تفاصيل إرسال التقارير لحصة معينة
  static async getSessionReportDetails(sessionId) {
    const query = `
      SELECT srd.*, s.name as student_name
      FROM session_report_details srd
      JOIN students s ON srd.student_id = s.id
      WHERE srd.session_id = ?
      ORDER BY srd.updated_at DESC
    `;
    return await executeQuery(query, [sessionId]);
  }

  // إضافة تفاصيل إرسال لطالب معين
  static async addStudentReportDetail(sessionId, studentId, parentPhone, messageType, messageContent) {
    const query = `
      INSERT INTO session_report_details 
      (session_id, student_id, parent_phone, message_type, message_content, send_status)
      VALUES (?, ?, ?, ?, ?, 'pending')
      ON DUPLICATE KEY UPDATE
        parent_phone = VALUES(parent_phone),
        message_type = VALUES(message_type),
        message_content = VALUES(message_content),
        send_status = 'pending',
        retry_count = retry_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `;
    
    const result = await executeQuery(query, [
      sessionId,
      studentId,
      parentPhone,
      messageType,
      messageContent
    ]);
    
    return result.affectedRows > 0;
  }

  // تحديث حالة إرسال لطالب معين
  static async updateStudentReportStatus(sessionId, studentId, status, messageId = null, errorMessage = null) {
    const query = `
      UPDATE session_report_details 
      SET 
        send_status = ?,
        whatsapp_message_id = ?,
        error_message = ?,
        sent_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,
        delivered_at = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
        read_at = CASE WHEN ? = 'read' THEN CURRENT_TIMESTAMP ELSE read_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ? AND student_id = ?
    `;
    
    const result = await executeQuery(query, [
      status,
      messageId,
      errorMessage,
      status,
      status,
      status,
      sessionId,
      studentId
    ]);
    
    return result.affectedRows > 0;
  }

  // جلب إحصائيات إرسال التقارير
  static async getReportStatistics(sessionId = null) {
    let query = `
      SELECT 
        srs.session_id,
        srs.status,
        srs.total_students,
        srs.successful_sends,
        srs.failed_sends,
        srs.last_attempt_at,
        srs.completed_at,
        c.name as class_name,
        s.start_time
      FROM session_reports_status srs
      JOIN sessions s ON srs.session_id = s.id
      JOIN classes c ON s.class_id = c.id
    `;
    
    const params = [];
    
    if (sessionId) {
      query += ' WHERE srs.session_id = ?';
      params.push(sessionId);
    }
    
    query += ' ORDER BY srs.updated_at DESC';
    
    return await executeQuery(query, params);
  }

  // حذف حالة إرسال التقارير (عند حذف الحصة)
  static async deleteBySessionId(sessionId) {
    const queries = [
      'DELETE FROM session_report_details WHERE session_id = ?',
      'DELETE FROM session_reports_status WHERE session_id = ?'
    ];
    
    for (const query of queries) {
      await executeQuery(query, [sessionId]);
    }
    
    return true;
  }

  // إعادة تعيين حالة إرسال التقارير (لإعادة المحاولة)
  static async resetReportStatus(sessionId) {
    const queries = [
      'UPDATE session_report_details SET send_status = "pending", error_message = NULL WHERE session_id = ?',
      'UPDATE session_reports_status SET status = "pending", successful_sends = 0, failed_sends = 0, error_message = NULL WHERE session_id = ?'
    ];
    
    for (const query of queries) {
      await executeQuery(query, [sessionId]);
    }
    
    return true;
  }

  // جلب الحصص التي تحتاج إعادة إرسال
  static async getSessionsNeedingRetry() {
    const query = `
      SELECT srs.*, c.name as class_name, s.start_time
      FROM session_reports_status srs
      JOIN sessions s ON srs.session_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE srs.status IN ('failed', 'partial_failed')
      AND srs.last_attempt_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY srs.last_attempt_at ASC
    `;
    
    return await executeQuery(query);
  }

  // جلب تقرير شامل لحالة إرسال التقارير
  static async getComprehensiveReport(startDate = null, endDate = null) {
    let query = `
      SELECT 
        srs.session_id,
        srs.status,
        srs.total_students,
        srs.successful_sends,
        srs.failed_sends,
        srs.last_attempt_at,
        srs.completed_at,
        c.name as class_name,
        t.name as teacher_name,
        sub.name as subject_name,
        s.start_time,
        s.end_time,
        ROUND((srs.successful_sends / srs.total_students) * 100, 2) as success_rate
      FROM session_reports_status srs
      JOIN sessions s ON srs.session_id = s.id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(s.start_time) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(s.start_time) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY s.start_time DESC';
    
    return await executeQuery(query, params);
  }
}

module.exports = SessionReportStatus;