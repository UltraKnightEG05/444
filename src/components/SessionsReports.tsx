import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { FileText, RefreshCw, Eye, RotateCcw, AlertTriangle, CheckCircle, XCircle, Clock, Users, Calendar, MessageSquare } from 'lucide-react';

interface SessionReportStatus {
  sessionId: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'partial_failed';
  totalStudents: number;
  successfulSends: number;
  failedSends: number;
  lastAttemptAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  details: any;
  className: string;
  teacherName: string;
  subjectName: string;
  startTime: string;
}

export const SessionsReports: React.FC = () => {
  const { sessions, classes, teachers, subjects, grades, locations } = useApp();
  const [reportsStatus, setReportsStatus] = useState<SessionReportStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [retryingSession, setRetryingSession] = useState<string | null>(null);

  // جلب حالة التقارير
  const fetchReportsStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reports/session-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        setReportsStatus(result.data || []);
      } else {
        console.error('فشل في جلب حالة التقارير');
      }
    } catch (error) {
      console.error('خطأ في جلب حالة التقارير:', error);
    } finally {
      setLoading(false);
    }
  };

  // إعادة إرسال تقارير حصة
  const handleRetrySession = async (sessionId: string) => {
    setRetryingSession(sessionId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reports/session-status/${sessionId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // إعادة إرسال التقارير
        const sendResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/send-session-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId })
        });

        if (sendResponse.ok) {
          alert('تم بدء إعادة إرسال التقارير بنجاح');
          await fetchReportsStatus();
        } else {
          alert('فشل في إعادة إرسال التقارير');
        }
      } else {
        alert('فشل في إعادة تعيين حالة التقارير');
      }
    } catch (error) {
      console.error('خطأ في إعادة الإرسال:', error);
      alert('حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setRetryingSession(null);
    }
  };

  // تحميل البيانات عند بدء الصفحة
  useEffect(() => {
    fetchReportsStatus();
  }, []);

  // فلترة البيانات
  const filteredReports = reportsStatus.filter(report => {
    const matchesStatus = selectedStatus === '' || report.status === selectedStatus;
    const matchesClass = selectedClass === '' || 
      sessions.find(s => s.id === report.sessionId)?.classId === selectedClass;
    
    const sessionDate = new Date(report.startTime).toISOString().split('T')[0];
    const matchesDate = sessionDate >= dateRange.startDate && sessionDate <= dateRange.endDate;
    
    return matchesStatus && matchesClass && matchesDate;
  });

  // دالة للحصول على أيقونة ولون الحالة
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'sent':
        return {
          icon: CheckCircle,
          text: 'تم الإرسال',
          color: 'text-green-600',
          bgColor: 'bg-green-100'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'لم يتم الإرسال',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
      case 'sending':
        return {
          icon: RefreshCw,
          text: 'جاري الإرسال',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100'
        };
      case 'failed':
        return {
          icon: XCircle,
          text: 'فشل',
          color: 'text-red-600',
          bgColor: 'bg-red-100'
        };
      case 'partial_failed':
        return {
          icon: AlertTriangle,
          text: 'فشل جزئي',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100'
        };
      default:
        return {
          icon: Clock,
          text: 'غير محدد',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        };
    }
  };

  // دالة للحصول على تفاصيل الحالة
  const getStatusDetails = (report: SessionReportStatus) => {
    if (report.status === 'sent') {
      return `تم الإرسال لجميع الطلاب (${report.successfulSends}/${report.totalStudents})`;
    } else if (report.status === 'partial_failed') {
      return `نجح: ${report.successfulSends} | فشل: ${report.failedSends} من أصل ${report.totalStudents}`;
    } else if (report.status === 'failed') {
      return `فشل الإرسال لجميع الطلاب (${report.totalStudents})`;
    } else if (report.status === 'sending') {
      return `جاري الإرسال... (${report.successfulSends}/${report.totalStudents})`;
    } else {
      return 'لم تتم أي محاولة إرسال';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileText className="h-6 w-6 ml-2" />
          حالة التقارير
        </h1>
        <button
          onClick={fetchReportsStatus}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { status: 'sent', label: 'تم الإرسال', color: 'text-green-600', bgColor: 'bg-green-50' },
          { status: 'pending', label: 'لم يتم الإرسال', color: 'text-gray-600', bgColor: 'bg-gray-50' },
          { status: 'sending', label: 'جاري الإرسال', color: 'text-blue-600', bgColor: 'bg-blue-50' },
          { status: 'partial_failed', label: 'فشل جزئي', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
          { status: 'failed', label: 'فشل', color: 'text-red-600', bgColor: 'bg-red-50' }
        ].map(({ status, label, color, bgColor }) => {
          const count = filteredReports.filter(r => r.status === status).length;
          return (
            <div key={status} className={`${bgColor} rounded-lg p-4 border`}>
              <div className="text-center">
                <div className={`text-2xl font-bold ${color}`}>{count}</div>
                <div className="text-sm text-gray-600">{label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* فلاتر */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">فلاتر البحث</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              حالة الإرسال
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="pending">لم يتم الإرسال</option>
              <option value="sending">جاري الإرسال</option>
              <option value="sent">تم الإرسال</option>
              <option value="partial_failed">فشل جزئي</option>
              <option value="failed">فشل</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المجموعة
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع المجموعات</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              من تاريخ
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* نافذة تفاصيل الحصة */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const report = reportsStatus.find(r => r.sessionId === showDetails);
              if (!report) return null;
              
              const statusDisplay = getStatusDisplay(report.status);
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل حالة التقارير</h2>
                    <button
                      onClick={() => setShowDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">معلومات الحصة</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">المجموعة:</span>
                          <span className="font-medium mr-2">{report.className}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">المعلم:</span>
                          <span className="font-medium mr-2">{report.teacherName || 'غير محدد'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">المادة:</span>
                          <span className="font-medium mr-2">{report.subjectName || 'غير محدد'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">التاريخ:</span>
                          <span className="font-medium mr-2">
                            {new Date(report.startTime).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">حالة الإرسال</h3>
                      <div className="flex items-center space-x-2 space-x-reverse mb-3">
                        <statusDisplay.icon className={`h-5 w-5 ${statusDisplay.color}`} />
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                          {statusDisplay.text}
                        </span>
                      </div>
                      <div className="text-sm text-blue-800">
                        {getStatusDetails(report)}
                      </div>
                    </div>
                    
                    {report.errorMessage && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h3 className="font-medium text-red-900 mb-2">رسالة الخطأ</h3>
                        <p className="text-sm text-red-800">{report.errorMessage}</p>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">التوقيتات</h3>
                      <div className="space-y-2 text-sm">
                        {report.lastAttemptAt && (
                          <div>
                            <span className="text-gray-600">آخر محاولة:</span>
                            <span className="font-medium mr-2">
                              {new Date(report.lastAttemptAt).toLocaleString('en-GB')}
                            </span>
                          </div>
                        )}
                        {report.completedAt && (
                          <div>
                            <span className="text-gray-600">تاريخ الإكمال:</span>
                            <span className="font-medium mr-2">
                              {new Date(report.completedAt).toLocaleString('en-GB')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {(report.status === 'failed' || report.status === 'partial_failed') && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => {
                            setShowDetails(null);
                            handleRetrySession(report.sessionId);
                          }}
                          disabled={retryingSession === report.sessionId}
                          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors duration-200 flex items-center disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4 ml-2" />
                          إعادة المحاولة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* جدول حالة التقارير */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            حالة إرسال التقارير ({filteredReports.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          {/* عرض الجدول على الشاشات الكبيرة */}
          <div className="desktop-table">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المجموعة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المعلم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">حالة الإرسال</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التفاصيل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">آخر محاولة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => {
                  const statusDisplay = getStatusDisplay(report.status);
                  return (
                    <tr key={report.sessionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.className}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.teacherName || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(report.startTime).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <statusDisplay.icon className={`h-4 w-4 ${statusDisplay.color} ${report.status === 'sending' ? 'animate-spin' : ''}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                            {statusDisplay.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {getStatusDetails(report)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.lastAttemptAt 
                          ? new Date(report.lastAttemptAt).toLocaleString('en-GB')
                          : 'لا يوجد'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => setShowDetails(report.sessionId)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {(report.status === 'failed' || report.status === 'partial_failed') && (
                            <button
                              onClick={() => handleRetrySession(report.sessionId)}
                              disabled={retryingSession === report.sessionId}
                              className="text-orange-600 hover:text-orange-900 p-1 disabled:opacity-50"
                              title="إعادة المحاولة"
                            >
                              <RotateCcw className="h-4 w-4" />
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

          {/* عرض البطاقات على الموبايل */}
          <div className="mobile-cards">
            {filteredReports.map((report) => {
              const statusDisplay = getStatusDisplay(report.status);
              return (
                <div key={report.sessionId} className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">{report.className}</div>
                    <div className="mobile-btn-group">
                      <button
                        onClick={() => setShowDetails(report.sessionId)}
                        className="mobile-btn text-blue-600 hover:text-blue-900"
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(report.status === 'failed' || report.status === 'partial_failed') && (
                        <button
                          onClick={() => handleRetrySession(report.sessionId)}
                          disabled={retryingSession === report.sessionId}
                          className="mobile-btn text-orange-600 hover:text-orange-900 disabled:opacity-50"
                          title="إعادة المحاولة"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mobile-card-content">
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">المعلم</div>
                      <div className="mobile-card-value">{report.teacherName || 'غير محدد'}</div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">التاريخ</div>
                      <div className="mobile-card-value">
                        {new Date(report.startTime).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">حالة الإرسال</div>
                      <div className="mobile-card-value">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <statusDisplay.icon className={`h-4 w-4 ${statusDisplay.color} ${report.status === 'sending' ? 'animate-spin' : ''}`} />
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                            {statusDisplay.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">التفاصيل</div>
                      <div className="mobile-card-value text-sm">
                        {getStatusDetails(report)}
                      </div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">آخر محاولة</div>
                      <div className="mobile-card-value">
                        {report.lastAttemptAt 
                          ? new Date(report.lastAttemptAt).toLocaleString('en-GB')
                          : 'لا يوجد'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {report.errorMessage && (
                    <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-xs text-red-600 mb-1">رسالة الخطأ:</div>
                      <div className="text-sm text-red-800">{report.errorMessage}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {filteredReports.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-gray-500">لا توجد تقارير للفترة المحددة</p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>الفترة المحددة: {dateRange.startDate} إلى {dateRange.endDate}</p>
                {selectedClass && <p>المجموعة المختار: {classes.find(c => c.id === selectedClass)?.name}</p>}
                {selectedStatus && <p>الحالة المختارة: {selectedStatus}</p>}
                <p className="mt-2 font-medium">نصائح:</p>
                <ul className="text-xs space-y-1">
                  <li>• تأكد من إرسال تقارير للحصص من صفحة إدارة الحصص</li>
                  <li>• جرب توسيع نطاق التاريخ</li>
                  <li>• تحقق من اختيار المجموعة الصحيح</li>
                  <li>• اضغط على "تحديث" لجلب أحدث البيانات</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">جاري تحميل البيانات...</p>
          </div>
        )}
      </div>
    </div>
  );
};