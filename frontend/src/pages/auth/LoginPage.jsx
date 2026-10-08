import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import { Field, inputCls, btnCls } from './authUi';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';

export default function LoginPage() {
  const nav = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      remember: true
    }
  });

  const onSubmit = async (formData) => {
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { user, accessToken } = response.data;
      setAuth(user, accessToken);

      toast.success(`Đăng nhập thành công! Chào mừng ${user.fullName}`);

      // Điều hướng thông minh theo vai trò người dùng (Role-based Navigation)
      switch (user.role) {
        case 'admin':
          nav('/admin/dashboard');
          break;
        case 'training_manager':
          nav('/manager/dashboard');
          break;
        case 'teacher':
          nav('/teacher/dashboard');
          break;
        case 'student':
        default:
          nav('/student/dashboard');
          break;
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || err.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      toast.error(msg);
    }
  };

  // Tiện ích hỗ trợ test nhanh các tài khoản mẫu
  const fillSampleAccount = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-headline-lg font-bold text-slate-900">Đăng nhập</h1>
        <p className="text-body-md text-slate-600 mt-1">Chào mừng bạn quay trở lại với nền tảng EduVerse LMS</p>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <input 
          type="email" 
          className={inputCls} 
          placeholder="ban@email.com"
          {...register('email', { 
            required: 'Vui lòng nhập email', 
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' } 
          })} 
        />
      </Field>

      <Field label="Mật khẩu" error={errors.password?.message}>
        <div className="relative">
          <input 
            type={showPassword ? 'text' : 'password'} 
            className={`${inputCls} pr-10`} 
            placeholder="••••••••"
            {...register('password', { required: 'Vui lòng nhập mật khẩu' })} 
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 focus:outline-none"
            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </Field>

      <div className="flex items-center justify-between text-body-md">
        <label className="flex items-center gap-2 cursor-pointer text-slate-700">
          <input type="checkbox" className="rounded text-primary focus:ring-primary" {...register('remember')} /> 
          Ghi nhớ đăng nhập
        </label>
        <Link to="/auth/forgot-password" className="text-primary font-medium hover:underline">
          Quên mật khẩu?
        </Link>
      </div>

      <button className={btnCls} disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang xác thực...
          </span>
        ) : 'Đăng nhập'}
      </button>

      {/* Widget nạp tài khoản test nhanh */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
        <p className="font-semibold text-slate-700">⚡ Chọn nhanh tài khoản mẫu để kiểm thử:</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button 
            type="button" 
            onClick={() => fillSampleAccount('student.dung@eduverse.com', 'EduVerse@2026')}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-left hover:bg-slate-100 transition truncate text-slate-800"
          >
            🎓 Học viên (Dũng)
          </button>
          <button 
            type="button" 
            onClick={() => fillSampleAccount('teacher.an@eduverse.com', 'EduVerse@2026')}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-left hover:bg-slate-100 transition truncate text-slate-800"
          >
            👨‍🏫 Giảng viên (An)
          </button>
          <button 
            type="button" 
            onClick={() => fillSampleAccount('manager@eduverse.com', 'EduVerse@2026')}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-left hover:bg-slate-100 transition truncate text-slate-800"
          >
            📋 Quản lý (Minh)
          </button>
          <button 
            type="button" 
            onClick={() => fillSampleAccount('admin@eduverse.com', 'EduVerse@2026')}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-left hover:bg-slate-100 transition truncate text-slate-800"
          >
            🛡️ Admin (Hệ thống)
          </button>
        </div>
      </div>

      <p className="text-center text-body-md text-slate-600">
        Chưa có tài khoản?{' '}
        <Link to="/auth/register" className="text-primary font-semibold hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
