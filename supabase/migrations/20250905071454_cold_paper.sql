-- إنشاء جدول حالة إرسال تقارير الحصص
-- هذا الجدول يتتبع حالة إرسال التقارير لكل حصة

CREATE TABLE IF NOT EXISTS session_reports_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    status ENUM('pending', 'sending', 'sent', 'failed', 'partial_failed') DEFAULT 'pending',
    total_students INT DEFAULT 0,
    successful_sends INT DEFAULT 0,
    failed_sends INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    details JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_status (status),
    INDEX idx_last_attempt (last_attempt_at)
);

-- إنشاء جدول تفاصيل إرسال التقارير لكل طالب
CREATE TABLE IF NOT EXISTS session_report_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    message_type ENUM('absence', 'attendance', 'performance', 'custom') NOT NULL,
    message_content TEXT NOT NULL,
    send_status ENUM('pending', 'sent', 'failed', 'delivered', 'read') DEFAULT 'pending',
    whatsapp_message_id VARCHAR(255) NULL,
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    error_message TEXT NULL,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_session_student (session_id, student_id),
    INDEX idx_send_status (send_status),
    INDEX idx_sent_at (sent_at),
    UNIQUE KEY unique_session_student (session_id, student_id)
);

-- إنشاء trigger لتحديث حالة الحصة تلقائياً عند تغيير تفاصيل الإرسال
DELIMITER //

CREATE TRIGGER IF NOT EXISTS update_session_report_status
AFTER UPDATE ON session_report_details
FOR EACH ROW
BEGIN
    DECLARE total_count INT DEFAULT 0;
    DECLARE sent_count INT DEFAULT 0;
    DECLARE failed_count INT DEFAULT 0;
    DECLARE pending_count INT DEFAULT 0;
    DECLARE new_status VARCHAR(20);
    
    -- حساب الإحصائيات
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN send_status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN send_status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN send_status = 'pending' THEN 1 ELSE 0 END) as pending
    INTO total_count, sent_count, failed_count, pending_count
    FROM session_report_details 
    WHERE session_id = NEW.session_id;
    
    -- تحديد الحالة الجديدة
    IF pending_count > 0 THEN
        SET new_status = 'sending';
    ELSEIF sent_count = total_count THEN
        SET new_status = 'sent';
    ELSEIF failed_count = total_count THEN
        SET new_status = 'failed';
    ELSEIF sent_count > 0 AND failed_count > 0 THEN
        SET new_status = 'partial_failed';
    ELSE
        SET new_status = 'pending';
    END IF;
    
    -- تحديث جدول حالة التقارير
    INSERT INTO session_reports_status (
        session_id, 
        status, 
        total_students, 
        successful_sends, 
        failed_sends,
        last_attempt_at,
        completed_at
    ) VALUES (
        NEW.session_id,
        new_status,
        total_count,
        sent_count,
        failed_count,
        CURRENT_TIMESTAMP,
        CASE WHEN new_status IN ('sent', 'failed') THEN CURRENT_TIMESTAMP ELSE NULL END
    )
    ON DUPLICATE KEY UPDATE
        status = new_status,
        total_students = total_count,
        successful_sends = sent_count,
        failed_sends = failed_count,
        last_attempt_at = CURRENT_TIMESTAMP,
        completed_at = CASE WHEN new_status IN ('sent', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP;
        
END//

DELIMITER ;

-- إنشاء trigger مماثل للإدراج
DELIMITER //

CREATE TRIGGER IF NOT EXISTS insert_session_report_status
AFTER INSERT ON session_report_details
FOR EACH ROW
BEGIN
    DECLARE total_count INT DEFAULT 0;
    DECLARE sent_count INT DEFAULT 0;
    DECLARE failed_count INT DEFAULT 0;
    DECLARE pending_count INT DEFAULT 0;
    DECLARE new_status VARCHAR(20);
    
    -- حساب الإحصائيات
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN send_status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN send_status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN send_status = 'pending' THEN 1 ELSE 0 END) as pending
    INTO total_count, sent_count, failed_count, pending_count
    FROM session_report_details 
    WHERE session_id = NEW.session_id;
    
    -- تحديد الحالة الجديدة
    IF pending_count > 0 THEN
        SET new_status = 'sending';
    ELSEIF sent_count = total_count THEN
        SET new_status = 'sent';
    ELSEIF failed_count = total_count THEN
        SET new_status = 'failed';
    ELSEIF sent_count > 0 AND failed_count > 0 THEN
        SET new_status = 'partial_failed';
    ELSE
        SET new_status = 'pending';
    END IF;
    
    -- تحديث أو إدراج حالة التقارير
    INSERT INTO session_reports_status (
        session_id, 
        status, 
        total_students, 
        successful_sends, 
        failed_sends,
        last_attempt_at
    ) VALUES (
        NEW.session_id,
        new_status,
        total_count,
        sent_count,
        failed_count,
        CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
        status = new_status,
        total_students = total_count,
        successful_sends = sent_count,
        failed_sends = failed_count,
        last_attempt_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
        
END//

DELIMITER ;

-- إضافة فهارس إضافية لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_session_reports_status_session ON session_reports_status(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reports_status_updated ON session_reports_status(updated_at);
CREATE INDEX IF NOT EXISTS idx_session_report_details_phone ON session_report_details(parent_phone);
CREATE INDEX IF NOT EXISTS idx_session_report_details_retry ON session_report_details(retry_count);

-- إدراج بيانات تجريبية (اختياري)
-- INSERT INTO session_reports_status (session_id, status, total_students, successful_sends, failed_sends)
-- SELECT id, 'pending', 0, 0, 0 FROM sessions WHERE id NOT IN (SELECT session_id FROM session_reports_status);