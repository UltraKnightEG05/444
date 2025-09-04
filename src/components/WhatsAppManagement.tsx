import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { MessageSquare, Send, Settings, Eye, Edit, Trash2, Plus, Users, Wifi, WifiOff } from 'lucide-react';

// تعريف قوالب الرسائل الافتراضية
const messageTemplates = {
  absence: 'عزيزي ولي الأمر، نود إعلامكم بأن الطالب/ة {studentName} كان غائباً في جلسة {className} بتاريخ {date}. نرجو المتابعة.',
  performance: 'عزيزي ولي الأمر، تقرير أداء الطالب/ة {studentName} في جلسة {className}: تقييم المعلم: {rating}/5، درجة التسميع: {recitationScore}/10، المشاركة: {participation}/5، الواجب: {homework}',
  reminder: 'تذكير: لديكم جلسة {className} غداً في تمام الساعة {time}. نتطلع لحضور الطالب/ة {studentName}',
  announcement: 'إعلان مهم: {message}'
};

export const WhatsAppManagement: React.FC = () => {
  const { students, sessions, classes, whatsappLogs, initializeWhatsApp, getWhatsAppStatus, sendWhatsAppMessage } = useApp();
  const [activeTab, setActiveTab] = useState('messages');
  const [messageType, setMessageType] = useState('absence');
  const [selectedSession, setSelectedSession] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(getWhatsAppStatus());
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<{ show: boolean, success: boolean, message: string }>({ show: false, success: false, message: '' });
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState(messageTemplates);
  const [forceTestEnabled, setForceTestEnabled] = useState(true); // جعل الاختبار متاح دائماً

  const handleTestMessage = async () => {
    if (!testPhoneNumber.trim()) {
      setTestResult({ show: true, success: false, message: 'يرجى إدخال رقم الهاتف' });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/test-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
          message: testMessage || undefined
        })
      });

      const result = await response.json();

      if (result.success) {
        setTestResult({ 
          show: true, 
          success: true, 
          message: `✅ ${result.message}` 
        });
      } else {
        setTestResult({ 
          show: true, 
          success: false, 
          message: `❌ ${result.message}` 
        });
      }
    } catch (error: any) {
      setTestResult({ 
        show: true, 
        success: false, 
        message: `❌ خطأ في الاتصال: ${error.message}` 
      });
    }

    // إخفاء النتيجة بعد 5 ثواني
    setTimeout(() => {
      setTestResult({ show: false, success: false, message: '' });
    }, 5000);
  };

  const handleSaveTemplate = (type: string, newTemplate: string) => {
    setCustomTemplates({
      ...customTemplates,
      [type]: newTemplate
    });
    setEditingTemplate(null);
    
    // حفظ في localStorage
    localStorage.setItem('whatsapp_templates', JSON.stringify({
      ...customTemplates,
      [type]: newTemplate
    }));
  };

  // تحميل القوالب المحفوظة عند بدء التشغيل
  React.useEffect(() => {
    const savedTemplates = localStorage.getItem('whatsapp_templates');
    if (savedTemplates) {
      try {
        setCustomTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('خطأ في تحميل القوالب المحفوظة:', error);
      }
    }
  }, []);

  const handleSendMessage = () => {
    if (!selectedSession || !messageTemplate) {
      alert('يرجى اختيار الحصة وكتابة الرسالة');
      return;
    }

    if (!connectionStatus) {
      alert('يجب تهيئة الواتساب أولاً');
      return;
    }

    const session = sessions.find(s => s.id === selectedSession);
    const sessionClass = classes.find(c => c.id === session?.classId);
    
    // في التطبيق الحقيقي، هنا سيتم إرسال الرسائل عبر WhatsApp API
    alert(`تم إرسال ${messageType === 'absence' ? 'رسائل الغياب' : 'الرسائل'} بنجاح!`);
  };

  const handleInitializeWhatsApp = async () => {
    setIsConnecting(true);
    try {
      console.log('🚀 بدء تهيئة الواتساب...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus(true);
        
        if (result.alreadyConnected) {
          alert('✅ WhatsApp-Web.js متصل بالفعل ويعمل بشكل صحيح!');
        } else {
          alert('✅ تم تهيئة WhatsApp-Web.js بنجاح! يمكنك الآن إرسال الرسائل.');
        }
        
        // تحديث حالة الاتصال كل 10 ثواني
        const statusInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/whatsapp/status`);
            const statusResult = await statusResponse.json();
            const isConnected = statusResult.data.connected && statusResult.data.ready;
            setConnectionStatus(isConnected);
            
            if (!isConnected) {
              console.log('⚠️ فقد الاتصال بـ WhatsApp-Web.js');
              clearInterval(statusInterval);
            }
          } catch (error) {
            console.error('خطأ في فحص حالة الاتصال:', error);
            setConnectionStatus(false);
            clearInterval(statusInterval);
          }
        }, 10000);
      } else {
        alert(`❌ فشل في تهيئة WhatsApp-Web.js: ${result.message}`);
      }
    } catch (error: any) {
      console.error('خطأ في تهيئة WhatsApp-Web.js:', error);
      alert('❌ حدث خطأ أثناء تهيئة WhatsApp-Web.js: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'تم الإرسال';
      case 'delivered': return 'تم التسليم';
      case 'read': return 'تم القراءة';
      case 'failed': return 'فشل الإرسال';
      default: return status;
    }
  };

  const getMessageTypeText = (type: string) => {
    switch (type) {
      case 'absence': return 'غياب';
      case 'performance': return 'أداء';
      case 'reminder': return 'تذكير';
      case 'announcement': return 'إعلان';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageSquare className="h-6 w-6 ml-2" />
          إدارة الواتساب
        </h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            {connectionStatus || forceTestEnabled ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-sm ${connectionStatus ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus ? 'متصل' : forceTestEnabled ? 'جاهز للاختبار' : 'غير متصل'}
            </span>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            {!connectionStatus && (
              <button
                onClick={handleInitializeWhatsApp}
                disabled={isConnecting}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50"
              >
                {isConnecting ? 'جاري التهيئة...' : 'تهيئة الواتساب'}
              </button>
            )}
            <button
              onClick={() => setForceTestEnabled(!forceTestEnabled)}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
            >
              {forceTestEnabled ? 'تعطيل الاختبار' : 'تفعيل الاختبار'}
            </button>
          </div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              إرسال الرسائل
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'test'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              اختبار الرسائل
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              سجل الرسائل
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              قوالب الرسائل
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الرسالة
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => {
                      setMessageType(e.target.value);
                      setMessageTemplate(customTemplates[e.target.value as keyof typeof customTemplates]);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="absence">رسالة غياب</option>
                    <option value="performance">تقرير أداء</option>
                    <option value="reminder">تذكير</option>
                    <option value="announcement">إعلان</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحصة
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">اختر الحصة</option>
                    {sessions.map(session => {
                      const sessionClass = classes.find(c => c.id === session.classId);
                      return (
                        <option key={session.id} value={session.id}>
                          {sessionClass?.name} - {new Date(session.startTime).toLocaleDateString('en-GB')}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نص الرسالة
                </label>
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اكتب نص الرسالة هنا..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك استخدام المتغيرات: {'{studentName}'}, {'{className}'}, {'{date}'}, {'{time}'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSendMessage}
                  disabled={!connectionStatus && !forceTestEnabled}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 ml-2" />
                  إرسال الرسائل
                </button>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">اختبار WhatsApp-Web.js</h3>
                <p className="text-sm text-blue-700">
                  استخدم هذه الأداة لاختبار إرسال رسالة إلى رقم واحد للتأكد من عمل WhatsApp-Web.js قبل إرسال التقارير الكاملة.
                </p>
              </div>
              
              {testResult.show && (
                <div className={`p-4 rounded-lg border-r-4 ${
                  testResult.success 
                    ? 'bg-green-50 border-green-400 text-green-800' 
                    : 'bg-red-50 border-red-400 text-red-800'
                }`}>
                  <p className="font-medium">{testResult.message}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف للاختبار *
                  </label>
                  <input
                    type="tel"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    placeholder="مثال: 201002246668 أو 966501234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    أدخل الرقم كما هو مخزن في قاعدة البيانات
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    حالة WhatsApp-Web.js
                  </label>
                  <div className={`px-3 py-2 rounded-md border ${
                    connectionStatus || forceTestEnabled
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {connectionStatus ? '✅ WhatsApp-Web.js متصل وجاهز للإرسال' : 
                     forceTestEnabled ? '🧪 جاهز للاختبار (تأكد من تشغيل start-whatsapp-web-js.bat)' : '❌ غير متصل'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نص الرسالة (اختياري)
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اتركه فارغاً لاستخدام رسالة اختبار افتراضية..."
                />
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={handleTestMessage}
                  disabled={(!connectionStatus && !forceTestEnabled) || !testPhoneNumber.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 ml-2" />
                  إرسال رسالة اختبار
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">نصائح للاختبار:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• استخدم رقمك الشخصي أولاً للاختبار</li>
                  <li>• تأكد من أن الرقم مكتوب بنفس التنسيق المخزن في قاعدة البيانات</li>
                  <li>• تأكد من تشغيل start-whatsapp-web-js.bat على جهازك الشخصي</li>
                  <li>• إذا فشل الاختبار، تحقق من مسح QR Code أو أعد التهيئة</li>
                  <li>• انتظر بضع ثواني بين كل اختبار وآخر</li>
                  <li>• تأكد من ظهور "WhatsApp Web جاهز بالكامل" في Terminal</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="desktop-table overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطالب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع الرسالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإرسال</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* بيانات تجريبية لسجل الرسائل */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">أحمد محمد علي</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">غياب</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          تم التسليم
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date().toLocaleString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <button className="text-blue-600 hover:text-blue-900 p-1" title="عرض">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900 p-1" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* عرض بطاقات للموبايل - سجل الرسائل */}
              <div className="mobile-cards">
                {/* بيانات تجريبية لسجل الرسائل */}
                <div className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-title">أحمد محمد علي</div>
                    <div className="mobile-btn-group">
                      <button className="mobile-btn text-blue-600 hover:text-blue-900" title="عرض">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="mobile-btn text-red-600 hover:text-red-900" title="حذف">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mobile-card-content">
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">نوع الرسالة</div>
                      <div className="mobile-card-value">غياب</div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">الحالة</div>
                      <div className="mobile-card-value">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          تم التسليم
                        </span>
                      </div>
                    </div>
                    <div className="mobile-card-field">
                      <div className="mobile-card-label">تاريخ الإرسال</div>
                      <div className="mobile-card-value">
                        {new Date().toLocaleString('en-GB')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {whatsappLogs.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد رسائل مرسلة</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">قوالب الرسائل</h3>
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => {
                      setCustomTemplates(messageTemplates);
                      localStorage.setItem('whatsapp_templates', JSON.stringify(messageTemplates));
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200 flex items-center"
                  >
                    استعادة الافتراضي
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(customTemplates).map(([type, template]) => (
                  <div key={type} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{getMessageTypeText(type)}</h4>
                      <div className="flex space-x-2 space-x-reverse">
                        <button 
                          onClick={() => setEditingTemplate(type)}
                          className="text-green-600 hover:text-green-900 p-1" 
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {editingTemplate === type ? (
                      <div className="space-y-2">
                        <textarea
                          value={template}
                          onChange={(e) => setCustomTemplates({
                            ...customTemplates,
                            [type]: e.target.value
                          })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleSaveTemplate(type, customTemplates[type as keyof typeof customTemplates])}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => {
                              setEditingTemplate(null);
                              setCustomTemplates({
                                ...customTemplates,
                                [type]: template
                              });
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{template}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          المتغيرات المتاحة: {'{studentName}'}, {'{className}'}, {'{date}'}, {'{time}'}, {'{rating}'}, {'{participation}'}, {'{homework}'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};