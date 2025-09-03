const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔗 API Base URL:', API_BASE_URL);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 API Request:', url, options.method || 'GET');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log('🌐 API Request:', endpoint, options.method || 'GET');
      const response = await fetch(url, config);
      console.log('📨 Response Status:', response.status, response.statusText);
      
      console.log('📡 API Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ API Error Response:', response.status, response.statusText);
        console.error('❌ HTTP Error:', response.status, response.statusText);
        
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If JSON parsing fails, use the default error message
          console.warn('Could not parse error response as JSON');
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json(); 
      console.log('✅ API Response Data:', data);
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      
      // تحسين رسائل الخطأ
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        throw new Error('لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي على المنفذ 3001.');
      }
      
      throw error;
    }
  }

  // المصادقة
  async login(username: string, password: string) {
    console.log('🔐 تسجيل الدخول:', username);
    return this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  }

  // اختبار الاتصال
  async testConnection() {
    return this.request('/test');
  }

  // المستخدمين
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: userData,
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // الطلاب
  async getStudents() {
    return this.request('/students');
  }

  async createStudent(studentData: any) {
    return this.request('/students', {
      method: 'POST',
      body: studentData,
    });
  }

  async updateStudent(id: string, studentData: any) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: studentData,
    });
  }

  async deleteStudent(id: string) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  async transferStudent(studentId: string, newClassId: string | null) {
    return this.request(`/students/${studentId}/transfer`, {
      method: 'PUT',
      body: { newClassId },
    });
  }

  // المجموعات
  async getClasses() {
    return this.request('/classes');
  }

  async createClass(classData: any) {
    return this.request('/classes', {
      method: 'POST',
      body: classData,
    });
  }

  async updateClass(id: string, classData: any) {
    return this.request(`/classes/${id}`, {
      method: 'PUT',
      body: classData,
    });
  }

  async deleteClass(id: string) {
    return this.request(`/classes/${id}`, {
      method: 'DELETE',
    });
  }

  // المعلمين
  async getTeachers() {
    return this.request('/teachers');
  }

  async createTeacher(teacherData: any) {
    return this.request('/teachers', {
      method: 'POST',
      body: teacherData,
    });
  }

  async updateTeacher(id: string, teacherData: any) {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: teacherData,
    });
  }

  async deleteTeacher(id: string) {
    return this.request(`/teachers/${id}`, {
      method: 'DELETE',
    });
  }

  // المواد
  async getSubjects() {
    return this.request('/subjects');
  }

  async createSubject(subjectData: any) {
    return this.request('/subjects', {
      method: 'POST',
      body: subjectData,
    });
  }

  async updateSubject(id: string, subjectData: any) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: subjectData,
    });
  }

  async deleteSubject(id: string) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // الأماكن
  async getLocations() {
    return this.request('/locations');
  }

  async createLocation(locationData: any) {
    return this.request('/locations', {
      method: 'POST',
      body: locationData,
    });
  }

  async updateLocation(id: string, locationData: any) {
    return this.request(`/locations/${id}`, {
      method: 'PUT',
      body: locationData,
    });
  }

  async deleteLocation(id: string) {
    return this.request(`/locations/${id}`, {
      method: 'DELETE',
    });
  }

  // الصفوف الدراسية
  async getGrades() {
    return this.request('/grades');
  }

  async createGrade(gradeData: any) {
    return this.request('/grades', {
      method: 'POST',
      body: gradeData,
    });
  }

  async updateGrade(id: string, gradeData: any) {
    return this.request(`/grades/${id}`, {
      method: 'PUT',
      body: gradeData,
    });
  }

  async deleteGrade(id: string) {
    return this.request(`/grades/${id}`, {
      method: 'DELETE',
    });
  }

  // الحصص
  async getSessions() {
    console.log('📅 طلب جلب الحصص من الخادم...');
    return this.request('/sessions');
  }

  async createSession(sessionData: any) {
    console.log('➕ طلب إضافة جلسة جديدة:', sessionData);
    return this.request('/sessions', {
      method: 'POST',
      body: sessionData,
    });
  }

  async updateSession(id: string, sessionData: any) {
    console.log('✏️ طلب تحديث الحصة:', id, sessionData);
    return this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: sessionData,
    });
  }

  async deleteSession(id: string) {
    console.log('🗑️ طلب حذف الحصة:', id);
    return this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleSessionStatus(id: string) {
    console.log('🔄 طلب تغيير حالة الحصة:', id);
    return this.request(`/sessions/${id}/toggle-status`, {
      method: 'PUT',
    });
  }

  // جلب طلاب الحصة
  async getSessionStudents(sessionId: string) {
    console.log('👥 طلب جلب طلاب الحصة:', sessionId);
    return this.request(`/sessions/${sessionId}/students`);
  }

  // الحضور
  async getAttendance() {
    return this.request('/attendance');
  }

  async recordAttendance(attendanceData: any) {
    return this.request('/attendance', {
      method: 'POST',
      body: attendanceData,
    });
  }

  async updateAttendance(id: string, attendanceData: any) {
    return this.request(`/attendance/${id}`, {
      method: 'PUT',
      body: attendanceData,
    });
  }

  async deleteAttendance(id: string) {
    return this.request(`/attendance/${id}`, {
      method: 'DELETE',
    });
  }

  // التقارير
  async getReports() {
    return this.request('/reports');
  }

  async createReport(reportData: any) {
    console.log('📝 إنشاء تقرير جديد:', reportData);
    return this.request('/reports', {
      method: 'POST',
      body: reportData,
    });
  }

  async updateReport(id: string, reportData: any) {
    console.log('✏️ تحديث التقرير:', id, reportData);
    return this.request(`/reports/${id}`, {
      method: 'PUT',
      body: reportData,
    });
  }

  async deleteReport(id: string) {
    return this.request(`/reports/${id}`, {
      method: 'DELETE',
    });
  }

  async getPerformanceReport(filters: any) {
    return this.request('/reports/performance', {
      method: 'POST',
      body: filters,
    });
  }

  async getAttendanceReport(filters: any) {
    return this.request('/reports/attendance', {
      method: 'POST',
      body: filters,
    });
  }

  // الواتساب
  async initializeWhatsApp() {
    console.log('🚀 طلب تهيئة الواتساب من API...');
    const result = await this.request('/whatsapp/initialize', {
      method: 'POST',
    });
    console.log('📡 استجابة تهيئة الواتساب:', result);
    return result;
  }

  async getWhatsAppStatus() {
    console.log('📊 طلب حالة الواتساب من API...');
    const result = await this.request('/whatsapp/status');
    console.log('📡 استجابة حالة الواتساب:', result);
    return result;
  }

  async sendSessionReport(sessionId: string) {
    console.log('📤 طلب إرسال تقرير الحصة من API:', sessionId);
    const result = await this.request('/whatsapp/send-session-report', {
      method: 'POST',
      body: { sessionId },
    });
    console.log('📡 استجابة إرسال التقرير:', result);
    return result;
  }

  // الإحصائيات
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // توليد الباركود
  async generateBarcode() {
    return this.request('/students/generate-barcode');
  }
}

export const apiService = new ApiService();