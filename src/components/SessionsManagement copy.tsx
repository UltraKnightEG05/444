import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Edit, Trash2, Search, Eye, Clock, Play, Square, CheckCircle, Star, MessageSquare, X, ToggleLeft, ToggleRight, Pause, Users, BookOpen, MapPin, Check } from 'lucide-react';

export const SessionsManagement: React.FC = () => {
  const { sessions, classes, students, addSession, updateSession, deleteSession, toggleSessionStatus, attendance, addReport, updateReport, deleteReport, reports, teachers, subjects, locations, grades, getWhatsAppStatus, hasPermission, recordAttendance, sendSessionReport } = useApp();
  
  // إضافة تسجيل للتحقق من البيانات
  React.useEffect(() => {
    console.log('🔍 SessionsManagement - البيانات المتاحة:');
    console.log('- الحصص:', sessions.length);
    console.log('- المجموعات:', classes.length);
    console.log('- الطلاب:', students.length);
    console.log('- المعلمين:', teachers.length);
    console.log('- المواد:', subjects.length);
    console.log('- الأماكن:', locations.length);

    
    if (sessions.length > 0) {
      console.log('📋 عينة من الحصص:', sessions.slice(0, 3));
    }
  }, [sessions, classes, students, teachers, subjects, locations]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState<{ show: boolean, sessionId: string, studentId: string, studentName: string }>({ show: false, sessionId: '', studentId: '', studentName: '' });
  const [previousSessionDetails, setPreviousSessionDetails] = useState<string | null>(null);
  const [showBulkEvaluation, setShowBulkEvaluation] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkEvaluationData, setBulkEvaluationData] = useState({
    teacherRating: 5,
    participation: 5,
    behavior: 'ممتاز',
    homework: 'completed' as 'completed' | 'incomplete' | 'partial',
    quizScore: '',
    recitationScore: '',
    comments: ''
  });
  const [formData, setFormData] = useState({
    classId: '',
    locationId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as const,
    notes: ''
  });
  const [reportData, setReportData] = useState({
    teacherRating: 5,
    recitationScore: '',
    quizScore: '',
    participation: 5,
    behavior: 'ممتاز',
    homework: 'completed' as const,
    comments: '',
    strengths: '',
    areasForImprovement: ''
  });

  const connectionStatus = getWhatsAppStatus();

  const filteredSessions = sessions.filter(session => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
    const subject = subjects.find(s => s.id === sessionClass?.subjectId);
    
    const matchesSearch = sessionClass?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || session.status === statusFilter;
    const matchesSubject = subjectFilter === '' || (subject && subject.name.toLowerCase().includes(subjectFilter.toLowerCase()));
    const matchesTeacher = teacherFilter === '' || (teacher && teacher.name.toLowerCase().includes(teacherFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesSubject && matchesTeacher;
  });

  // حساب البيانات للصفحة الحالية
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, subjectFilter, teacherFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sessionData = {
        classId: formData.classId,
        locationId: formData.locationId || null,
        startTime: new Date(formData.startTime),
        endTime: new Date(formData.endTime),
        status: formData.status,
        notes: formData.notes || null
      };

      if (editingSession) {
        await updateSession(editingSession, sessionData);
        setEditingSession(null);
      } else {
        await addSession(sessionData);
      }
      
      setFormData({
        classId: '',
        locationId: '',
        startTime: '',
        endTime: '',
        status: 'scheduled',
        notes: ''
      });
      setShowAddForm(false);
    } catch (error) {
      alert('حدث خطأ أثناء حفظ الحصة');
    }
  };

  const handleEdit = (session: any) => {
    setEditingSession(session.id);
    setFormData({
      classId: session.classId,
      locationId: session.locationId || '',
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: new Date(session.endTime).toISOString().slice(0, 16),
      status: session.status,
      notes: session.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      try {
        await deleteSession(id);
      } catch (error) {
        alert('حدث خطأ أثناء حذف الحصة');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleSessionStatus(id);
    } catch (error) {
      alert('حدث خطأ أثناء تغيير حالة الحصة');
    }
  };

  const handleSendReport = async (sessionId: string) => {
    if (window.confirm('هل أنت متأكد من إرسال تقرير هذه الحصة عبر الواتساب؟')) {
      try {
        const success = await sendSessionReport(sessionId);
        if (success) {
          alert('تم إرسال التقرير بنجاح!');
        } else {
          alert('فشل في إرسال التقرير. تحقق من اتصال الواتساب.');
        }
      } catch (error) {
        alert('حدث خطأ أثناء إرسال التقرير');
      }
    }
  };

  const handleAddReport = (sessionId: string, studentId: string, studentName: string) => {
    // حفظ حالة modal تفاصيل الحصة قبل إغلاقه
    setPreviousSessionDetails(showSessionDetails);
    setShowSessionDetails(null);
    
    setShowReportForm({ show: true, sessionId, studentId, studentName });
    
    // البحث عن تقرير موجود
    const existingReport = reports.find(r => r.sessionId === sessionId && r.studentId === studentId);
    if (existingReport) {
      setReportData({
        teacherRating: existingReport.teacherRating,
        quizScore: existingReport.quizScore?.toString() || '',
        recitationScore: existingReport.recitationScore?.toString() || '',
        participation: existingReport.participation,
        behavior: existingReport.behavior,
        homework: existingReport.homework,
        comments: existingReport.comments || '',
        strengths: existingReport.strengths || '',
        areasForImprovement: existingReport.areasForImprovement || ''
      });
    } else {
      setReportData({
        teacherRating: 5,
        quizScore: '',
        recitationScore: '',
        participation: 5,
        behavior: 'ممتاز',
        homework: 'completed',
        comments: '',
        strengths: '',
        areasForImprovement: ''
      });
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addReport({
        studentId: showReportForm.studentId,
        sessionId: showReportForm.sessionId,
        teacherRating: reportData.teacherRating,
        quizScore: reportData.quizScore ? parseFloat(reportData.quizScore) : null,
        recitationScore: reportData.recitationScore ? parseFloat(reportData.recitationScore) : null,
        participation: reportData.participation,
        behavior: reportData.behavior,
        homework: reportData.homework,
        comments: reportData.comments,
        strengths: reportData.strengths,
        areasForImprovement: reportData.areasForImprovement
      });
      
      setShowReportForm({ show: false, sessionId: '', studentId: '', studentName: '' });
      setReportData({
        teacherRating: 5,
        quizScore: '',
        recitationScore: '',
        participation: 5,
        behavior: 'ممتاز',
        homework: 'completed',
        comments: '',
        strengths: '',
        areasForImprovement: ''
      });
      
      // إعادة فتح modal تفاصيل الحصة إذا كان مفتوحاً من قبل
      if (previousSessionDetails) {
        setShowSessionDetails(previousSessionDetails);
        setPreviousSessionDetails(null);
      }
      
      alert('تم حفظ التقرير بنجاح!');
    } catch (error) {
      alert('حدث خطأ أثناء حفظ التقرير');
    }
  };

  // دالة اختيار/إلغاء اختيار طالب للتقييم الجماعي
  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // دالة اختيار/إلغاء اختيار جميع الطلاب
  const handleSelectAllStudents = () => {
    const sessionStudents = getSessionStudents(showSessionDetails!);
    if (selectedStudents.length === sessionStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(sessionStudents.map(s => s.id));
    }
  };

  // دالة حفظ التقييم الجماعي
  const handleBulkEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      alert('يرجى اختيار طالب واحد على الأقل');
      return;
    }

    try {
      for (const studentId of selectedStudents) {
        const reportData = {
          studentId,
          sessionId: showSessionDetails!,
          teacherRating: bulkEvaluationData.teacherRating,
          participation: bulkEvaluationData.participation,
          behavior: bulkEvaluationData.behavior,
          homework: bulkEvaluationData.homework,
          quizScore: bulkEvaluationData.quizScore ? parseFloat(bulkEvaluationData.quizScore) : null,
          recitationScore: bulkEvaluationData.recitationScore ? parseFloat(bulkEvaluationData.recitationScore) : null,
          comments: bulkEvaluationData.comments || null
        };

        await addReport(reportData);
      }

      // إعادة تعيين النموذج
      setBulkEvaluationData({
        teacherRating: 5,
        participation: 5,
        behavior: 'ممتاز',
        homework: 'completed',
        quizScore: '',
        recitationScore: '',
        comments: ''
      });
      setSelectedStudents([]);
      setShowBulkEvaluation(false);

      alert(`تم إضافة التقييم لـ ${selectedStudents.length} طالب بنجاح`);
    } catch (error) {
      console.error('خطأ في حفظ التقييم الجماعي:', error);
      alert('حدث خطأ أثناء حفظ التقييم');
    }
  };

  // دالة حذف تقييم طالب
  const handleDeleteStudentReport = async (studentId: string, reportId: string, studentName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف تقييم ${studentName}؟`)) {
      try {
        await deleteReport(reportId);
        alert(`تم حذف تقييم ${studentName} بنجاح`);
      } catch (error) {
        console.error('خطأ في حذف التقييم:', error);
        alert('حدث خطأ أثناء حذف التقييم');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      classId: '',
      locationId: '',
      startTime: '',
      endTime: '',
      status: 'scheduled',
      notes: ''
    });
    setEditingSession(null);
    setShowAddForm(false);
  };

  const getSessionStudents = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return [];
    
    // جلب جميع طلاب المجموعة
    const classStudents = students.filter(s => s.classId === session.classId);
    const sessionAttendance = attendance.filter(a => a.sessionId === sessionId);
    
    console.log('🔍 تحليل طلاب الحصة:', {
      sessionId,
      classId: session.classId,
      totalClassStudents: classStudents.length,
      attendanceRecords: sessionAttendance.length
    });
    
    return classStudents.map(student => {
      const attendanceRecord = sessionAttendance.find(a => a.studentId === student.id);
      const studentReport = reports.find(r => r.studentId === student.id && r.sessionId === sessionId);
      
      const studentData = {
        ...student,
        attendanceStatus: attendanceRecord?.status || 'absent',
        hasReport: !!studentReport,
        reportId: studentReport?.id || null,
        attendanceId: attendanceRecord?.id,
        teacherRating: studentReport?.teacherRating || null,
        participation: studentReport?.participation || null,
        behavior: studentReport?.behavior || null,
        homework: studentReport?.homework || null,
        quizScore: studentReport?.quizScore || null,
        recitationScore: studentReport?.recitationScore || null,
      };
      
      console.log(`👤 الطالب ${student.name}: ${studentData.attendanceStatus}, تقرير: ${studentData.hasReport ? 'موجود' : 'غير موجود'}`);
      console.log("✅ recitationScore Debug:", student.name, studentReport?.recitationScore);

      
      return studentData;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدولة';
      case 'active': return 'نشطة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <Square className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 ml-2" />
          إدارة الحصص
        </h1>
        {hasPermission('sessionsEdit') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة حصة
          </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {editingSession ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المجموعة *
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المجموعة</option>
                  {classes.map(cls => {
                    const grade = grades.find(g => g.id === cls.gradeId);
                    const teacher = teachers.find(t => t.id === cls.teacherId);
                    const location = locations.find(l => l.id === cls.locationId);

                    const displayName = `${cls.name}${grade ? ` - ${grade.name}` : ''}${teacher ? ` - ${teacher.name}` : ''}${location ? ` - ${location.name}` : ''}`;

                    return (
                      <option key={cls.id} value={cls.id}>{displayName}</option>
                    );
                  })}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت البداية *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    وقت النهاية *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغية</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملاحظات اختيارية..."
                />
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingSession ? 'حفظ التغييرات' : 'إضافة الحصة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نموذج إضافة تقرير */}
      {showReportForm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              تقرير أداء: {showReportForm.studentName}
            </h2>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تقييم المعلم (1-5) *
                  </label>
                  <select
                    value={reportData.teacherRating}
                    onChange={(e) => setReportData({ ...reportData, teacherRating: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={5}>ممتاز (5)</option>
                    <option value={4}>جيد جداً (4)</option>
                    <option value={3}>جيد (3)</option>
                    <option value={2}>مقبول (2)</option>
                    <option value={1}>ضعيف (1)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    درجة التسميع (0-10) - اختياري
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={reportData.recitationScore}              
                    onChange={(e) => setReportData({ ...reportData, recitationScore: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="أدخل درجة التسميع (اختياري)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    درجة الاختبار (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reportData.quizScore}
                    onChange={(e) => setReportData({ ...reportData, quizScore: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="اتركه فارغاً إذا لم يكن هناك اختبار"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المشاركة (1-5) *
                  </label>
                  <select
                    value={reportData.participation}
                    onChange={(e) => setReportData({ ...reportData, participation: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={5}>ممتاز (5)</option>
                    <option value={4}>جيد جداً (4)</option>
                    <option value={3}>جيد (3)</option>
                    <option value={2}>مقبول (2)</option>
                    <option value={1}>ضعيف (1)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السلوك
                </label>
                <select
                  value={reportData.behavior}
                  onChange={(e) => setReportData({ ...reportData, behavior: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد جداً">جيد جداً</option>
                  <option value="جيد">جيد</option>
                  <option value="مقبول">مقبول</option>
                  <option value="يحتاج تحسين">يحتاج تحسين</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  حالة الواجب
                </label>
                <select
                  value={reportData.homework}
                  onChange={(e) => setReportData({ ...reportData, homework: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completed">مكتمل</option>
                  <option value="partial">جزئي</option>
                  <option value="incomplete">غير مكتمل</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تعليقات المعلم
                </label>
                <textarea
                  value={reportData.comments}
                  onChange={(e) => setReportData({ ...reportData, comments: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="تعليقات حول أداء الطالب..."
                />
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  حفظ التقرير
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportForm({ show: false, sessionId: '', studentId: '', studentName: '' });
                    // إعادة فتح modal تفاصيل الحصة إذا كان مفتوحاً من قبل
                    if (previousSessionDetails) {
                      setShowSessionDetails(previousSessionDetails);
                      setPreviousSessionDetails(null);
                    }
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الحصة */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const session = sessions.find(s => s.id === showSessionDetails);
              const sessionClass = classes.find(c => c.id === session?.classId);
              const sessionStudents = getSessionStudents(showSessionDetails);
              const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
              const subject = subjects.find(s => s.id === sessionClass?.subjectId);
              const location = locations.find(l => l.id === session?.locationId);
              const grade = grades.find(g => g.id === sessionClass?.gradeId);
              const presentStudents = sessionStudents.filter(s => s.attendanceStatus === 'present');
              const absentStudents = sessionStudents.filter(s => s.attendanceStatus === 'absent');

              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل حصة {sessionClass?.name}</h2>
                    <button
                      onClick={() => {
                        setShowSessionDetails(null);
                        setSelectedStudents([]);
                        setShowBulkEvaluation(false);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {/* معلومات الحصة */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">المجموعة</h3>
                      <p className="text-blue-700">{sessionClass?.name}</p>
                      {grade && <p className="text-sm text-blue-600">{grade.name}</p>}
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">المعلم</h3>
                      <p className="text-green-700">{teacher?.name || 'غير محدد'}</p>
                      {subject && <p className="text-sm text-green-600">{subject.name}</p>}
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900">المكان والوقت</h3>
                      <p className="text-purple-700">{location?.name || 'غير محدد'}</p>
                      <p className="text-sm text-purple-600">
                        {session ? new Date(session.startTime).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        }) : ''}
                      </p>
                    </div>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">قائمة الطلاب ({sessionStudents.length})</h3>
                    <div className="flex space-x-2 space-x-reverse">
                      {!showBulkEvaluation ? (
                        <button
                          onClick={() => setShowBulkEvaluation(true)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                        >
                          <Star className="h-4 w-4 ml-2" />
                          التقييم الجماعي
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowBulkEvaluation(false);
                            setSelectedStudents([]);
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200"
                        >
                          إلغاء التقييم الجماعي
                        </button>
                      )}
                      <button
                        onClick={() => handleSendReport(showSessionDetails)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                      >
                        <MessageSquare className="h-4 w-4 ml-2" />
                        إرسال تقرير الحصة كاملاً
                      </button>
                    </div>
                  </div>

                  {/* نموذج التقييم الجماعي */}
                  {showBulkEvaluation && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-green-900 mb-4 flex items-center">
                        <Star className="h-5 w-5 ml-2" />
                        التقييم الجماعي ({selectedStudents.length} طالب مختار)
                      </h4>

                      <form onSubmit={handleBulkEvaluationSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              تقييم المعلم (1-5)
                            </label>
                            <select
                              value={bulkEvaluationData.teacherRating}
                              onChange={(e) => setBulkEvaluationData({ ...bulkEvaluationData, teacherRating: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={5}>ممتاز (5)</option>
                              <option value={4}>جيد جداً (4)</option>
                              <option value={3}>جيد (3)</option>
                              <option value={2}>مقبول (2)</option>
                              <option value={1}>ضعيف (1)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              درجة التسميع (0-10) - اختياري
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={bulkEvaluationData.recitationScore}
                              onChange={(e) => setBulkEvaluationData({ ...bulkEvaluationData, recitationScore: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="أدخل درجة التسميع (اختياري)"
                            />
                          </div>
                          

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              المشاركة (1-5)
                            </label>
                            <select
                              value={bulkEvaluationData.participation}
                              onChange={(e) => setBulkEvaluationData({ ...bulkEvaluationData, participation: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={5}>ممتاز (5)</option>
                              <option value={4}>جيد جداً (4)</option>
                              <option value={3}>جيد (3)</option>
                              <option value={2}>مقبول (2)</option>
                              <option value={1}>ضعيف (1)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              السلوك
                            </label>
                            <select
                              value={bulkEvaluationData.behavior}
                              onChange={(e) => setBulkEvaluationData({ ...bulkEvaluationData, behavior: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="ممتاز">ممتاز</option>
                              <option value="جيد جداً">جيد جداً</option>
                              <option value="جيد">جيد</option>
                              <option value="مقبول">مقبول</option>
                              <option value="يحتاج تحسين">يحتاج تحسين</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الواجب
                            </label>
                            <select
                              value={bulkEvaluationData.homework}
                              onChange={(e) => setBulkEvaluationData({ ...bulkEvaluationData, homework: e.target.value as 'completed' | 'incomplete' | 'partial' })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="completed">مكتمل</option>
                              <option value="partial">جزئي</option>
                              <option value="incomplete">غير مكتمل</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            درجة الاختبار (اختياري)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={bulkEvaluationData.quizScore}
                            onChange={(e) => setBulkEvaluationData({ ...bulkEvaluationData, quizScore: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            تعليقات
                          </label>
                          <textarea
                            value={bulkEvaluationData.comments}
                            onChange={(e) => setBulkEvaluationData({ ...bulkEvaluationData, comments: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="تعليقات اختيارية..."
                          />
                        </div>

                        <div className="space-y-4">
                          {sessionStudents.filter(s => selectedStudents.includes(s.id)).map(student => (
                            <div key={student.id} className="flex justify-between items-center">
                              <span>{student.name}</span>
                              {student.reportId && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudentReport(student.id, student.reportId, student.name)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
                                >
                                  حذف التقييم
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={selectedStudents.length === 0}
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            حفظ التقييم للطلاب المختارين ({selectedStudents.length})
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* قائمة الطلاب */}
                  <div>
                    {showBulkEvaluation && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStudents.length === sessionStudents.length}
                            onChange={handleSelectAllStudents}
                            className="ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            اختيار جميع الطلاب ({sessionStudents.length})
                          </span>
                        </label>
                      </div>
                    )}

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            {showBulkEvaluation && (
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">اختيار</th>
                            )}
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الحضور</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">التقييم</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">التسميع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">درجة الاختبار</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المشاركة</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">السلوك</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الواجب</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sessionStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              {showBulkEvaluation && (
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => handleStudentSelection(student.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                </td>
                              )}
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.barcode}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  student.attendanceStatus === 'present' ? 'bg-green-100 text-green-800' :
                                  student.attendanceStatus === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                  student.attendanceStatus === 'excused' ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {student.attendanceStatus === 'present' ? 'حاضر' :
                                   student.attendanceStatus === 'late' ? 'متأخر' :
                                   student.attendanceStatus === 'excused' ? 'معذور' : 'غائب'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {student.teacherRating ? (
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-400 ml-1" />
                                    <span>{student.teacherRating}/5</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {student.recitationScore ? (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      student.recitationScore >= 8 ? 'bg-green-100 text-green-800' :
                                      student.recitationScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {student.recitationScore}/10
                                    </span>
                                  ) : '-'}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {student.quizScore ? (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      student.quizScore >= 80 ? 'bg-green-100 text-green-800' :
                                      student.quizScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {student.quizScore}%
                                    </span>
                                  ) : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {student.participation ? (
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-blue-400 ml-1" />
                                    <span>{student.participation}/5</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {student.behavior || '-'}
                              </td>
                              <td className="px-4 py-2">
                                {student.homework ? (
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    student.homework === 'completed' ? 'bg-green-100 text-green-800' :
                                    student.homework === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {student.homework === 'completed' ? 'مكتمل' :
                                     student.homework === 'partial' ? 'جزئي' : 'غير مكتمل'}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => handleAddReport(showSessionDetails, student.id, student.name)}
                                    className="text-blue-600 hover:text-blue-900 p-1"
                                    title={student.hasReport ? 'تعديل التقييم' : 'إضافة تقييم'}
                                  >
                                    <Star className="h-4 w-4" />
                                  </button>
                                  {student.reportId && (
                                    <button
                                      onClick={() => handleDeleteStudentReport(student.id, student.reportId, student.name)}
                                      className="text-red-600 hover:text-red-900 p-1"
                                      title="حذف التقييم"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => recordAttendance({
                                      studentId: student.id,
                                      sessionId: showSessionDetails,
                                      status: student.attendanceStatus === 'present' ? 'absent' : 'present'
                                    })}
                                    className={`text-${student.attendanceStatus === 'present' ? 'red' : 'green'}-600 hover:text-${student.attendanceStatus === 'present' ? 'red' : 'green'}-900 p-1`}
                                    title={student.attendanceStatus === 'present' ? 'تسجيل غياب' : 'تسجيل حضور'}
                                  >
                                    {student.attendanceStatus === 'present' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {sessionStudents.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>لا يوجد طلاب في هذه الحصة</p>
                      </div>
                    )}
                  </div>

                  {/* الطلاب الحاضرون والغائبون */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-green-600">الطلاب الحاضرون ({presentStudents.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {presentStudents.map((student) => (
                          <div key={student.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {student.hasReport && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    تم التقييم
                                  </span>
                                )}
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'absent'
                                  })}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  تسجيل غياب
                                </button>
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id, // تم التصحيح هنا
                                    sessionId: showSessionDetails,
                                    status: 'late'
                                  })}
                                  className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                                >
                                  تأخير
                                </button>
                                <button
                                  onClick={() => handleAddReport(showSessionDetails, student.id, student.name)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                                >
                                  <Star className="h-3 w-3 ml-1" />
                                  {student.hasReport ? 'تعديل التقييم' : 'إضافة تقييم'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {presentStudents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>لا يوجد طلاب حاضرون</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-red-600">الطلاب الغائبون ({absentStudents.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {absentStudents.map((student) => (
                          <div key={student.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                                <p className="text-xs text-red-600">غائب</p>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'present'
                                  })}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  تسجيل حضور
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {absentStudents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>جميع الطلاب حاضرون! 🎉</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* إضافة قسم الطلاب المتأخرين والمعذورين */}
                  {sessionStudents.filter(s => s.attendanceStatus === 'late' || s.attendanceStatus === 'excused').length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4 text-yellow-600">
                        الطلاب المتأخرون والمعذورون ({sessionStudents.filter(s => s.attendanceStatus === 'late' || s.attendanceStatus === 'excused').length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sessionStudents.filter(s => s.attendanceStatus === 'late' || s.attendanceStatus === 'excused').map((student) => (
                          <div key={student.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                                <p className="text-xs text-yellow-600">
                                  {student.attendanceStatus === 'late' ? 'متأخر' : 'معذور'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'present'
                                  })}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  تحويل لحاضر
                                </button>
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'absent'
                                  })}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  تحويل لغائب
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* البحث والفلترة */}
      <div className="filters-container">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث عن حصة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="active">نشطة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغية</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="البحث بالمادة..."
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="البحث بالمعلم..."
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setSubjectFilter('');
                setTeacherFilter('');
              }}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الحصص */}
      <div className="table-container">
        {/* عرض الجدول على الشاشات الكبيرة */}
        <div className="desktop-table">
          <div className="table-content">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المجموعة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المادة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المكان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التوقيت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSessions.map((session) => {
                  const sessionClass = classes.find(c => c.id === session.classId);
                  const grade = grades.find(g => g.id === sessionClass?.gradeId);
                  const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
                  const subject = subjects.find(s => s.id === sessionClass?.subjectId);
                  const location = locations.find(l => l.id === sessionClass.locationId);
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 text-blue-600 ml-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sessionClass?.name || 'مجموعة غير محدد'} - {grade?.name || ''}
                            </div>
                            <div className="text-sm text-gray-500">
                              {teacher?.name || 'معلم غير محدد'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {subject?.name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 text-gray-400 ml-1" />
                          {location?.name || 'غير محدد'}
                          {location?.roomNumber && (
                            <span className="text-gray-500 mr-1">({location.roomNumber})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="h-4 w-4 text-gray-400 ml-1" />
                          <div>
                            <div>{new Date(session.startTime).toLocaleDateString('en-GB')}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(session.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(session.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setShowSessionDetails(session.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {hasPermission('sessionsEdit') && (
                            <button
                              onClick={() => handleEdit(session)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {hasPermission('sessionsEdit') && (
                            <button
                              onClick={() => handleToggleStatus(session.id)}
                              className={`p-1 ${session.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                              title={session.status === 'active' ? 'إيقاف' : 'تفعيل'}
                            >
                              {session.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                          )}
                          {hasPermission('whatsapp') && (
                            <button
                              onClick={() => handleSendReport(session.id)}
                              className="text-purple-600 hover:text-purple-900 p-1"
                              title="إرسال التقرير"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                          {hasPermission('sessionsDelete') && (
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* عرض البطاقات على الموبايل */}
        <div className="mobile-cards">
          {currentSessions.map((session) => {
            const sessionClass = classes.find(c => c.id === session.classId);
            const grade = grades.find(g => g.id === sessionClass?.gradeId);
            const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
            const subject = subjects.find(s => s.id === sessionClass?.subjectId);
            const location = locations.find(l => l.id === sessionClass.locationId);
            
            return (
              <div key={session.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="mobile-card-title flex items-center">
                    <BookOpen className="h-5 w-5 text-blue-600 ml-2" />
                    {sessionClass?.name || 'مجموعة غير محدد'} - {grade?.name || ''}
                  </div>
                  <div className="mobile-btn-group">
                    <button
                      onClick={() => setShowSessionDetails(session.id)}
                      className="mobile-btn text-blue-600 hover:text-blue-900"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('sessionsEdit') && (
                      <button
                        onClick={() => handleEdit(session)}
                        className="mobile-btn text-green-600 hover:text-green-900"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission('sessionsDelete') && (
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="mobile-btn text-red-600 hover:text-red-900"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mobile-card-content">
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المعلم</div>
                    <div className="mobile-card-value">{teacher?.name || 'غير محدد'}</div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المادة</div>
                    <div className="mobile-card-value">{subject?.name || 'غير محدد'}</div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المكان</div>
                    <div className="mobile-card-value">
                      {location?.name || 'غير محدد'}
                      {location?.roomNumber && ` (${location.roomNumber})`}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">التاريخ</div>
                    <div className="mobile-card-value">
                      {new Date(session.startTime).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الوقت</div>
                    <div className="mobile-card-value">
                      {new Date(session.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(session.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الحالة</div>
                    <div className="mobile-card-value">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mobile-card-actions">
                  {hasPermission('sessionsEdit') && (
                    <button
                      onClick={() => handleToggleStatus(session.id)}
                      className={`mobile-action-btn ${session.status === 'active' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                    >
                      {session.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {session.status === 'active' ? 'إيقاف' : 'تفعيل'}
                    </button>
                  )}
                  {hasPermission('whatsapp') && (
                    <button
                      onClick={() => handleSendReport(session.id)}
                      className="mobile-action-btn bg-purple-100 text-purple-800 hover:bg-purple-200"
                    >
                      <MessageSquare className="h-4 w-4" />
                      إرسال التقرير
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            
            <div className="flex space-x-1 space-x-reverse">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {currentSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filteredSessions.length === 0 ? 'لا توجد جلسات مطابقة للبحث' : 'لا توجد بيانات في هذه الصفحة'}
          </p>
        </div>
      )}
    </div>
  );
};
