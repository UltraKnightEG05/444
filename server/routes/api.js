const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Session = require('../models/Session');
const SessionReportStatus = require('../models/SessionReportStatus');
const Location = require('../models/Location');
const Subject = require('../models/Subject');
const { executeQuery } = require('../config/database');
const whatsappService = require('../services/whatsappService');

// إضافة middleware للتسجيل
router.use((req, res, next) => {
  console.log(`🔗 API Request: ${req.method} ${req.path}`);
  next();
});

// اختبار API
router.get('/test', (req, res) => {
  console.log('🧪 اختبار API');
  res.json({ 
    success: true, 
    message: 'API يعمل بشكل صحيح',
    timestamp: new Date().toISOString()
  });
});

// مصادقة المستخدم
router.post('/auth/login', async (req, res) => {
  try {
    console.log('🔐 محاولة تسجيل دخول:', req.body.username);
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'اسم المستخدم وكلمة المرور مطلوبان' 
      });
    }
    
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'اسم المستخدم غير صحيح' });
    }
    
    const isValidPassword = await User.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }
    
    // إزالة كلمة المرور من الاستجابة وتحويل permissions من JSON
    const userData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
      createdAt: user.created_at
    };
    
    console.log('✅ تم تسجيل الدخول بنجاح للمستخدم:', user.name);
    res.json({ success: true, data: userData });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// إدارة المستخدمين
router.get('/users', async (req, res) => {
  try {
    const users = await User.getAll();
    // تحويل permissions من JSON string إلى object
    const processedUsers = users.map(user => ({
      ...user,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
      createdAt: user.created_at
    }));
    res.json({ success: true, data: processedUsers });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const userId = await User.create(req.body);
    res.json({ success: true, data: { id: userId } });
  } catch (error) {
    console.error('خطأ في إضافة المستخدم:', error);
    res.status(500).json({ success: false, message: 'خطأ في إضافة المستخدم' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    console.log('✏️ تحديث المستخدم:', req.params.id, req.body);
    
    // التحقق من وجود المستخدم
    const existingUser = await executeQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    
    // إذا كان التحديث يتضمن الصلاحيات فقط
    if (req.body.permissions && Object.keys(req.body).length === 1) {
      const query = 'UPDATE users SET permissions = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      const result = await executeQuery(query, [JSON.stringify(req.body.permissions), req.params.id]);
      console.log('✅ تم تحديث صلاحيات المستخدم');
      return res.json({ success: result.affectedRows > 0 });
    }
    
    const success = await User.update(req.params.id, req.body);
    console.log('✅ نتيجة تحديث المستخدم:', success);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث المستخدم' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const success = await User.delete(req.params.id);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف المستخدم' });
  }
});

