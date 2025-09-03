import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { GraduationCap, Plus, Edit, Trash2, Search, Eye } from 'lucide-react';

export const TeachersManagement: React.FC = () => {
  const { teachers, subjects, classes, addTeacher, updateTeacher, deleteTeacher, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subjectId: '',
    phone: '',
    email: ''
  });

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // حساب البيانات للصفحة الحالية
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTeachers = filteredTeachers.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('يرجى إدخال اسم المعلم');
      return;
    }

    if (editingTeacher) {
      updateTeacher(editingTeacher, formData);
      setEditingTeacher(null);
    } else {
      addTeacher(formData);
    }
    setFormData({ name: '', subjectId: '', phone: '', email: '' });
    setShowAddForm(false);
  };

  const handleEdit = (teacher: any) => {
    setEditingTeacher(teacher.id);
    setFormData({
      name: teacher.name,
      subjectId: teacher.subjectId || '',
      phone: teacher.phone || '',
      email: teacher.email || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    // التحقق من ارتباط المعلم بفصول
    const teacherClasses = classes.filter(c => c.teacherId === id);
    if (teacherClasses.length > 0) {
      alert(`لا يمكن حذف المعلم لأنه مرتبط بـ ${teacherClasses.length} مجموعة. يرجى إزالة المعلم من المجموعات أولاً.`);
      return;
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
      deleteTeacher(id);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', subjectId: '', phone: '', email: '' });
    setEditingTeacher(null);
    setShowAddForm(false);
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return 'غير محدد';
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'غير محدد';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <GraduationCap className="h-6 w-6 ml-2" />
          إدارة المعلمين
        </h1>
        {hasPermission('teachersEdit') && (
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة معلم
        </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingTeacher ? 'تعديل المعلم' : 'إضافة معلم جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المعلم *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: أحمد محمد علي"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المادة الدراسية
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المادة</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="966501234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="teacher@example.com"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  ملاحظة: المعلمون يُستخدمون لربطهم بالمجموعات والمواد، ولا يحتاجون لصلاحيات دخول النظام.
                </p>
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingTeacher ? 'حفظ التغييرات' : 'إضافة المعلم'}
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

      {/* البحث */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="البحث عن معلم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* قائمة المعلمين */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden desktop-table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المعلم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المادة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الهاتف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإضافة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {teacher.subjectName || 'غير محدد'}
                        </div>
                        {teacher.email && (
                          <div className="text-xs text-gray-500">{teacher.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{teacher.subjectName || 'غير محدد'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{teacher.phone || 'غير محدد'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      {hasPermission('teachersEdit') && (
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      )}
                      {hasPermission('teachersDelete') && (
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <span className="font-medium">{Math.min(endIndex, filteredTeachers.length)}</span> من{' '}
                  <span className="font-medium">{filteredTeachers.length}</span> نتيجة
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

      {/* عرض بطاقات للموبايل */}
      <div className="mobile-cards">
        {currentTeachers.map((teacher) => (
          <div key={teacher.id} className="mobile-card">
            <div className="mobile-card-header">
              <div className="mobile-card-title">{teacher.name}</div>
              <div className="mobile-btn-group">
                {hasPermission('teachersEdit') && (
                <button
                  onClick={() => handleEdit(teacher)}
                  className="mobile-btn text-green-600 hover:text-green-900"
                  title="تعديل"
                >
                  <Edit className="h-4 w-4" />
                </button>
                )}
                {hasPermission('teachersDelete') && (
                <button
                  onClick={() => handleDelete(teacher.id)}
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
                <div className="mobile-card-label">المادة</div>
                <div className="mobile-card-value">{teacher.subjectName || 'غير محدد'}</div>
              </div>
              <div className="mobile-card-field">
                <div className="mobile-card-label">رقم الهاتف</div>
                <div className="mobile-card-value">{teacher.phone || 'غير محدد'}</div>
              </div>
              <div className="mobile-card-field">
                <div className="mobile-card-label">البريد الإلكتروني</div>
                <div className="mobile-card-value">{teacher.email || 'غير محدد'}</div>
              </div>
              <div className="mobile-card-field">
                <div className="mobile-card-label">تاريخ الإضافة</div>
                <div className="mobile-card-value">
                  {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentTeachers.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filteredTeachers.length === 0 ? 'لا توجد معلمين مطابقين للبحث' : 'لا توجد بيانات في هذه الصفحة'}
          </p>
        </div>
      )}
    </div>
  );
};