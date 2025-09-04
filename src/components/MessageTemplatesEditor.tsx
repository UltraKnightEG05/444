import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, RotateCcw, Edit, Eye } from 'lucide-react';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'absence' | 'performance' | 'reminder' | 'announcement' | 'attendance';
  template: string;
  variables: string[];
}

export const MessageTemplatesEditor: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [tempTemplate, setTempTemplate] = useState('');

  // قوالب الرسائل الافتراضية
  const defaultTemplates: MessageTemplate[] = [
    {
      id: 'absence',
      name: 'رسالة غياب',
      type: 'absence',
      template: `🔔 تنبيه غياب - نظام إدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

نود إعلامكم بأن الطالب/ة: *{studentName}*
تغيب عن حصة اليوم

📚 تفاصيل الحصة:
• المادة: {subjectName}
• المجموعة: {className}
• المعلم: {teacherName}
• التاريخ: {date}
• الوقت: {time}
• المكان: {locationName}

نرجو المتابعة والتواصل مع إدارة المدرسة لمعرفة سبب الغياب.

📞 للاستفسار: اتصل بإدارة المدرسة

📚 نظام إدارة الحضور
تطوير: Ahmed Hosny - 01272774494`,
      variables: ['studentName', 'subjectName', 'className', 'teacherName', 'date', 'time', 'locationName']
    },
    {
      id: 'performance',
      name: 'تقرير أداء',
      type: 'performance',
      template: `📊 تقرير أداء الطالب - نظام إدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

👤 الطالب/ة: *{studentName}*
📚 المادة: {subjectName}
🏫 المجموعة: {className}
👨‍🏫 المعلم: {teacherName}
📅 التاريخ: {date}

📈 تقييم الأداء:
⭐ تقييم المعلم: *{rating}/5*
📖 درجة التسميع: *{recitationScore}/10*
📋 درجة الاختبار: *{quizScore}%*
🙋 المشاركة: *{participation}/5*
😊 السلوك: *{behavior}*
📝 الواجب: *{homework}*

💬 ملاحظات المعلم:
_{comments}_

📚 نظام إدارة الحضور
شكراً لمتابعتكم المستمرة 🌟
تطوير: Ahmed Hosny - 01272774494`,
      variables: ['studentName', 'subjectName', 'className', 'teacherName', 'date', 'rating', 'recitationScore', 'quizScore', 'participation', 'behavior', 'homework', 'comments']
    },
    {
      id: 'attendance',
      name: 'تأكيد حضور',
      type: 'attendance',
      template: `✅ تأكيد حضور - نظام إدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

نود إعلامكم بحضور الطالب/ة: *{studentName}*
في حصة اليوم بنجاح

📚 تفاصيل الحصة:
• المادة: {subjectName}
• المجموعة: {className}
• المعلم: {teacherName}
• التاريخ: {date}
• الوقت: {time}
• المكان: {locationName}

📚 نظام إدارة الحضور
تطوير: Ahmed Hosny - 01272774494`,
      variables: ['studentName', 'subjectName', 'className', 'teacherName', 'date', 'time', 'locationName']
    },
    {
      id: 'reminder',
      name: 'تذكير بموعد',
      type: 'reminder',
      template: `⏰ تذكير بموعد الحصة - نظام إدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

تذكير بموعد حصة غداً:

👤 الطالب/ة: *{studentName}*
📚 المادة: {subjectName}
🏫 المجموعة: {className}
👨‍🏫 المعلم: {teacherName}
📅 التاريخ: {date}
⏰ الوقت: {time}
📍 المكان: {locationName}

نتطلع لحضور الطالب/ة في الموعد المحدد.

📚 نظام إدارة الحضور
تطوير: Ahmed Hosny - 01272774494`,
      variables: ['studentName', 'subjectName', 'className', 'teacherName', 'date', 'time', 'locationName']
    },
    {
      id: 'announcement',
      name: 'إعلان عام',
      type: 'announcement',
      template: `📢 إعلان مهم - نظام إدارة الحضور

السلام عليكم ورحمة الله وبركاته
عزيزي ولي الأمر المحترم،

{message}

📚 نظام إدارة الحضور
تطوير: Ahmed Hosny - 01272774494`,
      variables: ['message']
    }
  ];

  useEffect(() => {
    // تحميل القوالب المحفوظة أو استخدام الافتراضية
    const savedTemplates = localStorage.getItem('whatsapp_message_templates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('خطأ في تحميل القوالب:', error);
        setTemplates(defaultTemplates);
      }
    } else {
      setTemplates(defaultTemplates);
    }
  }, []);

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('whatsapp_message_templates', JSON.stringify(newTemplates));
  };

  const handleSaveTemplate = (templateId: string) => {
    const updatedTemplates = templates.map(template =>
      template.id === templateId
        ? { ...template, template: tempTemplate }
        : template
    );
    saveTemplates(updatedTemplates);
    setEditingTemplate(null);
    setTempTemplate('');
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template.id);
    setTempTemplate(template.template);
  };

  const handleResetTemplate = (templateId: string) => {
    const defaultTemplate = defaultTemplates.find(t => t.id === templateId);
    if (defaultTemplate && window.confirm('هل أنت متأكد من استعادة القالب الافتراضي؟')) {
      const updatedTemplates = templates.map(template =>
        template.id === templateId
          ? { ...template, template: defaultTemplate.template }
          : template
      );
      saveTemplates(updatedTemplates);
      setEditingTemplate(null);
      setTempTemplate('');
    }
  };

  const handlePreviewTemplate = (template: MessageTemplate) => {
    // استبدال المتغيرات بقيم تجريبية للمعاينة
    let preview = template.template;
    const sampleData = {
      studentName: 'أحمد محمد علي',
      subjectName: 'الرياضيات',
      className: 'الصف الخامس أ',
      teacherName: 'أستاذ محمد أحمد',
      date: new Date().toLocaleDateString('en-GB'),
      time: '10:00 صباحاً',
      locationName: 'القاعة الأولى',
      rating: '4',
      recitationScore: '8',
      quizScore: '85',
      participation: '5',
      behavior: 'ممتاز',
      homework: 'مكتمل ✅',
      comments: 'طالب متميز ومجتهد، يشارك بفعالية في الحصة',
      message: 'سيتم تأجيل حصة الغد بسبب الظروف الجوية'
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    setPreviewTemplate(preview);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'absence': return 'bg-red-100 text-red-800';
      case 'performance': return 'bg-blue-100 text-blue-800';
      case 'attendance': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      case 'announcement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <MessageSquare className="h-5 w-5 ml-2" />
          محرر قوالب الرسائل
        </h2>
        <button
          onClick={() => {
            if (window.confirm('هل أنت متأكد من استعادة جميع القوالب الافتراضية؟')) {
              saveTemplates(defaultTemplates);
            }
          }}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200 flex items-center"
        >
          <RotateCcw className="h-4 w-4 ml-2" />
          استعادة الافتراضي
        </button>
      </div>

      {/* نافذة المعاينة */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">معاينة الرسالة</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {previewTemplate}
              </div>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* قائمة القوالب */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 space-x-reverse">
                <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                  {template.type}
                </span>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => handlePreviewTemplate(template)}
                  className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                  title="معاينة"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                  title="تعديل"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleResetTemplate(template.id)}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50"
                  title="استعادة الافتراضي"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {editingTemplate === template.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نص القالب
                  </label>
                  <textarea
                    value={tempTemplate}
                    onChange={(e) => setTempTemplate(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="اكتب نص القالب هنا..."
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">المتغيرات المتاحة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono cursor-pointer hover:bg-blue-200"
                        onClick={() => {
                          const textarea = document.querySelector('textarea');
                          if (textarea) {
                            const cursorPos = textarea.selectionStart;
                            const textBefore = tempTemplate.substring(0, cursorPos);
                            const textAfter = tempTemplate.substring(cursorPos);
                            setTempTemplate(textBefore + `{${variable}}` + textAfter);
                          }
                        }}
                        title="اضغط لإدراج المتغير"
                      >
                        {`{${variable}}`}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    💡 اضغط على أي متغير لإدراجه في النص
                  </p>
                </div>

                <div className="flex space-x-4 space-x-reverse">
                  <button
                    onClick={() => handleSaveTemplate(template.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    حفظ التغييرات
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setTempTemplate('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-200"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {template.template.length > 300 
                      ? template.template.substring(0, 300) + '...' 
                      : template.template
                    }
                  </pre>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600">المتغيرات:</span>
                  {template.variables.map((variable) => (
                    <span
                      key={variable}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono"
                    >
                      {`{${variable}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">نصائح للتعديل:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• استخدم *النص* للخط العريض في واتساب</li>
          <li>• استخدم _النص_ للخط المائل في واتساب</li>
          <li>• استخدم الإيموجي لجعل الرسالة أكثر جاذبية</li>
          <li>• اضغط على المتغيرات لإدراجها في النص</li>
          <li>• استخدم المعاينة لرؤية شكل الرسالة النهائي</li>
        </ul>
      </div>
    </div>
  );
};