// إدارة الطلاب
router.get('/students', async (req, res) => {
  try {
    const students = await Student.getAll();
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      barcode: student.barcode,
      parentPhone: student.parent_phone,
      parentEmail: student.parent_email,
      classId: student.class_id,
      className: student.class_name,
      dateOfBirth: student.date_of_birth,
      address: student.address,
      emergencyContact: student.emergency_contact,
      notes: student.notes,
      createdAt: student.created_at,
      isActive: student.is_active
    }));
    res.json({ success: true, data: processedStudents });
  } catch (error) {
    console.error('خطأ في جلب الطلاب:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

router.post('/students', async (req, res) => {
  try {
    if (!req.body.barcode) {
      req.body.barcode = await Student.generateBarcode();
    }
    
    // تحويل أسماء الحقول من Frontend إلى Database
    const studentData = {
      name: req.body.name,
      barcode: req.body.barcode,
      parent_phone: req.body.parentPhone,
      parent_email: req.body.parentEmail,
      class_id: req.body.classId,
      date_of_birth: req.body.dateOfBirth,
      address: req.body.address,
      emergency_contact: req.body.emergencyContact,
      notes: req.body.notes
    };
    
    const studentId = await Student.create(studentData);
    res.json({ success: true, data: { id: studentId, barcode: req.body.barcode } });
  } catch (error) {
    console.error('خطأ في إضافة الطالب:', error);
    res.status(500).json({ success: false, message: 'خطأ في إضافة الطالب' });
  }
});

router.put('/students/:id', async (req, res) => {
  try {
    // تحويل أسماء الحقول من Frontend إلى Database
    const studentData = {
      name: req.body.name,
      parent_phone: req.body.parentPhone,
      parent_email: req.body.parentEmail,
      class_id: req.body.classId,
      date_of_birth: req.body.dateOfBirth,
      address: req.body.address,
      emergency_contact: req.body.emergencyContact,
      notes: req.body.notes
    };
    
    const success = await Student.update(req.params.id, studentData);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في تحديث الطالب:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث الطالب' });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف الطالب من قاعدة البيانات:', req.params.id);
    
    // التحقق من وجود سجلات حضور للطالب
    const attendanceRecords = await executeQuery('SELECT COUNT(*) as count FROM attendance WHERE student_id = ?', [req.params.id]);
    if (attendanceRecords[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف الطالب لأنه يحتوي على ${attendanceRecords[0].count} سجل حضور` 
      });
    }
    
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM students WHERE id = ?';
    const result = await executeQuery(query, [req.params.id]);
    const success = await Student.delete(req.params.id);
    console.log('✅ نتيجة حذف الطالب:', success);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في حذف الطالب:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف الطالب' });
  }
});

router.put('/students/:id/transfer', async (req, res) => {
  try {
    const { newClassId } = req.body;
    const success = await Student.transferToClass(req.params.id, newClassId);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في نقل الطالب:', error);
    res.status(500).json({ success: false, message: 'خطأ في نقل الطالب' });
  }
});

router.get('/students/generate-barcode', async (req, res) => {
  try {
    const barcode = await Student.generateBarcode();
    res.json({ success: true, data: { barcode } });
  } catch (error) {
    console.error('خطأ في توليد الباركود:', error);
    res.status(500).json({ success: false, message: 'خطأ في توليد الباركود' });
  }
});

// إدارة المجموعات
router.get('/classes', async (req, res) => {
  try {
    const query = `
      SELECT c.*, t.name as teacher_name, s.name as subject_name, 
             g.name as grade_name, l.name as location_name
      FROM classes c
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN grades g ON c.grade_id = g.id
      LEFT JOIN locations l ON c.location_id = l.id
      WHERE c.is_active = TRUE
      ORDER BY c.name
    `;
    const classes = await executeQuery(query);
    
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedClasses = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      teacherId: cls.teacher_id,
      teacherName: cls.teacher_name,
      subjectId: cls.subject_id,
      subjectName: cls.subject_name,
      gradeId: cls.grade_id,
      gradeName: cls.grade_name,
      locationId: cls.location_id,
      locationName: cls.location_name,
      maxCapacity: cls.max_capacity,
      createdAt: cls.created_at,
      isActive: cls.is_active
    }));
    
    res.json({ success: true, data: processedClasses });
  } catch (error) {
    console.error('خطأ في جلب المجموعات:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

router.post('/classes', async (req, res) => {
  try {
    const { name, teacherId, gradeId, locationId, maxCapacity } = req.body;
    
    // الحصول على subject_id من teacher
    const teacherQuery = 'SELECT subject_id FROM teachers WHERE id = ?';
    const teacherResult = await executeQuery(teacherQuery, [teacherId]);
    const subjectId = teacherResult.length > 0 ? teacherResult[0].subject_id : null;
    
    const query = 'INSERT INTO classes (name, teacher_id, subject_id, grade_id, location_id, max_capacity) VALUES (?, ?, ?, ?, ?, ?)';
    const result = await executeQuery(query, [name, teacherId, subjectId, gradeId || null, locationId || null, maxCapacity]);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('خطأ في إضافة المجموعة:', error);
    res.status(500).json({ success: false, message: 'خطأ في إضافة المجموعة' });
  }
});

router.put('/classes/:id', async (req, res) => {
  try {
    const { name, teacherId, gradeId, locationId, maxCapacity } = req.body;
    
    // الحصول على subject_id من teacher
    const teacherQuery = 'SELECT subject_id FROM teachers WHERE id = ?';
    const teacherResult = await executeQuery(teacherQuery, [teacherId]);
    const subjectId = teacherResult.length > 0 ? teacherResult[0].subject_id : null;
    
    const query = 'UPDATE classes SET name = ?, teacher_id = ?, subject_id = ?, grade_id = ?, location_id = ?, max_capacity = ? WHERE id = ?';
    const result = await executeQuery(query, [name, teacherId, subjectId, gradeId || null, locationId || null, maxCapacity, req.params.id]);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في تحديث المجموعة:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث المجموعة' });
  }
});

router.delete('/classes/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف المجموعة من قاعدة البيانات:', req.params.id);
    
    // التحقق من وجود طلاب في المجموعة
    const studentsInClass = await executeQuery('SELECT COUNT(*) as count FROM students WHERE class_id = ? AND is_active = TRUE', [req.params.id]);
    if (studentsInClass[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف المجموعة لأنه يحتوي على ${studentsInClass[0].count} طالب` 
      });
    }
    
    // التحقق من وجود جلسات للمجموعة
    const sessionsInClass = await executeQuery('SELECT COUNT(*) as count FROM sessions WHERE class_id = ?', [req.params.id]);
    if (sessionsInClass[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف المجموعة لأنه يحتوي على ${sessionsInClass[0].count} جلسة` 
      });
    }
    
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM classes WHERE id = ?';
    const result = await executeQuery(query, [req.params.id]);
    console.log('✅ نتيجة حذف المجموعة:', result.affectedRows > 0);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في حذف المجموعة:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف المجموعة' });
  }
});

// إدارة المعلمين
router.get('/teachers', async (req, res) => {
  try {
    const query = `
      SELECT t.*, s.name as subject_name
      FROM teachers t
      LEFT JOIN subjects s ON t.subject_id = s.id
      WHERE t.is_active = TRUE
      ORDER BY t.name
    `;
    const teachers = await executeQuery(query);
    
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      subjectId: teacher.subject_id,
      subjectName: teacher.subject_name,
      phone: teacher.phone,
      email: teacher.email,
      createdAt: teacher.created_at,
      isActive: teacher.is_active
    }));
    
    res.json({ success: true, data: processedTeachers });
  } catch (error) {
    console.error('خطأ في جلب المعلمين:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

router.post('/teachers', async (req, res) => {
  try {
    const { name, subjectId, phone, email } = req.body;
    const query = 'INSERT INTO teachers (name, subject_id, phone, email) VALUES (?, ?, ?, ?)';
    const result = await executeQuery(query, [name, subjectId || null, phone || null, email || null]);
    res.json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error('خطأ في إضافة المعلم:', error);
    res.status(500).json({ success: false, message: 'خطأ في إضافة المعلم' });
  }
});

router.put('/teachers/:id', async (req, res) => {
  try {
    const { name, subjectId, phone, email } = req.body;
    const query = 'UPDATE teachers SET name = ?, subject_id = ?, phone = ?, email = ? WHERE id = ?';
    const result = await executeQuery(query, [name, subjectId || null, phone || null, email || null, req.params.id]);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في تحديث المعلم:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث المعلم' });
  }
});

router.delete('/teachers/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف المعلم من قاعدة البيانات:', req.params.id);
    
    // التحقق من وجود فصول مرتبطة بالمعلم
    const classesWithTeacher = await executeQuery('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ? AND is_active = TRUE', [req.params.id]);
    if (classesWithTeacher[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف المعلم لأنه مرتبط بـ ${classesWithTeacher[0].count} مجموعة` 
      });
    }
    
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM teachers WHERE id = ?';
    const result = await executeQuery(query, [req.params.id]);
    console.log('✅ نتيجة حذف المعلم:', result.affectedRows > 0);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في حذف المعلم:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف المعلم' });
  }
});

