import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with:', username, password);
    setError('');
    
    login(username, password).then(success => {
      console.log('Login result:', success);
      if (!success) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else {
        console.log('Login successful, should redirect now');
      }
    }).catch(error => {
      console.error('Login error:', error);
      setError('حدث خطأ أثناء تسجيل الدخول');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-3 inline-block mb-4">
            <LogIn className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">نظام إدارة الحضور</h1>
          <p className="text-gray-600">مرحباً بك، يرجى تسجيل الدخول</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل اسم المستخدم"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                placeholder="أدخل كلمة المرور"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          >
            <LogIn className="h-4 w-4 ml-2" />
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 mb-2"></p>
          <p className="text-xs text-gray-500"></p>
          <p className="text-xs text-gray-500"></p>
        </div>
        
        {/* معلومات المطور */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
          <div className="text-center text-sm text-gray-700">
            <p className="font-medium text-blue-800">نظام إدارة الحضور الشامل</p>
            <p className="mt-1 text-xs">
              تطوير: <span className="font-semibold">Ahmed Hosny</span>
            </p>
            <p className="text-xs mt-1">
              📞 01272774494 - 01002246668
            </p>
            <p className="text-xs">
              📧 Sales@GO4Host.net
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};