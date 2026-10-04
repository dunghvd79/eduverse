import React from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from '../../components/common/Toast';
import { Field, inputCls, btnCls } from './authUi';
import { api } from '../../services/api';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:,.<>])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:,.<>]{8,32}$/;

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      token: tokenFromUrl,
      password: '',
      confirm: ''
    }
  });

  const pw = watch('password');

  const onSubmit = async (formData) => {
    try {
      await api.post('/auth/reset-password', {
        token: formData.token.trim(),
        newPassword: formData.password
      });

      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      nav('/auth/login');
    } catch (err) {
      console.error('Reset password error:', err);
      const msg = err.message || err.error || 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.';
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-headline-lg font-bold text-slate-900">Đặt lại mật khẩu</h1>
        <p className="text-body-md text-slate-600 mt-1">
          Thiết lập mật khẩu mới an toàn cho tài khoản EduVerse của bạn.
        </p>
      </div>

      <Field label="Mã Token bảo mật" error={errors.token?.message}>
        <input 
          className={inputCls} 
          placeholder="Dán chuỗi token xác nhận tại đây..."
          {...register('token', { required: 'Vui lòng nhập chuỗi token bảo mật' })} 
        />
      </Field>

      <Field label="Mật khẩu mới" error={errors.password?.message}>
        <input 
          type="password" 
          className={inputCls} 
          placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
          {...register('password', { 
            required: 'Vui lòng nhập mật khẩu mới', 
            pattern: {
              value: passwordPattern,
              message: 'Mật khẩu phải từ 8-32 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
            }
          })} 
        />
      </Field>

      <Field label="Xác nhận mật khẩu mới" error={errors.confirm?.message}>
        <input 
          type="password" 
          className={inputCls} 
          placeholder="Nhập lại mật khẩu mới"
          {...register('confirm', { 
            required: 'Vui lòng xác nhận mật khẩu',
            validate: (v) => v === pw || 'Mật khẩu xác nhận không khớp' 
          })} 
        />
      </Field>

      <button className={btnCls} disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang cập nhật mật khẩu...
          </span>
        ) : 'Cập nhật mật khẩu'}
      </button>

      <p className="text-center text-body-md text-slate-600">
        <Link to="/auth/login" className="text-primary font-semibold hover:underline">
          ← Quay lại trang Đăng nhập
        </Link>
      </p>
    </form>
  );
}