// إدارة المواد
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.getAll();
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      createdAt: subject.created_at,
      isActive: subject.is_active
    }));
    res.json({ success: true, data: processedSubjects });
  } catch (error) {
    console.error('خطأ في جلب المواد:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

router.post('/subjects', async (req, res) => {
  try {
    const subjectId = await Subject.create(req.body);
    res.json({ success: true, data: { id: subjectId } });
  } catch (error) {
    console.error('خطأ في إضافة المادة:', error);
    res.status(500).json({ success: false, message: 'خطأ في إضافة المادة' });
  }
});

router.put('/subjects/:id', async (req, res) => {
  try {
    const success = await Subject.update(req.params.id, req.body);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في تحديث المادة:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث المادة' });
  }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف المادة من قاعدة البيانات:', req.params.id);
    
    // التحقق من وجود معلمين مرتبطين بالمادة
    const teachersWithSubject = await executeQuery('SELECT COUNT(*) as count FROM teachers WHERE subject_id = ?', [req.params.id]);
    if (teachersWithSubject[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف المادة لأنها مرتبطة بـ ${teachersWithSubject[0].count} معلم` 
      });
    }
    
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM subjects WHERE id = ?';
    const result = await executeQuery(query, [req.params.id]);
    const success = await Subject.delete(req.params.id);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في حذف المادة:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// إدارة الأماكن
router.get('/locations', async (req, res) => {
  try {
    console.log('📍 جلب قائمة الأماكن...');
    const query = 'SELECT * FROM locations WHERE is_active = TRUE ORDER BY name ASC';
    const locations = await executeQuery(query);
    
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedLocations = locations.map(location => ({
      id: location.id,
      name: location.name,
      roomNumber: location.room_number,
      capacity: location.capacity,
      description: location.description,
      createdAt: location.created_at,
      isActive: location.is_active
    }));
    
    console.log('✅ تم جلب', processedLocations.length, 'مكان');
    res.json({ success: true, data: processedLocations });
  } catch (error) {
    console.error('❌ خطأ في جلب الأماكن:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب قائمة الأماكن' });
  }
});

// إدارة الصفوف الدراسية
router.get('/grades', async (req, res) => {
  try {
    console.log('📚 جلب قائمة الصفوف الدراسية...');
    const query = 'SELECT * FROM grades WHERE is_active = TRUE ORDER BY level ASC';
    const grades = await executeQuery(query);
    
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedGrades = grades.map(grade => ({
      id: grade.id,
      name: grade.name,
      level: grade.level,
      description: grade.description,
      createdAt: grade.created_at,
      isActive: grade.is_active
    }));
    
    console.log('✅ تم جلب', processedGrades.length, 'صف دراسي');
    res.json({ success: true, data: processedGrades });
  } catch (error) {
    console.error('❌ خطأ في جلب الصفوف الدراسية:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب قائمة الصفوف الدراسية' });
  }
});

router.post('/grades', async (req, res) => {
  try {
    console.log('➕ إضافة صف دراسي جديد:', req.body);
    const { name, level, description } = req.body;
    
    if (!name || !level) {
      return res.status(400).json({ success: false, message: 'اسم الصف والمستوى مطلوبان' });
    }
    
    const query = 'INSERT INTO grades (name, level, description) VALUES (?, ?, ?)';
    const result = await executeQuery(query, [name, level, description || null]);
    
    console.log('✅ تم إضافة الصف الدراسي بنجاح، ID:', result.insertId);
    res.json({ success: true, message: 'تم إضافة الصف الدراسي بنجاح', id: result.insertId });
  } catch (error) {
    console.error('❌ خطأ في إضافة الصف الدراسي:', error);
    res.status(500).json({ success: false, message: 'خطأ في إضافة الصف الدراسي' });
  }
});

router.put('/grades/:id', async (req, res) => {
  try {
    console.log('✏️ تحديث الصف الدراسي:', req.params.id, req.body);
    const { id } = req.params;
    const { name, level, description } = req.body;
    
    if (!name || !level) {
      return res.status(400).json({ success: false, message: 'اسم الصف والمستوى مطلوبان' });
    }
    
    const query = 'UPDATE grades SET name = ?, level = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await executeQuery(query, [name, level, description || null, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'الصف الدراسي غير موجود' });
    }
    
    console.log('✅ تم تحديث الصف الدراسي بنجاح');
    res.json({ success: true, message: 'تم تحديث الصف الدراسي بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في تحديث الصف الدراسي:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث الصف الدراسي' });
  }
});

router.delete('/grades/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف الصف الدراسي:', req.params.id);
    const { id } = req.params;
    
    // التحقق من وجود فصول في هذا الصف الدراسي
    const classesInGrade = await executeQuery('SELECT COUNT(*) as count FROM classes WHERE grade_id = ?', [id]);
    if (classesInGrade[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف الصف الدراسي لأنه مستخدم في ${classesInGrade[0].count} مجموعة` 
      });
    }
    
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM grades WHERE id = ?';
    const result = await executeQuery(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'الصف الدراسي غير موجود' });
    }
    
    console.log('✅ تم حذف الصف الدراسي بنجاح');
    res.json({ success: true, message: 'تم حذف الصف الدراسي بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حذف الصف الدراسي:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف الصف الدراسي' });
  }
});

router.post('/locations', async (req, res) => {
  try {
    console.log('➕ إضافة مكان جديد:', req.body);
    const { name, roomNumber, capacity, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم المكان مطلوب' });
    }
    
    const query = 'INSERT INTO locations (name, room_number, capacity, description) VALUES (?, ?, ?, ?)';
    const result = await executeQuery(query, [name, roomNumber || null, capacity || 30, description || null]);
    
    console.log('✅ تم إضافة المكان بنجاح، ID:', result.insertId);
    res.json({ success: true, message: 'تم إضافة المكان بنجاح', id: result.insertId });
  } catch (error) {
    console.error('❌ خطأ في إضافة المكان:', error);
    res.status(500).json({ success: false, message: 'خطأ في إضافة المكان' });
  }
});

router.put('/locations/:id', async (req, res) => {
  try {
    console.log('✏️ تحديث المكان:', req.params.id, req.body);
    const { id } = req.params;
    const { name, roomNumber, capacity, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'اسم المكان مطلوب' });
    }
    
    const query = 'UPDATE locations SET name = ?, room_number = ?, capacity = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await executeQuery(query, [name, roomNumber || null, capacity || 30, description || null, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'المكان غير موجود' });
    }
    
    console.log('✅ تم تحديث المكان بنجاح');
    res.json({ success: true, message: 'تم تحديث المكان بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في تحديث المكان:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث المكان' });
  }
});

