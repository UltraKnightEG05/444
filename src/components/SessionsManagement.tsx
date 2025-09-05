import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Edit, Trash2, Search, Eye, X, Play, Pause, MessageSquare, CheckCircle, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

export const SessionsManagement: React.FC = () => {
  const { sessions, classes, teachers, subjects, locations, grades, addSession, updateSession, deleteSession, toggleSessionStatus, sendSessionReport, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState<string | null>(null);
  const [sendingReports, setSendingReports] = useState<{ [key: string]: boolean }>({});
  const [reportStatuses, setReportStatuses] = useState<{ [key: string]: any }>({});
  const [formData, setFormData] = useState({
    classId: '',
    locationId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as const,
    notes: ''
  });

  // جلب حالة إرسال التقارير لجميع الحصص
  React.useEffect(() => {
    const fetchReportStatuses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reports/session-status`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const statusMap: { [key: string]: any } = {};
            result.data.forEach((status: any) => {
              statusMap[status.session_id] = status;
            });
            setReportStatuses(statusMap);
          }
        }
      } catch (error) {
        console.error('خطأ في جلب حالة التقارير:', error);
      }
    };

    if (sessions.length > 0) {
      fetchReportStatuses();
    }
  }, [sessions]);

  // دالة للحصول على حالة إرسال التقارير
  const getReportStatus = (sessionId: string) => {
    const status = reportStatuses[sessionId];
    if (!status) {
      return {
        status: 'pending',
        icon: Clock,
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        text: 'لم يتم الإرسال',
        details: null
      };
    }

    switch (status.status) {
      case 'sent':
        return {
          status: 'sent',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'تم الإرسال',
          details: `${status.successful_sends}/${status.total_students} طالب`
        };
      case 'failed':
        return {
          status: 'failed',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'فشل',
          details: status.error_message || 'فشل في الإرسال'
        };
      case 'partial_failed':
        return {
          status: 'partial_failed',
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'فشل جزئي',
          details: `نجح: ${status.successful_sends}، فشل: ${status.failed_sends}`
        };
      case 'sending':
        return {
          status: 'sending',
          icon: RefreshCw,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          text: 'جاري الإرسال',
          details: `${status.successful_sends}/${status.total_students} تم إرساله`
        };
      default:
        return {
          status: 'pending',
          icon: Clock,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          text: 'لم يتم الإرسال',
          details: null
        };
    }
  };

  // دالة إرسال تقارير الحصة
  const handleSendSessionReport = async (sessionId: string) => {
    if (sendingReports[sessionId]) {
      return; // منع الإرسال المتعدد
    }

    setSendingReports(prev => ({ ...prev, [sessionId]: true }));
    
    try {
      console.log('📤 بدء إرسال تقارير الحصة:', sessionId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/send-session-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ تم إرسال التقارير بنجاح!\n\nالإحصائيات:\n- إجمالي الطلاب: ${result.totalStudents}\n- تم الإرسال: ${result.sentMessages}\n- فشل: ${result.failedMessages}`);
        
        // تحديث حالة التقارير
        setReportStatuses(prev => ({
          ...prev,
          [sessionId]: {
            status: result.failedMessages === 0 ? 'sent' : result.sentMessages === 0 ? 'failed' : 'partial_failed',
            total_students: result.totalStudents,
            successful_sends: result.sentMessages,
            failed_sends: result.failedMessages,
            last_attempt_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          }
        }));
      } else {
        alert(`❌ فشل في إرسال التقارير:\n${result.message}`);
        
        // تحديث حالة الفشل
        setReportStatuses(prev => ({
          ...prev,
          [sessionId]: {
            status: 'failed',
            error_message: result.message,
            last_attempt_at: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('خطأ في إرسال التقارير:', error);
      alert('حدث خطأ أثناء إرسال التقارير');
      
      // تحديث حالة الفشل
      setReportStatuses(prev => ({
        ...prev,
        [sessionId]: {
          status: 'failed',
          error_message: 'خطأ في الاتصال بالخادم',
          last_attempt_at: new Date().toISOString()
        }
      }));
    } finally {
      setSendingReports(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  // دالة إعادة محاولة إرسال التقارير
  const handleRetryReports = async (sessionId: string) => {
    if (window.confirm('هل تريد إعادة محاولة إرسال التقارير لهذه الحصة؟')) {
      await handleSendSessionReport(sessionId);
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.subjectName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // حساب البيانات للصفحة الحالية
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.classId || !formData.startTime || !formData.endTime) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const sessionData = {
      classId: formData.classId,
      locationId: formData.locationId || null,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      status: formData.status,
      notes: formData.notes || null
    };

    if (editingSession) {
      updateSession(editingSession, sessionData);
      setEditingSession(null);
    } else {
      addSession(sessionData);
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

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحصة؟ سيتم حذف جميع سجلات الحضور والتقارير المرتبطة بها.')) {
      deleteSession(id);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleSessionStatus(id);
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المكان
                </label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المكان</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.roomNumber && `- ${location.roomNumber}`}
                    </option>
                  ))}
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

      {/* نافذة تفاصيل الحصة */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const session = sessions.find(s => s.id === showSessionDetails);
              const sessionClass = classes.find(c => c.id === session?.classId);
              const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
              const subject = subjects.find(s => s.id === sessionClass?.subjectId);
              const location = locations.find(l => l.id === session?.locationId);
              const grade = grades.find(g => g.id === sessionClass?.gradeId);
              const reportStatus = getReportStatus(showSessionDetails);
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل الحصة</h2>
                    <button
                      onClick={() => setShowSessionDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">معلومات الحصة</h3>
                        <div className="mt-2 space-y-2 text-sm">
                          <div><span className="font-medium">المجموعة:</span> {sessionClass?.name}</div>
                          <div><span className="font-medium">الصف:</span> {grade?.name || 'غير محدد'}</div>
                          <div><span className="font-medium">المعلم:</span> {teacher?.name || 'غير محدد'}</div>
                          <div><span className="font-medium">المادة:</span> {subject?.name || 'غير محدد'}</div>
                          <div><span className="font-medium">المكان:</span> {location?.name || 'غير محدد'}</div>
                          <div><span className="font-medium">وقت البداية:</span> {session ? new Date(session.startTime).toLocaleString('en-GB') : ''}</div>
                          <div><span className="font-medium">وقت النهاية:</span> {session ? new Date(session.endTime).toLocaleString('en-GB') : ''}</div>
                          <div>
                            <span className="font-medium">الحالة:</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${getStatusColor(session?.status || '')}`}>
                              {getStatusText(session?.status || '')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-gray-900">حالة إرسال التقارير</h3>
                        <div className="mt-2 p-4 border rounded-lg">
                          <div className="flex items-center space-x-2 space-x-reverse mb-2">
                            <reportStatus.icon className={`h-5 w-5 ${reportStatus.color} ${reportStatus.status === 'sending' ? 'animate-spin' : ''}`} />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${reportStatus.bgColor} ${reportStatus.color}`}>
                              {reportStatus.text}
                            </span>
                          </div>
                          {reportStatus.details && (
                            <div className="text-sm text-gray-600 mt-2">
                              {reportStatus.details}
                            </div>
                          )}
                          {reportStatuses[showSessionDetails]?.last_attempt_at && (
                            <div className="text-xs text-gray-500 mt-2">
                              آخر محاولة: {new Date(reportStatuses[showSessionDetails].last_attempt_at).toLocaleString('en-GB')}
                            </div>
                          )}
                          
                          <div className="mt-3 flex space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleSendSessionReport(showSessionDetails!)}
                              disabled={sendingReports[showSessionDetails!] || reportStatus.status === 'sending'}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              <MessageSquare className="h-4 w-4 ml-1" />
                              {reportStatus.status === 'pending' ? 'إرسال التقارير' : 'إعادة الإرسال'}
                            </button>
                            
                            {(reportStatus.status === 'failed' || reportStatus.status === 'partial_failed') && (
                              <button
                                onClick={() => handleRetryReports(showSessionDetails!)}
                                disabled={sendingReports[showSessionDetails!]}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                <RefreshCw className="h-4 w-4 ml-1" />
                                إعادة المحاولة
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {session?.notes && (
                        <div>
                          <h3 className="font-medium text-gray-900">الملاحظات</h3>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                            {session.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في الحصص..."
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
        </div>
      </div>

      {/* قائمة الحصص */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* عرض الجدول على الشاشات الكبيرة */}
        <div className="desktop-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المجموعة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المعلم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المادة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ والوقت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المكان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    حالة إرسال التقارير
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSessions.map((session) => {
                  const sessionClass = classes.find(c => c.id === session.classId);
                  const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
                  const subject = subjects.find(s => s.id === sessionClass?.subjectId);
                  const location = locations.find(l => l.id === session.locationId);
                  const reportStatus = getReportStatus(session.id);
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sessionClass?.name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {teacher?.name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {subject?.name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>{new Date(session.startTime).toLocaleDateString('en-GB')}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(session.startTime).toLocaleTimeString('en-GB', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {new Date(session.endTime).toLocaleTimeString('en-GB', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {location?.name || 'غير محدد'}
                          {location?.roomNumber && (
                            <div className="text-xs text-gray-500">{location.roomNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <reportStatus.icon className={`h-4 w-4 ${reportStatus.color} ${reportStatus.status === 'sending' ? 'animate-spin' : ''}`} />
                          <div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportStatus.bgColor} ${reportStatus.color}`}>
                              {reportStatus.text}
                            </span>
                            {reportStatus.details && (
                              <div className="text-xs text-gray-500 mt-1">
                                {reportStatus.details}
                              </div>
                            )}
                          </div>
                        </div>
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
                          
                          <button
                            onClick={() => handleSendSessionReport(session.id)}
                            disabled={sendingReports[session.id] || reportStatus.status === 'sending'}
                            className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="إرسال التقارير"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleStatus(session.id)}
                            className={`p-1 ${session.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            title={session.status === 'active' ? 'إيقاف الحصة' : 'تفعيل الحصة'}
                          >
                            {session.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          
                          {hasPermission('sessionsEdit') && (
                          <button
                            onClick={() => handleEdit(session)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
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

        {/* عرض بطاقات للموبايل */}
        <div className="mobile-cards">
          {currentSessions.map((session) => {
            const sessionClass = classes.find(c => c.id === session.classId);
            const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
            const subject = subjects.find(s => s.id === sessionClass?.subjectId);
            const location = locations.find(l => l.id === session.locationId);
            const grade = grades.find(g => g.id === sessionClass?.gradeId);
            const reportStatus = getReportStatus(session.id);
            
            return (
              <div key={session.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="mobile-card-title">
                    {sessionClass?.name || 'غير محدد'}
                    {grade?.name && <span className="text-sm text-gray-600"> - {grade.name}</span>}
                  </div>
                  <div className="mobile-btn-group">
                    <button
                      onClick={() => setShowSessionDetails(session.id)}
                      className="mobile-btn text-blue-600 hover:text-blue-900"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleSendSessionReport(session.id)}
                      disabled={sendingReports[session.id] || reportStatus.status === 'sending'}
                      className="mobile-btn text-green-600 hover:text-green-900 disabled:opacity-50"
                      title="إرسال التقارير"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(session.id)}
                      className={`mobile-btn ${session.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                      title={session.status === 'active' ? 'إيقاف الحصة' : 'تفعيل الحصة'}
                    >
                      {session.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    
                    {hasPermission('sessionsEdit') && (
                    <button
                      onClick={() => handleEdit(session)}
                      className="mobile-btn text-blue-600 hover:text-blue-900"
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
                    <div className="mobile-card-label">التاريخ</div>
                    <div className="mobile-card-value">{new Date(session.startTime).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الوقت</div>
                    <div className="mobile-card-value">
                      {new Date(session.startTime).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(session.endTime).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المكان</div>
                    <div className="mobile-card-value">
                      {location?.name || 'غير محدد'}
                      {location?.roomNumber && ` - ${location.roomNumber}`}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الحالة</div>
                    <div className="mobile-card-value">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">حالة إرسال التقارير</div>
                    <div className="mobile-card-value">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <reportStatus.icon className={`h-4 w-4 ${reportStatus.color} ${reportStatus.status === 'sending' ? 'animate-spin' : ''}`} />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportStatus.bgColor} ${reportStatus.color}`}>
                          {reportStatus.text}
                        </span>
                      </div>
                      {reportStatus.details && (
                        <div className="text-xs text-gray-500 mt-1">
                          {reportStatus.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {session.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600 mb-1">الملاحظات:</div>
                    <div className="text-sm text-gray-800">{session.notes}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="mr-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{startIndex + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredSessions.length)}</span> من{' '}
                  <span className="font-medium">{filteredSessions.length}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filteredSessions.length === 0 ? 'لا توجد حصص مطابقة للبحث' : 'لا توجد بيانات في هذه الصفحة'}
          </p>
        </div>
      )}
    </div>
  );
};