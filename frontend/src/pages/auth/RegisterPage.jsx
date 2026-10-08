import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from '../../components/common/Toast';
import { Field, inputCls, btnCls } from './authUi';
import { api } from '../../services/api';

// Password policy regex: min 8, max 32, 1 uppercase, 1 lowercase, 1 number, 1 special character
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:,.<>]{8,32}$/;

const strength = (p = '') => {
  return [
    /.{8,}/,
    /[A-Z]/,
    /[0-9]/,
    /[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/
  ].filter((r) => r.test(p)).length;
};

export default function RegisterPage() {
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const pw = watch('password', '');
  const s = strength(pw);

  const onSubmit = async (formData) => {
    try {
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      });

      toast.success('Đăng ký thành công! Vui lòng kiểm tra mã OTP để kích hoạt tài khoản.');
      nav(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`, {
        state: { email: formData.email }
      });
    } catch (err) {
      console.error('Register error:', err);
      const msg = err.message || err.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-headline-lg font-bold text-slate-900">Tạo tài khoản học viên</h1>
        <p className="text-body-md text-slate-600 mt-1">Đăng ký tham gia các khóa học và lớp học trên EduVerse</p>
      </div>

      <Field label="Họ và tên" error={errors.fullName?.message}>
        <input 
          className={inputCls} 
          placeholder="Nguyễn Văn A"
          {...register('fullName', { 
            required: 'Vui lòng nhập họ và tên',
            minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
            maxLength: { value: 150, message: 'Họ tên không được vượt quá 150 ký tự' }
          })} 
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <input 
          type="email" 
          className={inputCls} 
          placeholder="hocvien@email.com"
          {...register('email', { 
            required: 'Vui lòng nhập email', 
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không đúng định dạng' } 
          })} 
        />
      </Field>

      <Field label="Mật khẩu" error={errors.password?.message}>
        <div className="relative">
          <input 
            type={showPassword ? 'text' : 'password'} 
            className={`${inputCls} pr-10`} 
            placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
            {...register('password', { 
              required: 'Vui lòng nhập mật khẩu',
              pattern: {
                value: passwordPattern,
                message: 'Mật khẩu phải từ 8-32 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
              }
            })} 
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

      {/* Thanh đo độ mạnh mật khẩu */}
      <div className="space-y-1">
        <div className="flex gap-1" aria-label="Độ mạnh mật khẩu">
          {[1, 2, 3, 4].map((i) => (
            <span 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= s ? (s < 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200'
              }`} 
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Độ an toàn: {s === 0 ? 'Rất yếu' : s < 3 ? 'Trung bình' : s === 3 ? 'Khá' : 'Rất mạnh'}
        </p>
      </div>

      <Field label="Xác nhận mật khẩu" error={errors.confirm?.message}>
        <div className="relative">
          <input 
            type={showConfirm ? 'text' : 'password'} 
            className={`${inputCls} pr-10`} 
            placeholder="Nhập lại mật khẩu"
            {...register('confirm', { 
              required: 'Vui lòng xác nhận mật khẩu', 
              validate: (v) => v === pw || 'Mật khẩu xác nhận không khớp' 
            })} 
          />
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1 focus:outline-none"
            title={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </Field>

      <button className={btnCls} disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo tài khoản...
          </span>
        ) : 'Đăng ký tài khoản'}
      </button>

      <p className="text-center text-body-md text-slate-600">
        Đã có tài khoản?{' '}
        <Link to="/auth/login" className="text-primary font-semibold hover:underline">
          Đăng nhập ngay
        </Link>
      </p>
    </form>
  );
}