router.delete('/locations/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف المكان:', req.params.id);
    const { id } = req.params;
    
    // التحقق من وجود جلسات في هذا المكان
    const sessionsInLocation = await executeQuery('SELECT COUNT(*) as count FROM sessions WHERE location_id = ?', [id]);
    if (sessionsInLocation[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `لا يمكن حذف المكان لأنه مستخدم في ${sessionsInLocation[0].count} جلسة` 
      });
    }
    
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM locations WHERE id = ?';
    const result = await executeQuery(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'المكان غير موجود' });
    }
    
    console.log('✅ تم حذف المكان بنجاح');
    res.json({ success: true, message: 'تم حذف المكان بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في حذف المكان:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف المكان' });
  }
});

// إدارة الحصص
router.get('/sessions', async (req, res) => {
  try {
    console.log('📅 جلب قائمة الحصص...');
    const query = `
      SELECT s.*, c.name as class_name, t.name as teacher_name, 
             sub.name as subject_name, l.name as location_name, l.room_number
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.start_time DESC
    `;
    const sessions = await executeQuery(query);
    
    console.log('✅ تم جلب', sessions.length, 'جلسة من قاعدة البيانات');
    
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedSessions = sessions.map(session => ({
      id: session.id,
      classId: session.class_id,
      className: session.class_name,
      teacherName: session.teacher_name,
      subjectName: session.subject_name,
      locationId: session.location_id,
      locationName: session.location_name,
      roomNumber: session.room_number,
      startTime: session.start_time ? new Date(session.start_time).toISOString() : null,
      endTime: session.end_time ? new Date(session.end_time).toISOString() : null,
      status: session.status,
      notes: session.notes,
      createdBy: session.created_by,
      createdAt: session.created_at ? new Date(session.created_at).toISOString() : null
    }));
    
    console.log('📤 إرسال', processedSessions.length, 'جلسة للواجهة الأمامية');
    console.log('📋 عينة من البيانات:', processedSessions.slice(0, 2));
    
    res.json({ success: true, data: processedSessions });
  } catch (error) {
    console.error('❌ خطأ في جلب الحصص:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    console.log('📝 إضافة جلسة جديدة:', req.body);
    
    // تحويل البيانات من Frontend إلى Database format
    const sessionData = {
      class_id: req.body.classId,
      location_id: req.body.locationId || null,
      start_time: req.body.startTime ? new Date(req.body.startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
      end_time: req.body.endTime ? new Date(req.body.endTime).toISOString().slice(0, 19).replace('T', ' ') : null,
      status: req.body.status || 'scheduled',
      notes: req.body.notes || null
    };
    
    console.log('📅 بيانات الحصة المحولة:', sessionData);
    
    const sessionId = await Session.create(sessionData);
    res.json({ success: true, data: { id: sessionId } });
  } catch (error) {
    console.error('خطأ في إضافة الحصة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في إضافة الحصة: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.put('/sessions/:id', async (req, res) => {
  try {
    console.log('✏️ تحديث الحصة:', req.params.id, req.body);
    
    // تحويل البيانات من Frontend إلى Database format
    const sessionData = {
      class_id: req.body.classId,
      location_id: req.body.locationId || null,
      start_time: req.body.startTime ? new Date(req.body.startTime).toISOString().slice(0, 19).replace('T', ' ') : undefined,
      end_time: req.body.endTime ? new Date(req.body.endTime).toISOString().slice(0, 19).replace('T', ' ') : undefined,
      status: req.body.status,
      notes: req.body.notes
    };
    
    // إزالة الحقول غير المحددة
    Object.keys(sessionData).forEach(key => {
      if (sessionData[key] === undefined) {
        delete sessionData[key];
      }
    });
    
    console.log('📅 بيانات الحصة المحولة للتحديث:', sessionData);
    
    const success = await Session.update(req.params.id, sessionData);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في تحديث الحصة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تحديث الحصة: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    console.log('🗑️ حذف الحصة من قاعدة البيانات:', req.params.id);
    const success = await Session.delete(req.params.id);
    console.log('✅ نتيجة حذف الحصة:', success);
    res.json({ success });
  } catch (error) {
    console.error('خطأ في حذف الحصة:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف الحصة' });
  }
});



// ==================== تغيير حالة الحصة (مع واتساب بعد التغيير) ====================
router.put('/sessions/:id/toggle-status', async (req, res) => {
  try {
    console.log('🔄 طلب تغيير حالة الحصة:', req.params.id);
    
    // جلب الحصة الحالية
    const session = await Session.findById(req.params.id);
    if (!session) {
      console.log('❌ الحصة غير موجودة:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: 'الحصة غير موجودة' 
      });
    }
    
    console.log('📊 الحصة الحالية:', {
      id: session.id,
      status: session.status,
      className: session.class_name
    });
    
    // تحديد الحالة الجديدة
let newStatus;
switch (session.status) {
  case 'active':
    newStatus = 'completed';
    break;
  case 'completed':
    newStatus = 'active';
    break;
  default:
    newStatus = 'active'; // لو الحالة مش متعرفة، يرجعها لـ active
}
    console.log('🔄 تغيير الحالة من', session.status, 'إلى', newStatus);
    
    // تحديث الحالة في قاعدة البيانات
    const query = `
      UPDATE sessions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [newStatus, req.params.id]);
    
    if (result.affectedRows > 0) {
      console.log('✅ تم تغيير حالة الحصة بنجاح');
      
      // ==================== جزء الواتساب بعد التحديث ====================
      try {
        const isConnected = await whatsappService.checkConnection();
        if (isConnected) {
          console.log('📤 إرسال تقرير الحصة عبر واتساب:', req.params.id);
          await whatsappService.sendSessionReport(req.params.id);
        } else {
          console.log('⚠️ واتساب غير متصل – تم تخطي إرسال التقرير');
        }
      } catch (whatsError) {
        console.error('❌ خطأ أثناء إرسال تقرير واتساب:', whatsError);
      }
      // ===============================================================
      
      res.json({ 
        success: true, 
        message: `تم تغيير حالة الحصة إلى ${newStatus}`,
        data: { 
          id: req.params.id,
          oldStatus: session.status,
          newStatus: newStatus
        }
      });
    } else {
      console.log('❌ فشل في تحديث الحصة');
      res.status(500).json({ 
        success: false, 
        message: 'فشل في تحديث حالة الحصة' 
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في تغيير حالة الحصة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في تغيير حالة الحصة: ' + error.message 
    });
  }
});




// إضافة route جديد لجلب طلاب المجموعة للجلسة
router.get('/sessions/:id/students', async (req, res) => {
  try {
    console.log('👥 جلب طلاب الحصة:', req.params.id);
    
    // التحقق من وجود الحصة أولاً
    const sessionQuery = 'SELECT * FROM sessions WHERE id = ?';
    const sessionResult = await executeQuery(sessionQuery, [req.params.id]);
    
    if (sessionResult.length === 0) {
      return res.status(404).json({ success: false, message: 'الحصة غير موجودة' });
    }
    
    const session = sessionResult[0];
    
    const query = `
      SELECT 
        s.id, s.name, s.barcode, s.parent_phone,
        a.id as attendance_id, a.status as attendance_status, a.record_time as attendance_time
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
      WHERE s.class_id = ? AND s.is_active = TRUE
      ORDER BY s.name
    `;
    
    const students = await executeQuery(query, [req.params.id, session.class_id]);
    
    console.log('✅ تم جلب', students.length, 'طالب للجلسة');
    
    // تحويل البيانات للتنسيق المطلوب
    const processedStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      barcode: student.barcode,
      parentPhone: student.parent_phone,
      attendanceId: student.attendance_id,
      attendanceStatus: student.attendance_status || 'absent',
      attendanceTime: student.attendance_time,
      classId: session.class_id
    }));
    
    res.json({ success: true, data: processedStudents });
  } catch (error) {
    console.error('❌ خطأ في جلب طلاب الحصة:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب طلاب الحصة' });
  }
});

// إدارة الحضور
router.get('/attendance', async (req, res) => {
  try {
    const query = `
      SELECT a.*, s.name as student_name, se.start_time as session_start,
             a.record_time as record_time
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN sessions se ON a.session_id = se.id
      ORDER BY a.record_time DESC
    `;
    const attendance = await executeQuery(query);
    
    // تحويل أسماء الحقول لتتطابق مع Frontend
    const processedAttendance = attendance.map(record => ({
      id: record.id,
      studentId: record.student_id,
      studentName: record.student_name,
      sessionId: record.session_id,
      sessionStart: record.session_start,
      status: record.status,
      timestamp: record.record_time,
      notes: record.notes,
      isAutomatic: record.is_automatic,
      recordedBy: record.recorded_by
    }));
    
    res.json({ success: true, data: processedAttendance });
  } catch (error) {
    console.error('خطأ في جلب الحضور:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

router.post('/attendance', async (req, res) => {
  try {
    const { studentId, sessionId, status, notes } = req.body;
    
    // التحقق من وجود تسجيل سابق
    const existingQuery = 'SELECT id FROM attendance WHERE student_id = ? AND session_id = ?';
    const existing = await executeQuery(existingQuery, [studentId, sessionId]);
    
    if (existing.length > 0) {
      // تحديث التسجيل الموجود
      const updateQuery = 'UPDATE attendance SET status = ?, notes = ?, record_time = CURRENT_TIMESTAMP WHERE student_id = ? AND session_id = ?';
      await executeQuery(updateQuery, [status, notes || null, studentId, sessionId]);
      res.json({ success: true, data: { id: existing[0].id } });
    } else {
      // إنشاء تسجيل جديد
      const insertQuery = 'INSERT INTO attendance (student_id, session_id, status, notes) VALUES (?, ?, ?, ?)';
      const result = await executeQuery(insertQuery, [studentId, sessionId, status, notes || null]);
      res.json({ success: true, data: { id: result.insertId } });
    }
  } catch (error) {
    console.error('خطأ في تسجيل الحضور:', error);
    res.status(500).json({ success: false, message: 'خطأ في تسجيل الحضور' });
  }
});

router.put('/attendance/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const query = 'UPDATE attendance SET status = ?, notes = ?, record_time = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await executeQuery(query, [status, notes || null, req.params.id]);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في تحديث الحضور:', error);
    res.status(500).json({ success: false, message: 'خطأ في تحديث الحضور' });
  }
});

router.delete('/attendance/:id', async (req, res) => {
  try {
    const query = 'DELETE FROM attendance WHERE id = ?';
    const result = await executeQuery(query, [req.params.id]);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في حذف الحضور:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف الحضور' });
  }
});

// إدارة التقارير
router.get('/reports', async (req, res) => {
  try {
    console.log('📊 جلب التقارير من قاعدة البيانات...');
    const query = `
      SELECT 
        r.id,
        r.student_id,
        r.session_id,
        r.teacher_rating,
        r.quiz_score,
        r.recitation_score,
        r.participation,
        r.behavior,
        r.homework,
        r.comments,
        r.strengths,
        r.areas_for_improvement,
        r.created_by,
        r.created_at,
        r.updated_at,
        s.name as student_name,
        s.barcode as student_barcode,
        se.start_time as session_start,
        se.end_time as session_end,
        se.status as session_status,
        c.name as class_name,
        t.name as teacher_name,
        sub.name as subject_name
      FROM reports r
      JOIN students s ON r.student_id = s.id
      JOIN sessions se ON r.session_id = se.id
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      ORDER BY r.created_at DESC
    `;
    const reports = await executeQuery(query);
    
    console.log('✅ تم جلب', reports.length, 'تقرير من قاعدة البيانات');
    if (reports.length > 0) {
      console.log('📋 عينة من التقارير:', reports.slice(0, 2));
    }
    
    const processedReports = reports.map(report => ({
      id: report.id,
      studentId: report.student_id,
      studentName: report.student_name,
      studentBarcode: report.student_barcode,
      sessionId: report.session_id,
      sessionStart: report.session_start,
      sessionEnd: report.session_end,
      sessionStatus: report.session_status,
      className: report.class_name,
      teacherName: report.teacher_name,
      subjectName: report.subject_name,
      teacherRating: report.teacher_rating,
      quizScore: report.quiz_score,
      recitationScore: report.recitation_score,
      participation: report.participation,
      behavior: report.behavior,
      homework: report.homework,
      comments: report.comments,
      strengths: report.strengths,
      areasForImprovement: report.areas_for_improvement,
      createdBy: report.created_by,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }));
    
    console.log('📤 إرسال', processedReports.length, 'تقرير للواجهة الأمامية');
    res.json({ success: true, data: processedReports });
  } catch (error) {
    console.error('خطأ في جلب التقارير:', error.stack);
    res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
  }
});

// جلب حالة التقارير
router.get('/reports/session-status', async (req, res) => {
  try {
    console.log('📊 طلب جلب حالة التقارير...');
    const reportsStatus = await SessionReportStatus.getComprehensiveReport();
    console.log('📡 حالة التقارير المجلبة:', reportsStatus?.length || 0, 'عنصر');
    res.json({ success: true, data: reportsStatus });
  } catch (error) {
    console.error('خطأ في جلب حالة التقارير:', error.stack);
    res.status(500).json({ success: false, message: 'خطأ في جلب حالة التقارير' });
  }
});


// جلب تفاصيل إرسال التقارير لحصة معينة
router.get('/reports/session-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('📊 جلب تفاصيل إرسال التقارير للحصة:', sessionId);
    
    const status = await SessionReportStatus.getBySessionId(sessionId);
    const details = await SessionReportStatus.getSessionReportDetails(sessionId);
    
    res.json({ 
      success: true, 
      data: { status, details }
    });
  } catch (error) {
    console.error('خطأ في جلب تفاصيل التقارير:', error.stack);
    res.status(500).json({ success: false, message: 'خطأ في جلب تفاصيل التقارير' });
  }
});

// إعادة تعيين حالة إرسال التقارير
router.post('/reports/session-status/:sessionId/reset', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('🔄 إعادة تعيين حالة التقارير للحصة:', sessionId);
    
    const success = await SessionReportStatus.resetReportStatus(sessionId);
    if (success) {
      console.log('✅ تم إعادة تعيين حالة التقارير بنجاح');
      res.json({ success: true, message: 'تم إعادة تعيين حالة التقارير بنجاح' });
    } else {
      res.status(400).json({ success: false, message: 'فشل في إعادة تعيين حالة التقارير' });
    }
  } catch (error) {
    console.error('خطأ في إعادة تعيين حالة التقارير:', error.stack);
    res.status(500).json({ success: false, message: 'خطأ في إعادة تعيين حالة التقارير' });
  }
});

// إضافة/تحديث تقرير
router.post('/reports', async (req, res) => {
  try {
    console.log('📝 إضافة/تحديث تقرير جديد:', req.body);
    const { studentId, sessionId, teacherRating, recitationScore, quizScore, participation, behavior, homework, comments, strengths, areasForImprovement } = req.body;
    
    if (!studentId || !sessionId || !teacherRating || !participation) {
      return res.status(400).json({ 
        success: false, 
        message: 'البيانات الأساسية مطلوبة: studentId, sessionId, teacherRating, participation' 
      });
    }
    
    const existingQuery = 'SELECT id FROM reports WHERE student_id = ? AND session_id = ?';
    const existing = await executeQuery(existingQuery, [studentId, sessionId]);
    
    if (existing.length > 0) {
      console.log('🔄 تحديث تقرير موجود، ID:', existing[0].id);
      const updateQuery = `
        UPDATE reports 
        SET teacher_rating = ?, recitation_score = ?, quiz_score = ?, participation = ?, behavior = ?, homework = ?, 
            comments = ?, strengths = ?, areas_for_improvement = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE student_id = ? AND session_id = ?
      `;
      const updateResult = await executeQuery(updateQuery, [
        teacherRating, recitationScore || null, quizScore || null, participation, behavior, homework, 
        comments || null, strengths || null, areasForImprovement || null, studentId, sessionId
      ]);
      console.log('✅ تم تحديث التقرير، عدد الصفوف المتأثرة:', updateResult.affectedRows);
      res.json({ success: true, data: { id: existing[0].id } });
    } else {
      console.log('➕ إنشاء تقرير جديد');
      const insertQuery = `
        INSERT INTO reports (student_id, session_id, teacher_rating, recitation_score, quiz_score, participation, behavior, homework, comments, strengths, areas_for_improvement) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const result = await executeQuery(insertQuery, [
        studentId, sessionId, teacherRating, recitationScore || null, quizScore || null, participation, behavior, homework, 
        comments || null, strengths || null, areasForImprovement || null
      ]);
      console.log('✅ تم إنشاء التقرير الجديد، ID:', result.insertId);
      res.json({ success: true, data: { id: result.insertId } });
    }
  } catch (error) {
    console.error('خطأ في إضافة التقرير:', error.stack);
    res.status(500).json({ success: false, message: 'خطأ في إضافة التقرير' });
  }
});

// تحديث تقرير
router.put('/reports/:id', async (req, res) => {
  try {
    const { teacherRating, recitationScore, quizScore, participation, behavior, homework, comments, strengths, areasForImprovement } = req.body;
    const query = `
      UPDATE reports 
      SET teacher_rating = ?, recitation_score = ?, quiz_score = ?, participation = ?, behavior = ?, homework = ?, 
          comments = ?, strengths = ?, areas_for_improvement = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const result = await executeQuery(query, [
      teacherRating, recitationScore || null, quizScore || null, participation, behavior, homework, 
      comments || null, strengths || null, areasForImprovement || null, req.params.id
    ]);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في تحديث التقرير:', error.stack);
    res.status(500).json({ success: false, message: 'خطأ في تحديث التقرير' });
  }
});

// حذف تقرير
router.delete('/reports/:id', async (req, res) => {
  try {
    const query = 'DELETE FROM reports WHERE id = ?';
    const result = await executeQuery(query, [req.params.id]);
    res.json({ success: result.affectedRows > 0 });
  } catch (error) {
    console.error('خطأ في حذف التقرير:', error.stack);
    res.status(500).json({ success: false, message: 'خطأ في حذف التقرير' });
  }
});

// تقارير الأداء والحضور
router.post('/reports/performance', async (req, res) => {
  try {
    console.log('📊 طلب تقرير الأداء مع الفلاتر:', req.body);
    const { startDate, endDate, classId, sessionId } = req.body;
    
    let query = `
      SELECT 
        r.id as report_id,
        r.student_id,
        r.session_id,
        r.teacher_rating,
        r.quiz_score,
        r.recitation_score,
        r.participation,
        r.behavior,
        r.homework,
        r.comments,
        r.strengths,
        r.areas_for_improvement,
        r.created_at as report_created_at,
        r.updated_at as report_updated_at,
        s.name as student_name,
        s.barcode as student_barcode,
        c.name as class_name,
        c.id as class_id,
        se.start_time as session_date,
        se.end_time as session_end,
        se.status as session_status,
        t.name as teacher_name,
        sub.name as subject_name,
        l.name as location_name,
        l.room_number
      FROM reports r
      JOIN students s ON r.student_id = s.id
      JOIN sessions se ON r.session_id = se.id
      JOIN classes c ON se.class_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN locations l ON se.location_id = l.id
      WHERE r.id IS NOT NULL AND s.is_active = TRUE
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(se.start_time) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(se.start_time) <= ?';
      params.push(endDate);
    }
    
    if (classId) {
      query += ' AND c.id = ?';
      params.push(classId);
    }
    
    if (sessionId) {
      query += ' AND se.id = ?';
      params.push(sessionId);
    }
    
    query += ' ORDER BY r.created_at DESC, s.name, se.start_time DESC';
    
    console.log('🔍 استعلام تقرير الأداء:', query);
    console.log('📊 معاملات الاستعلام:', params);
    
    const reports = await executeQuery(query, params);
    
    console.log('✅ تم جلب', reports.length, 'سجل لتقرير الأداء');
    if (reports.length > 0) {
      console.log('📋 عينة من بيانات الأداء:', reports.slice(0, 3));
    }
    
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('خطأ في جلب تقرير الأداء:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب تقرير الأداء' });
  }
});

