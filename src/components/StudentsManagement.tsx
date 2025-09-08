import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Users, Plus, Edit, Trash2, Search, Eye, X } from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const { students, classes, grades, attendance, addStudent, updateStudent, deleteStudent, generateStudentBarcode, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [generatedBarcode, setGeneratedBarcode] = useState<string>('');
  const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    parentPhone: '',
    parentEmail: '',
    classId: '' as string | null
  });

  // دالة لعرض اسم المجموعة مع الصف
  const getClassDisplayName = (classId: string | null) => {
    if (!classId) return 'بدون مجموعة';
    const classData = classes.find(c => c.id === classId);
    if (!classData) return 'مجموعة غير موجود';
    
    const grade = grades.find(g => g.id === classData.gradeId);
    const gradeName = grade ? grade.name : '';
    
    return gradeName ? `${classData.name} - ${gradeName}` : classData.name;
  };

const filteredStudents = students.filter(student => {
  const matchesSearch =
    searchTerm.trim() === '' ||
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.barcode && student.barcode.includes(searchTerm));

  const studentClassId = student.classId ? String(student.classId) : '';

  const matchesClass =
    selectedClass === '' ||
    (selectedClass === 'no-class' && !student.classId) ||
    studentClassId === selectedClass;

  return matchesSearch && matchesClass;
});


  // حساب البيانات للصفحة الحالية
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  // جلب الباركود عند فتح نموذج الإضافة
  useEffect(() => {
    if (showAddForm && !editingStudent) {
      const fetchBarcode = async () => {
        try {
          setIsLoadingBarcode(true);
          const barcode = await generateStudentBarcode();
          setGeneratedBarcode(barcode);
        } catch (error) {
          console.error('Error generating barcode:', error);
          setGeneratedBarcode('خطأ في توليد الكود');
        } finally {
          setIsLoadingBarcode(false);
        }
      };
      fetchBarcode();
    }
  }, [showAddForm, editingStudent, generateStudentBarcode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحقول الإلزامية
    if (!formData.name || !formData.parentPhone) {
      alert('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    // التحقق من طول رقم الهاتف (يجب أن يكون 12 رقم بالضبط)
    const phoneDigits = formData.parentPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 12) {
      alert('رقم هاتف ولي الأمر يجب أن يكون 12 رقم بالضبط (مثال: 201002246668 أو 966501234567)');
      return;
    }
    
    if (editingStudent) {
      updateStudent(editingStudent, {
        name: formData.name,
        parentPhone: phoneDigits,
        parentEmail: formData.parentEmail,
        classId: formData.classId
      });
      setEditingStudent(null);
    } else {
      addStudent({
        name: formData.name,
        barcode: generatedBarcode || formData.barcode || '',
        parentPhone: phoneDigits,
        parentEmail: formData.parentEmail,
        classId: formData.classId
      });
    }
    setFormData({ name: '', barcode: '', parentPhone: '', parentEmail: '', classId: '' });
    setGeneratedBarcode('');
    setShowAddForm(false);
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student.id);
    setFormData({
      name: student.name,
      barcode: student.barcode,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      classId: student.classId
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    // التحقق من وجود سجلات حضور للطالب
    const studentAttendance = attendance.filter(a => a.studentId === id);
    if (studentAttendance.length > 0) {
      if (!window.confirm(`هذا الطالب لديه ${studentAttendance.length} سجل حضور. هل أنت متأكد من الحذف؟ سيتم حذف جميع سجلات الحضور أيضاً.`)) {
        return;
      }
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      deleteStudent(id);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', barcode: '', parentPhone: '', parentEmail: '', classId: '' });
    setEditingStudent(null);
    setGeneratedBarcode('');
    setShowAddForm(false);
  };

  return (
    <div className="section-spacing">
      <div className="layout-between">
        <h1 className="text-heading flex items-center">
          <Users className="icon-lg ml-2" />
          إدارة الطلاب
        </h1>
        {hasPermission('studentsEdit') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="icon-sm ml-2" />
            إضافة طالب
          </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingStudent ? 'تعديل الطالب' : 'إضافة طالب جديد'}
              </h2>
              <button onClick={resetForm} className="modal-close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-field">
                <label className="form-label">
                  اسم الطالب *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input-field"
                  required
                />
              </div>
              {!editingStudent && (
                <div className="alert-info">
                  <p className="text-sm">
                    {isLoadingBarcode 
                      ? 'جاري توليد كود الطالب...' 
                      : `سيتم توليد كود الطالب تلقائياً: ${generatedBarcode || 'لم يتم التوليد بعد'}`
                    }
                  </p>
                </div>
              )}
              <div className="form-field">
                <label className="form-label">
                  رقم هاتف ولي الأمر *
                </label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="form-input-field"
                  placeholder="201002246668 أو 966501234567"
                  maxLength={12}
                  required
                />
                <p className="text-small mt-1">
                  يجب إدخال 12 رقم بالضبط مع كود الدولة (مثال: 201002246668 أو 966501234567)
                </p>
              </div>
              <div className="form-field">
                <label className="form-label">
                  البريد الإلكتروني لولي الأمر
                </label>
                <input
                  type="email"
                  value={formData.parentEmail || ''}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  className="form-input-field"
                  placeholder="parent@example.com"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  المجموعة
                </label>
                <select
                  value={formData.classId || ''}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value || null })}
                  className="form-input-field"
                >
                  <option value="">بدون مجموعة</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{getClassDisplayName(cls.id)}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary flex-1" disabled={isLoadingBarcode && !editingStudent}>
                  {editingStudent ? 'حفظ التغييرات' : 'إضافة الطالب'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* البحث والفلترة */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="البحث عن طالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-input-field"
            >
              <option value="">جميع المجموعات</option>
              <option value="no-class">بدون مجموعة</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{getClassDisplayName(cls.id)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* قائمة الطلاب */}
      <div className="table-container">
        {/* عرض الجدول على الشاشات الكبيرة */}
        <div className="desktop-table">
          <div className="table-content">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الكود</th>
                  <th>المجموعة</th>
                  <th>الصف الدراسي</th>
                  <th>رقم ولي الأمر</th>
                  <th>تاريخ الإضافة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.map((student) => {
                  const studentClass = classes.find(c => c.id === student.classId);
                  const grade = studentClass ? grades.find(g => g.id === studentClass.gradeId) : null;
                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="font-medium">{student.name}</div>
                      </td>
                      <td>{student.barcode}</td>
                      <td>
                        {studentClass?.name || (
                          <span className="text-danger">بدون مجموعة</span>
                        )}
                      </td>
                      <td>
                        {grade?.name || (
                          <span className="text-gray-400">غير محدد</span>
                        )}
                      </td>
                      <td>{student.parentPhone}</td>
                      <td>
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => {/* عرض تفاصيل الطالب */}}
                            className="table-btn text-blue-600 hover:text-blue-900"
                            title="عرض التفاصيل"
                          >
                            <Eye className="icon-sm" />
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            disabled={!hasPermission('studentsEdit')}
                            className="table-btn text-green-600 hover:text-green-900"
                            title="تعديل"
                          >
                            <Edit className="icon-sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            disabled={!hasPermission('studentsDelete')}
                            className="table-btn text-red-600 hover:text-red-900"
                            title="حذف"
                          >
                            <Trash2 className="icon-sm" />
                          </button>
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
          {currentStudents.map((student) => {
            const studentClass = classes.find(c => c.id === student.classId);
            return (
              <div key={student.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-title">{student.name}</div>
                    <div className="mobile-card-subtitle">كود: {student.barcode}</div>
                  </div>
                  <div className="mobile-btn-group">
                    <button
                      onClick={() => {/* عرض تفاصيل الطالب */}}
                      className="mobile-btn text-blue-600 hover:bg-blue-100"
                      title="عرض التفاصيل"
                    >
                      <Eye className="icon-sm" />
                    </button>
                    <button
                      onClick={() => handleEdit(student)}
                      disabled={!hasPermission('studentsEdit')}
                      className="mobile-btn text-green-600 hover:bg-green-100"
                      title="تعديل"
                    >
                      <Edit className="icon-sm" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      disabled={!hasPermission('studentsDelete')}
                      className="mobile-btn text-red-600 hover:bg-red-100"
                      title="حذف"
                    >
                      <Trash2 className="icon-sm" />
                    </button>
                  </div>
                </div>
                <div className="mobile-card-content">
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المجموعة</div>
                    <div className="mobile-card-value">
                      {getClassDisplayName(student.classId) || (
                        <span className="text-danger">بدون مجموعة</span>
                      )}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الصف الدراسي</div>
                    <div className="mobile-card-value">
                      {(() => {
                        const studentClass = classes.find(c => c.id === student.classId);
                        const grade = studentClass ? grades.find(g => g.id === studentClass.gradeId) : null;
                        return grade?.name || <span className="text-gray-400">غير محدد</span>;
                      })()}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">رقم ولي الأمر</div>
                    <div className="mobile-card-value">{student.parentPhone}</div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">تاريخ الإضافة</div>
                    <div className="mobile-card-value">
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}
                    </div>
                  </div>
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
              className={`pagination-btn ${currentPage === 1 ? 'pagination-btn-disabled' : 'pagination-btn-inactive'}`}
            >
              السابق
            </button>
            
            <div className="flex flex-wrap gap-1 justify-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-btn ${
                    page === currentPage ? 'pagination-btn-active' : 'pagination-btn-inactive'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`pagination-btn ${currentPage === totalPages ? 'pagination-btn-disabled' : 'pagination-btn-inactive'}`}
            >
              التالي
            </button>
          </div>
        )}
      </div>
        
      {currentStudents.length === 0 && (
        <div className="layout-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-secondary">
              {filteredStudents.length === 0 ? 'لا توجد طلاب مطابقين للبحث' : 'لا توجد بيانات في هذه الصفحة'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
