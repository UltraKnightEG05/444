import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Edit, Trash2, Search, Eye, Play, Square, Clock, Users, MessageSquare, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

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
  const [reportStatus, setReportStatus] = useState<{ [key: string]: { status: string, details?: string, successCount?: number, failedCount?: number, totalCount?: number } }>({});
  const [formData, setFormData] = useState({
    classId: '',
    locationId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as const,
    notes: ''
  });

  const filteredSessions = sessions.filter(session => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
    const subject = subjects.find(s => s.id === sessionClass?.subjectId);
    const location = locations.find(l => l.id === session.locationId);
    
    const matchesSearch = searchTerm === '' ||
      sessionClass?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    if (window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
      deleteSession(id);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleSessionStatus(id);
    } catch (error) {
      alert('حدث خطأ أثناء تغيير حالة الحصة');
    }
  };

  const handleSendReports = async (sessionId: string) => {
    try {
      setSendingReports(prev => ({ ...prev, [sessionId]: true }));
      setReportStatus(prev => ({ ...prev, [sessionId]: { status: 'sending', details: 'جاري الإرسال...' } }));
      
      console.log('📤 بدء إرسال تقارير الحصة:', sessionId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/send-session-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();
      console.log('📡 استجابة إرسال التقارير:', result);

      if (result.success) {
        const { totalStudents, sentMessages, failedMessages } = result;
        
        if (failedMessages === 0) {
          // تم الإرسال بنجاح لجميع أولياء الأمور
          setReportStatus(prev => ({ 
            ...prev, 
            [sessionId]: { 
              status: 'sent', 
              details: `تم إرسال التقارير بنجاح لجميع أولياء الأمور (${sentMessages}/${totalStudents})`,
              successCount: sentMessages,
              failedCount: failedMessages,
              totalCount: totalStudents
            } 
          }));
        } else if (sentMessages > 0) {
          // فشل جزئي
          setReportStatus(prev => ({ 
            ...prev, 
            [sessionId]: { 
              status: 'partial_failed', 
              details: `تم إرسال ${sentMessages} من أصل ${totalStudents} تقرير. فشل في إرسال ${failedMessages} تقرير.`,
              successCount: sentMessages,
              failedCount: failedMessages,
              totalCount: totalStudents
            } 
          }));
        } else {
          // فشل كامل
          setReportStatus(prev => ({ 
            ...prev, 
            [sessionId]: { 
              status: 'failed', 
              details: `فشل في إرسال جميع التقارير (${failedMessages}/${totalStudents}). ${result.message || 'خطأ غير محدد'}`,
              successCount: sentMessages,
              failedCount: failedMessages,
              totalCount: totalStudents
            } 
          }));
        }
      } else {
        // فشل في العملية
        setReportStatus(prev => ({ 
          ...prev, 
          [sessionId]: { 
            status: 'failed', 
            details: `فشل في إرسال التقارير: ${result.message || 'خطأ غير محدد'}`
          } 
        }));
      }
    } catch (error: any) {
      console.error('❌ خطأ في إرسال التقارير:', error);
      setReportStatus(prev => ({ 
        ...prev, 
        [sessionId]: { 
          status: 'failed', 
          details: `خطأ في الاتصال: ${error.message || 'خطأ غير محدد'}`
        } 
      }));
    } finally {
      setSendingReports(prev => ({ ...prev, [sessionId]: false }));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشطة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      case 'scheduled': return 'مجدولة';
      default: return status;
    }
  };

  const getReportStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partial_failed': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'sending': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getReportStatusText = (sessionId: string) => {
    const status = reportStatus[sessionId];
    if (!status) {
      return { text: 'لم يتم الإرسال', color: 'text-gray-600' };
    }

    switch (status.status) {
      case 'sent':
        return { text: 'تم الإرسال', color: 'text-green-600' };
      case 'failed':
        return { text: 'فشل', color: 'text-red-600' };
      case 'partial_failed':
        return { text: 'فشل جزئي', color: 'text-yellow-600' };
      case 'sending':
        return { text: 'جاري الإرسال...', color: 'text-blue-600' };
      default:
        return { text: 'لم يتم الإرسال', color: 'text-gray-600' };
    }
  };

  const getReportStatusDetails = (sessionId: string) => {
    const status = reportStatus[sessionId];
    if (!status || !status.details) return null;
    
    return status.details;
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
                    المكان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التوقيت
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
                  const grade = grades.find(g => g.id === sessionClass?.gradeId);
                  const reportStatusInfo = getReportStatusText(session.id);
                  const reportDetails = getReportStatusDetails(session.id);
                  
                  return (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sessionClass?.name || 'غير محدد'}
                        </div>
                        {grade && (
                          <div className="text-xs text-gray-500">{grade.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher?.name || 'غير محدد'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{subject?.name || 'غير محدد'}</div>
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
                        <div className="text-sm text-gray-900">
                          {new Date(session.startTime).toLocaleDateString('en-GB')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.startTime).toLocaleTimeString('en-GB', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} - {new Date(session.endTime).toLocaleTimeString('en-GB', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {getReportStatusIcon(reportStatus[session.id]?.status)}
                          <div>
                            <div className={`text-sm font-medium ${reportStatusInfo.color}`}>
                              {reportStatusInfo.text}
                            </div>
                            {reportDetails && (
                              <div className="text-xs text-gray-500 max-w-xs truncate" title={reportDetails}>
                                {reportDetails}
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
                          {hasPermission('whatsapp') && (
                            <button
                              onClick={() => handleSendReports(session.id)}
                              disabled={sendingReports[session.id]}
                              className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50"
                              title="إرسال التقارير"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                          {hasPermission('sessionsEdit') && (
                          <button
                            onClick={() => handleToggleStatus(session.id)}
                            className={`p-1 ${
                              session.status === 'active' 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={session.status === 'active' ? 'إيقاف الحصة' : 'تفعيل الحصة'}
                          >
                            {session.status === 'active' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          )}
                          {hasPermission('sessionsEdit') && (
                          <button
                            onClick={() => handleEdit(session)}
                            className="text-yellow-600 hover:text-yellow-900 p-1"
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
            const reportStatusInfo = getReportStatusText(session.id);
            const reportDetails = getReportStatusDetails(session.id);
            
            return (
              <div key={session.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="mobile-card-title">
                    {sessionClass?.name || 'غير محدد'}
                    {grade && <span className="text-sm text-gray-600"> - {grade.name}</span>}
                  </div>
                  <div className="mobile-btn-group">
                    <button
                      onClick={() => setShowSessionDetails(session.id)}
                      className="mobile-btn text-blue-600 hover:text-blue-900"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('whatsapp') && (
                      <button
                        onClick={() => handleSendReports(session.id)}
                        disabled={sendingReports[session.id]}
                        className="mobile-btn text-green-600 hover:text-green-900 disabled:opacity-50"
                        title="إرسال التقارير"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    )}
                    {hasPermission('sessionsEdit') && (
                    <button
                      onClick={() => handleToggleStatus(session.id)}
                      className={`mobile-btn ${
                        session.status === 'active' 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={session.status === 'active' ? 'إيقاف الحصة' : 'تفعيل الحصة'}
                    >
                      {session.status === 'active' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    )}
                    {hasPermission('sessionsEdit') && (
                    <button
                      onClick={() => handleEdit(session)}
                      className="mobile-btn text-yellow-600 hover:text-yellow-900"
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
                      {location?.roomNumber && ` - ${location.roomNumber}`}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">التاريخ</div>
                    <div className="mobile-card-value">
                      {new Date(session.startTime).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">التوقيت</div>
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
                    <div className="mobile-card-label">الحالة</div>
                    <div className="mobile-card-value">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">حالة إرسال التقارير</div>
                    <div className="mobile-card-value">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getReportStatusIcon(reportStatus[session.id]?.status)}
                        <div>
                          <div className={`text-sm font-medium ${reportStatusInfo.color}`}>
                            {reportStatusInfo.text}
                          </div>
                          {reportDetails && (
                            <div className="text-xs text-gray-500 mt-1" title={reportDetails}>
                              {reportDetails.length > 50 ? reportDetails.substring(0, 50) + '...' : reportDetails}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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