router.post('/reports/attendance', async (req, res) => {
  try {
    console.log('📊 طلب تقرير الحضور مع الفلاتر:', req.body);
    const { startDate, endDate, classId } = req.body;
    
    let query = `
      SELECT 
        s.id as student_id,
        s.name as student_name,
        s.barcode,
        c.name as class_name,
        COUNT(a.id) as total_sessions,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
        ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 2) as attendance_rate
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN attendance a ON s.id = a.student_id
      LEFT JOIN sessions se ON a.session_id = se.id
      WHERE s.is_active = TRUE
    `;
    
    const params = [];
    
    if (startDate) {
      query += ' AND DATE(a.record_time) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(a.record_time) <= ?';
      params.push(endDate);
    }
    
    if (classId) {
      query += ' AND s.class_id = ?';
      params.push(classId);
    }
    
    query += ' GROUP BY s.id, s.name, s.barcode, c.name ORDER BY s.name';
    
    console.log('🔍 استعلام تقرير الحضور:', query);
    console.log('📊 معاملات الاستعلام:', params);
    
    const reports = await executeQuery(query, params);
    
    console.log('✅ تم جلب', reports.length, 'سجل لتقرير الحضور');
    if (reports.length > 0) {
      console.log('📋 عينة من بيانات الحضور:', reports.slice(0, 3));
    }
    
    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('خطأ في جلب تقرير الحضور:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب تقرير الحضور' });
  }
});

