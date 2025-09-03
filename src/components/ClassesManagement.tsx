import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { BookOpen, Plus, Edit, Trash2, Search, Eye, Users, X, ArrowRight, Printer } from 'lucide-react';

export const ClassesManagement: React.FC = () => {
  const { classes, students, teachers, subjects, sessions, grades, locations, addClass, updateClass, deleteClass, removeStudentFromClass, transferStudentToClass, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState<string | null>(null);
  const [showClassDetails, setShowClassDetails] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<{ show: boolean, studentId: string, studentName: string }>({ show: false, studentId: '', studentName: '' });
  const [selectedTargetClass, setSelectedTargetClass] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    gradeId: '',
    locationId: '',
    maxCapacity: 30
  });

// فلترة وترتيب الكلاسات بالأرقام
const sortedClasses = classes
  .filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .sort((a, b) => {
    const numA = parseInt(a.name);
    const numB = parseInt(b.name);
    return (isNaN(numA) ? 0 : numA) - (isNaN(numB) ? 0 : numB);
  });

// حساب البيانات للصفحة الحالية
const totalPages = Math.ceil(sortedClasses.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentClasses = sortedClasses.slice(startIndex, endIndex);

  // فلترة الكلاسات حسب البحث
const filteredClasses = classes.filter(cls =>
  cls.name.toLowerCase().includes(searchTerm.toLowerCase())
);


  // إعادة تعيين الصفحة عند تغيير البحث
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateClass(editingClass, formData);
      setEditingClass(null);
    } else {
      addClass(formData);
    }
    setFormData({ name: '', teacherId: '', maxCapacity: 30 });
    setShowAddForm(false);
  };

  const handleEdit = (cls: any) => {
    setEditingClass(cls.id);
    setFormData({
      name: cls.name,
      teacherId: cls.teacherId,
      gradeId: cls.gradeId || '',
      locationId: cls.locationId || '',
      maxCapacity: cls.maxCapacity
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    const classStudents = students.filter(s => s.classId === id);
    const classSessions = sessions.filter(s => s.classId === id);
    
    if (classStudents.length > 0) {
      alert(`لا يمكن حذف المجموعة لأنه يحتوي على ${classStudents.length} طالب`);
      return;
    }
    
    if (classSessions.length > 0) {
      if (!window.confirm(`هذا المجموعة لديه ${classSessions.length} جلسة. هل أنت متأكد من الحذف؟ سيتم حذف جميع الحصص أيضاً.`)) {
        return;
      }
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا المجموعة؟')) {
      deleteClass(id);
    }
  };

  const handleRemoveStudentFromClass = (studentId: string) => {
    if (window.confirm('هل أنت متأكد من إزالة هذا الطالب من المجموعة؟')) {
      removeStudentFromClass(studentId);
    }
  };

  const handleRemoveAllStudentsFromClass = (classId: string) => {
    const classStudents = students.filter(s => s.classId === classId);
    if (window.confirm(`هل أنت متأكد من إزالة جميع الطلاب (${classStudents.length}) من هذا المجموعة؟`)) {
      classStudents.forEach(student => {
        removeStudentFromClass(student.id);
      });
      setShowClassDetails(null);
    }
  };

  const handleTransferStudent = (studentId: string, studentName: string) => {
    setShowTransferModal({ show: true, studentId, studentName });
  };

  const confirmTransferStudent = () => {
    if (selectedTargetClass) {
      transferStudentToClass(showTransferModal.studentId, selectedTargetClass);
    } else {
      transferStudentToClass(showTransferModal.studentId, null);
    }
    setShowTransferModal({ show: false, studentId: '', studentName: '' });
    setSelectedTargetClass('');
  };

  // ==================================================================
  // START: الوظيفة المحدثة لطباعة بطاقات هوية الطلاب
  // ==================================================================
const generateClassBarcodes = (classId: string) => {
    const classData = classes.find(c => c.id === classId);
    const classStudents = students.filter(s => s.classId === classId);
    
    if (!classData || classStudents.length === 0) {
      alert('لا يوجد طلاب في هذا المجموعة لطباعة البطاقات');
      return;
    }

    const teacher = teachers.find(t => t.id === classData.teacherId);
    const teacherName = teacher ? teacher.name : 'غير محدد';
    const grade = grades.find(g => g.id === classData.gradeId);
    const gradeName = grade ? grade.name : 'غير محدد';
    const location = locations.find(l => l.id === classData.locationId);
    const locationName = location ? location.name : 'غير محدد';
    
    const studentImagePath = 'https://i.postimg.cc/K82zGYv5/Whats-App-Image-2025-07-24-at-11-57-51-4be0bb8b.jpg';

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>بطاقات هوية مجموعة ${classData.name}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none; }
          }

          body {
            font-family: 'Cairo', sans-serif;
            margin: 0;
            background-color: #f0f2f5;
          }

          .card-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10mm;
            padding: 5mm;
            page-break-inside: avoid;
          }

          .student-id-card {
            width: 85.6mm;
            height: 53.98mm;
            background-color: #ffffff;
            border-radius: 3.5mm;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
            page-break-inside: avoid;
            direction: rtl;
          }

          .card-header {
            background-color: #004A55;
            min-height: 7mm;
            padding:5px;
            position: relative;
            color: #fff;
          }
          .card-header::after {
            content: '';
            position: absolute;
            bottom: -5mm;
            left: -5mm;
            width: 25mm;
            height: 25mm;
            background-color: #14C3A4;
            border-radius: 50%;
          }

          .card-body {
            display: flex;
            align-items: center;
            padding: 3mm 4mm;
            flex-grow: 1;
          }

          .student-photo {
            width: 22mm;
            height: 28mm;
            border-radius: 3mm;
            border: 2px solid #004A55;
            object-fit: cover;
            margin-left: 4mm;
          }

          .photo-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .teacher-name {
            font-size: 2.8mm;
            font-weight: 600;
            color: #FFF;
            margin: 1mm;
            padding: 0 10px 0 0;
            text-align: right;
          }

          .student-info {
            font-size: 2.8mm;
            color: #333;
          }
          .student-info .label {
            font-weight: 400;
            color: #555;
            display: inline-block;
            width: 15mm;
          }
          .student-info .value {
            font-weight: 600;
            color: #004A55;
          }
          .student-name {
            font-size: 3.5mm;
            font-weight: 700;
            color: #004A55;
            margin-bottom: 1.5mm;
          }

          .barcode-container {
            text-align: center;
            margin-top: 2.5mm;
          }
          .barcode-svg {
            width: 100%;
            height: 8mm;
          }
        </style>
      </head>
      <body>
        <div class="card-grid">
          ${classStudents.map(student => `
            <div class="student-id-card">
              <div class="card-header">
              </div>
              <div class="card-body">
                <div class="photo-container">
                  <img src="${studentImagePath}" alt="صورة الطالب" class="student-photo">
                </div>
                <div class="student-info">
                  <div class="student-name">${student.name}</div>
                  <div>
                    <span class="label">ولي الأمر:</span>
                    <span class="value">${student.parentPhone || 'غير مسجل'}</span>
                  </div>
                  <div>
                    <span class="label">الصف:</span>
                    <span class="value">${gradeName}</span>
                  </div>
                  <div>
                    <span class="label">المكان:</span>
                    <span class="value">${locationName}</span>
                  </div>
                  <div class="barcode-container">
                    <svg class="barcode-svg" id="barcode-${student.id}"></svg>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <script>
          window.onload = function() {
            ${classStudents.map(student => `
              try {
                JsBarcode("#barcode-${student.id}", "${student.barcode}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 40,
                  displayValue: false,
                  margin: 0
                });
              } catch (e) {
                console.error('خطأ في إنشاء الباركود للطالب ${student.name}:', e);
              }
            `).join('')}
            
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة البطاقات.');
    }
  };
  // ==================================================================
  // END: الوظيفة المحدثة
  // ==================================================================

  const resetForm = () => {
    setFormData({ name: '', teacherId: '', gradeId: '', locationId: '', maxCapacity: 30 });
    setEditingClass(null);
    setShowAddForm(false);
  };

  const getTeacherDisplayName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return 'غير محدد';
    
    const subjectName = teacher.subjectName || 'غير محدد';
    
    return `${teacher.name}${subjectName !== 'غير محدد' ? ` - ${subjectName}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="h-6 w-6 ml-2" />
          إدارة المجموعات
        </h1>
        {hasPermission('classesEdit') && (
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة مجموعة
        </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingClass ? 'تعديل المجموعة' : 'إضافة مجموعة جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المجموعة
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: مجموعة أ"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الصف الدراسي
                </label>
                <select
                  value={formData.gradeId}
                  onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر الصف الدراسي</option>
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المعلم المسؤول
                </label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{getTeacherDisplayName(teacher.id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السعة القصوى
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingClass ? 'حفظ التغييرات' : 'إضافة المجموعة'}
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

      {/* نافذة تفاصيل المجموعة */}
      {showClassDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const classData = classes.find(c => c.id === showClassDetails);
              const classStudents = students.filter(s => s.classId === showClassDetails);
              const teacherDisplayName = classData?.teacherId ? getTeacherDisplayName(classData.teacherId) : 'غير محدد';
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل مجموعة {classData?.name}</h2>
                    <button
                      onClick={() => setShowClassDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">المعلم المسؤول</h3>
                      <p className="text-blue-700">{teacherDisplayName}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">عدد الطلاب</h3>
                      <p className="text-green-700">{classStudents.length}/{classData?.maxCapacity}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900">نسبة الامتلاء</h3>
                      <p className="text-purple-700">
                        {classData ? ((classStudents.length / classData.maxCapacity) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">قائمة الطلاب ({classStudents.length})</h3>
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => generateClassBarcodes(showClassDetails!)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        طباعة البطاقات
                      </button>
                      {classStudents.length > 0 && (
                        <button
                          onClick={() => handleRemoveAllStudentsFromClass(showClassDetails!)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          إزالة جميع الطلاب
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {classStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الكود</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">هاتف ولي الأمر</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {classStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.barcode}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{student.parentPhone}</td>
                              <td className="px-4 py-2 text-sm">
                                <div className="flex space-x-2 space-x-reverse">
                                  <button
                                    onClick={() => handleTransferStudent(student.id, student.name)}
                                    className="text-blue-600 hover:text-blue-900 text-xs bg-blue-100 px-2 py-1 rounded"
                                  >
                                    نقل
                                  </button>
                                  <button
                                    onClick={() => handleRemoveStudentFromClass(student.id)}
                                    className="text-red-600 hover:text-red-900 text-xs bg-red-100 px-2 py-1 rounded"
                                  >
                                    إزالة
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>لا يوجد طلاب في هذا المجموعة</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* نافذة نقل الطالب */}
      {showTransferModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">نقل الطالب: {showTransferModal.studentName}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر المجموعة الجديد
                </label>
                <select
                  value={selectedTargetClass}
                  onChange={(e) => setSelectedTargetClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">بدون مجموعة</option>
                  {classes.filter(c => c.id !== showClassDetails).map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  onClick={confirmTransferStudent}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  نقل
                </button>
                <button
                  onClick={() => {
                    setShowTransferModal({ show: false, studentId: '', studentName: '' });
                    setSelectedTargetClass('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* البحث */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث عن مجموعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* قائمة المجموعات */}
      <div className="desktop-table">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentClasses.map((cls) => {
          const classStudents = students.filter(s => s.classId === cls.id);
          const teacherDisplayName = cls.teacherId ? getTeacherDisplayName(cls.teacherId) : 'غير محدد';
          const gradeName = grades.find(g => g.id === cls.gradeId)?.name || '';
          const locationName = locations.find(l => l.id === cls.locationId)?.name || '';
          
          // تكوين اسم المجموعة الكامل
          const fullClassName = `${cls.name}${gradeName ? ` - ${gradeName}` : ''}${locationName ? ` - ${locationName}` : ''}`;
          
          return (
            <div key={cls.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{fullClassName}</h3>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setShowClassDetails(cls.id)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {hasPermission('classesEdit') && (
                  <button
                    onClick={() => handleEdit(cls)}
                    className="text-green-600 hover:text-green-900 p-1"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  )}
                  {hasPermission('classesDelete') && (
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 ml-2" />
                  <span>عدد الطلاب: {classStudents.length}/{cls.maxCapacity}</span>
                </div>
                {gradeName && (
                  <div>
                    <span>الصف الدراسي: {gradeName}</span>
                  </div>
                )}
                {locationName && (
                  <div>
                    <span>المكان: {locationName}</span>
                  </div>
                )}
                <div>
                  <span>المعلم: {cls.teacherName || 'غير محدد'}</span>
                </div>
                <div>
                  <span>تاريخ الإنشاء: {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cls.maxCapacity > 0 ? (classStudents.length / cls.maxCapacity) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {cls.maxCapacity > 0 ? ((classStudents.length / cls.maxCapacity) * 100).toFixed(1) : 0}% ممتلئ
                </p>
              </div>
              
              <div className="mt-4 flex space-x-2 space-x-reverse">
                <button
                  onClick={() => generateClassBarcodes(cls.id)}
                  className="flex-1 bg-green-100 text-green-800 py-1 px-2 rounded text-xs hover:bg-green-200 transition-colors"
                  disabled={classStudents.length === 0}
                >
                  <Printer className="h-3 w-3 inline ml-1" />
                  طباعة البطاقات
                </button>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* عرض بطاقات للموبايل */}
      <div className="mobile-cards">
        {currentClasses.map((cls) => {
          const classStudents = students.filter(s => s.classId === cls.id);
          const teacherDisplayName = cls.teacherId ? getTeacherDisplayName(cls.teacherId) : 'غير محدد';
          const gradeName = grades.find(g => g.id === cls.gradeId)?.name || '';
          const locationName = locations.find(l => l.id === cls.locationId)?.name || '';
          
          // تكوين اسم المجموعة الكامل
          const fullClassName = `${cls.name}${gradeName ? ` - ${gradeName}` : ''}${locationName ? ` - ${locationName}` : ''}`;
          
          return (
            <div key={cls.id} className="mobile-card">
              <div className="mobile-card-header">
                <div className="mobile-card-title">{fullClassName}</div>
                <div className="mobile-btn-group">
                  <button
                    onClick={() => setShowClassDetails(cls.id)}
                    className="mobile-btn text-blue-600 hover:text-blue-900"
                    title="عرض التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {hasPermission('classesEdit') && (
                  <button
                    onClick={() => handleEdit(cls)}
                    className="mobile-btn text-green-600 hover:text-green-900"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  )}
                  {hasPermission('classesDelete') && (
                  <button
                    onClick={() => handleDelete(cls.id)}
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
                  <div className="mobile-card-label">عدد الطلاب</div>
                  <div className="mobile-card-value">{classStudents.length}/{cls.maxCapacity}</div>
                </div>
                <div className="mobile-card-field">
                  <div className="mobile-card-label">المعلم</div>
                  <div className="mobile-card-value">{cls.teacherName || 'غير محدد'}</div>
                </div>
                {gradeName && (
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الصف الدراسي</div>
                    <div className="mobile-card-value">{gradeName}</div>
                  </div>
                )}
                {locationName && (
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المكان</div>
                    <div className="mobile-card-value">{locationName}</div>
                  </div>
                )}
                <div className="mobile-card-field">
                  <div className="mobile-card-label">نسبة الامتلاء</div>
                  <div className="mobile-card-value">
                    {cls.maxCapacity > 0 ? ((classStudents.length / cls.maxCapacity) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div className="mobile-card-field">
                  <div className="mobile-card-label">تاريخ الإنشاء</div>
                  <div className="mobile-card-value">
                    {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}
                  </div>
                </div>
              </div>
              
              <div className="mobile-card-actions">
                <button
                  onClick={() => generateClassBarcodes(cls.id)}
                  className="mobile-btn bg-green-100 text-green-800 hover:bg-green-200"
                  disabled={classStudents.length === 0}
                >
                  <Printer className="h-3 w-3 inline ml-1" />
                  طباعة البطاقات
                </button>
              </div>
              
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${cls.maxCapacity > 0 ? (classStudents.length / cls.maxCapacity) * 100 : 0}%` }}
                  />
                </div>
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

      {currentClasses.length === 0 && searchTerm.length > 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            لا توجد فصول مطابقة للبحث.
          </p>
        </div>
      )}

      {filteredClasses.length === 0 && searchTerm.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">لم يتم إضافة فصول بعد</h3>
          <p className="text-gray-500 mt-2">
            ابدأ بإضافة مجموعة جديد لعرضه هنا.
          </p>
          {hasPermission('classesEdit') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center mx-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مجموعة جديد
          </button>
          )}
        </div>
      )}
    </div>
  );
};
