import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Edit, Trash2, Search, Eye, Play, Square, CheckCircle, Clock, X, Send } from 'lucide-react';

export const SessionsManagement: React.FC = () => {
  const { sessions, classes, locations, teachers, subjects, grades, addSession, updateSession, deleteSession, toggleSessionStatus, sendSessionReport, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    classId: '',
    locationId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as 'scheduled' | 'active' | 'completed' | 'cancelled',
    notes: ''
  });

  const filteredSessions = sessions.filter(session => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const matchesSearch = sessionClass?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.notes?.toLowerCase().includes(searchTerm.toLowerCase());
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
    } catch (error: any) {
      alert('حدث خطأ: ' + error.message);
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
      } catch (error: any) {
        alert('حدث خطأ في الحذف: ' + error.message);
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleSessionStatus(id);
    } catch (error: any) {
      alert('حدث خطأ في تغيير حالة الحصة: ' + error.message);
    }
  };

  const handleSendReport = async (sessionId: string) => {
    if (!window.confirm('هل أنت متأكد من إرسال تقارير هذه الحصة لأولياء الأمور؟')) {
      return;
    }

    setSendingReport(sessionId);
    try {
      console.log('📤 إرسال تقرير الحصة:', sessionId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/send-session-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ تم إرسال التقارير بنجاح!\n\nالإحصائيات:\n• إجمالي الطلاب: ${result.totalStudents}\n• رسائل مرسلة: ${result.sentMessages}\n• رسائل فاشلة: ${result.failedMessages}`);
      } else {
        alert(`❌ فشل في إرسال التقرير: ${result.message}`);
      }
    } catch (error: any) {
      console.error('❌ خطأ في إرسال التقرير:', error);
      alert('❌ فشل في إرسال التقرير. تحقق من اتصال الواتساب.');
    } finally {
      setSendingReport(null);
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
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
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
      case 'scheduled': return Clock;
      case 'active': return Play;
      case 'completed': return CheckCircle;
      case 'cancelled': return X;
      default: return Clock;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scheduled': return 'active';
      case 'active': return 'completed';
      case 'completed': return 'scheduled';
      default: return 'scheduled';
    }
  };

  const getNextStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scheduled': return 'بدء الحصة';
      case 'active': return 'إنهاء الحصة';
      case 'completed': return 'إعادة جدولة';
      default: return 'تغيير الحالة';
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
                  {classes.map(cls => {
                    const grade = grades.find(g => g.id === cls.gradeId);
                    const teacher = teachers.find(t => t.id === cls.teacherId);
                    return (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {grade?.name || ''} - {teacher?.name || ''}
                      </option>
                    );
                  })}
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
          <div className="md:col-span-2">
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden desktop-table">
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
                const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
                const location = locations.find(l => l.id === session.locationId);
                const grade = grades.find(g => g.id === sessionClass?.gradeId);
                const StatusIcon = getStatusIcon(session.status);
                
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
                      {teacher?.subjectName && (
                        <div className="text-xs text-gray-500">{teacher.subjectName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {location?.name || 'غير محدد'}
                        {location?.roomNumber && ` - ${location.roomNumber}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(session.startTime).toLocaleDateString('en-GB')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(session.startTime).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        })} - {new Date(session.endTime).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        <StatusIcon className="h-3 w-3 ml-1" />
                        {getStatusText(session.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => {/* عرض تفاصيل الحصة */}}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {hasPermission('sessionsEdit') && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(session.id)}
                              className="text-purple-600 hover:text-purple-900 p-1"
                              title={getNextStatusText(session.status)}
                            >
                              {session.status === 'scheduled' ? (
                                <Play className="h-4 w-4" />
                              ) : session.status === 'active' ? (
                                <Square className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleEdit(session)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        {hasPermission('whatsapp') && (
                          <button
                            onClick={() => handleSendReport(session.id)}
                            disabled={sendingReport === session.id}
                            className="text-orange-600 hover:text-orange-900 p-1 disabled:opacity-50"
                            title="إرسال التقارير"
                          >
                            {sendingReport === session.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
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
          const location = locations.find(l => l.id === session.locationId);
          const grade = grades.find(g => g.id === sessionClass?.gradeId);
          const StatusIcon = getStatusIcon(session.status);
          
          return (
            <div key={session.id} className="mobile-card">
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">
                    {sessionClass?.name || 'غير محدد'}
                    {grade && ` - ${grade.name}`}
                  </div>
                  <div className="mobile-card-subtitle">
                    {teacher?.name || 'غير محدد'}
                    {teacher?.subjectName && ` - ${teacher.subjectName}`}
                  </div>
                </div>
                <div className="mobile-btn-group">
                  <button
                    onClick={() => {/* عرض تفاصيل الحصة */}}
                    className="mobile-btn text-blue-600 hover:text-blue-900"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {hasPermission('sessionsEdit') && (
                    <>
                      <button
                        onClick={() => handleToggleStatus(session.id)}
                        className="mobile-btn text-purple-600 hover:text-purple-900"
                        title={getNextStatusText(session.status)}
                      >
                        {session.status === 'scheduled' ? (
                          <Play className="h-4 w-4" />
                        ) : session.status === 'active' ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(session)}
                        className="mobile-btn text-green-600 hover:text-green-900"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  
                  {hasPermission('whatsapp') && (
                    <button
                      onClick={() => handleSendReport(session.id)}
                      disabled={sendingReport === session.id}
                      className="mobile-btn text-orange-600 hover:text-orange-900 disabled:opacity-50"
                      title="إرسال التقارير"
                    >
                      {sendingReport === session.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
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
                      minute: '2-digit',
                      hour12: false 
                    })} - {new Date(session.endTime).toLocaleTimeString('en-GB', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </div>
                </div>
                <div className="mobile-card-field">
                  <div className="mobile-card-label">الحالة</div>
                  <div className="mobile-card-value">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      <StatusIcon className="h-3 w-3 ml-1" />
                      {getStatusText(session.status)}
                    </span>
                  </div>
                </div>
                {session.notes && (
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">ملاحظات</div>
                    <div className="mobile-card-value">{session.notes}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 space-x-reverse mt-6">
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