// إدارة الواتساب
router.post('/whatsapp/initialize', async (req, res) => {
  try {
    console.log('🚀 طلب تهيئة الواتساب...');
    
    // محاولة التهيئة عبر Venom Proxy أولاً
    try {
      const result = await whatsappService.initialize();
      
      if (result && result.success) {
        console.log('✅ تم تهيئة الواتساب عبر Venom Proxy بنجاح');
        res.json({
          success: true,
          message: result.message || 'تم تهيئة الواتساب بنجاح',
          alreadyConnected: result.alreadyConnected || false
        });
      } else {
        console.log('❌ فشل في تهيئة الواتساب عبر Venom Proxy:', result?.message);
        res.status(500).json({
          success: false,
          message: result?.message || 'فشل في تهيئة الواتساب. تأكد من تشغيل Venom Proxy على جهازك المحلي.'
        });
      }
    } catch (proxyError) {
      console.error('❌ خطأ في الاتصال بـ Venom Proxy:', proxyError.message);
      res.status(500).json({
        success: false,
        message: `خطأ في الاتصال بـ Venom Proxy: ${proxyError.message}. تأكد من تشغيل الخادم الوسيط على جهازك المحلي.`
      });
    }
  } catch (error) {
    console.error('خطأ في تهيئة الواتساب:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في الخادم: ' + error.message
    });
  }
});

router.get('/whatsapp/status', (req, res) => {
  try {
    // فحص حالة الاتصال عبر Venom Proxy
    whatsappService.checkConnection().then(isConnected => {
      console.log('📊 حالة اتصال الواتساب عبر Venom Proxy:', isConnected ? 'متصل' : 'غير متصل');
      
      res.json({
        success: true,
        data: {
          connected: isConnected,
          timestamp: new Date().toISOString(),
          proxyUrl: process.env.VENOM_PROXY_URL
        }
      });
    }).catch(error => {
      console.error('❌ خطأ في فحص حالة الاتصال:', error);
      res.json({
        success: true,
        data: {
          connected: false,
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    });
  } catch (error) {
    console.error('❌ خطأ في فحص حالة الواتساب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في فحص حالة الواتساب: ' + error.message
    });
  }
});

router.post('/whatsapp/send-session-report', async (req, res) => {
  try {
    console.log('📊 طلب إرسال تقرير الحصة:', req.body);
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'معرف الحصة مطلوب' });
    }
    
    // تحديث حالة الإرسال إلى "جاري الإرسال"
    //await SessionReportStatus.markAsSending(sessionId, 0);
    
    //console.log('📤 بدء إرسال تقرير الحصة:', sessionId);
   // const result = await whatsappService.sendSessionReport(sessionId);
    
    // تحديث حالة الإرسال بناءً على النتيجة
   // await SessionReportStatus.markAsCompleted(sessionId, result);

    // NEW for Count Students who got message
    // جلب عدد الطلاب في الحصة لإظهار العدد الصحيح بدلاً من 0
const countQuery = 'SELECT COUNT(*) as total FROM students WHERE class_id = (SELECT class_id FROM sessions WHERE id = ?)';
const [countResult] = await executeQuery(countQuery, [sessionId]);
const totalStudents = countResult?.total || 0;

// تحديث حالة الإرسال إلى "جاري الإرسال" مع العدد الصحيح
await SessionReportStatus.markAsSending(sessionId, totalStudents);

console.log('📤 بدء إرسال تقرير الحصة:', sessionId);
const result = await whatsappService.sendSessionReport(sessionId);

// تحديث حالة الإرسال بناءً على النتيجة
await SessionReportStatus.markAsCompleted(sessionId, result);
//--------------------------------
    
    console.log('📊 نتيجة الإرسال:', result);
    res.json({ 
      success: true, 
      message: `تم إرسال ${result.sentMessages || 0} رسالة بنجاح من أصل ${result.totalStudents || 0} طالب`,
      data: result 
    });
  } catch (error) {
    console.error('خطأ في إرسال تقرير الحصة:', error);
    
    res.status(500).json({
      success: false, 
      message: error.message || 'فشل في إرسال التقرير'
    });
  }
});

// اختبار إرسال رسالة واحدة
router.post('/whatsapp/test-message', async (req, res) => {
  try {
    console.log('🧪 طلب اختبار رسالة واتساب:', req.body);
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
    }
    
    const result = await whatsappService.testMessage(phoneNumber, message);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: result.message,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: `فشل في إرسال رسالة الاختبار: ${result.error}`
      });
    }
  } catch (error) {
    console.error('خطأ في اختبار رسالة الواتساب:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطأ في اختبار الرسالة: ' + error.message 
    });
  }
});



// 1. الحصول على إحصائيات لوحة التحكم
router.get('/dashboard/stats', async (req, res) => {
  try {
    // إحصائيات عامة
    const totalStudentsQuery = executeQuery('SELECT COUNT(*) as count FROM students WHERE is_active = TRUE');
    const totalSessionsQuery = executeQuery('SELECT COUNT(*) as count FROM sessions');
    const totalClassesQuery = executeQuery('SELECT COUNT(*) as count FROM classes WHERE is_active = TRUE');

    // إحصائيات الحضور اليوم
    const todayAttendanceQuery = executeQuery(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
      FROM attendance 
      WHERE record_time >= CURDATE() AND record_time < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    `);

    // جلب كل النتائج معًا لتسريع الأداء
    const [
      totalStudents,
      totalSessions,
      totalClasses,
      todayAttendance
    ] = await Promise.all([
      totalStudentsQuery,
      totalSessionsQuery,
      totalClassesQuery,
      todayAttendanceQuery
    ]);

    const attendanceRate = todayAttendance[0].total > 0
      ? (todayAttendance[0].present / todayAttendance[0].total) * 100
      : 0;

    res.json({
      success: true,
      data: {
        totalStudents: totalStudents[0].count,
        totalSessions: totalSessions[0].count,
        totalClasses: totalClasses[0].count,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        todayPresent: todayAttendance[0].present || 0,
        todayAbsent: todayAttendance[0].absent || 0,
      }
    });

  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات لوحة التحكم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم عند جلب الإحصائيات'
    });
  }
});


// 2. جلب حالة إرسال التقارير لحصة معينة


router.get('/sessions/:id/report-status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await SessionReportStatus.getBySessionId(id);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ خطأ في جلب حالة التقارير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حالة التقارير: ' + error.message
    });
  }
});


// 3. إعادة تعيين حالة إرسال التقارير
router.post('/sessions/:id/reset-report-status', async (req, res) => {
  try {
    const { id } = req.params;
    await SessionReportStatus.resetReportStatus(id);
    
    res.json({
      success: true,
      message: 'تم إعادة تعيين حالة إرسال التقارير'
    });
  } catch (error) {
    console.error('❌ خطأ في إعادة تعيين حالة التقارير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة تعيين حالة التقارير: ' + error.message
    });
  }
});


// 4. جلب تقرير شامل لحالة إرسال التقارير
router.get('/reports/session-reports-status', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await SessionReportStatus.getComprehensiveReport(startDate, endDate);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('❌ خطأ في جلب تقرير حالة التقارير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تقرير حالة التقارير: ' + error.message
    });
  }
});


// 5. إضافة endpoint لجلب معلومات الحساب
router.get('/whatsapp/info', async (req, res) => {
  try {
    console.log('👤 طلب معلومات حساب WhatsApp-Web.js...');
    const accountInfo = await whatsappService.getAccountInfo();
    
    if (accountInfo) {
      res.json({
        success: true,
        data: accountInfo
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'لا يمكن جلب معلومات الحساب. تأكد من الاتصال.'
      });
    }
  } catch (error) {
    console.error('❌ خطأ في جلب معلومات الحساب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب معلومات الحساب: ' + error.message
    });
  }
});


// 6. إضافة endpoint لاختبار الرسائل (ملاحظة: تم إصلاح خطأ try/catch هنا أيضًا)
router.post('/whatsapp/test-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف مطلوب'
      });
    }
    
    console.log('🧪 طلب اختبار رسالة WhatsApp-Web.js...');
    const result = await whatsappService.testMessage(phoneNumber, message);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار الرسالة:', error);
    // تحديث حالة الإرسال إلى "فشل"
    if (req.body.sessionId) {
      await SessionReportStatus.createOrUpdate(req.body.sessionId, {
        status: 'failed',
        errorMessage: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'خطأ في اختبار الرسالة: ' + error.message
    });
  }
});



module.exports = router;
