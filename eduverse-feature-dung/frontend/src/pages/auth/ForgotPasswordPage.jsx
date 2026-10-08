import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from '../../components/common/Toast';
import { Field, inputCls, btnCls } from './authUi';
import { api } from '../../services/api';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (formData) => {
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      setSubmittedEmail(formData.email);
      setSent(true);
      toast.success('Yêu cầu đặt lại mật khẩu đã được tiếp nhận.');
    } catch (err) {
      console.error('Forgot password error:', err);
      const msg = err.message || err.error || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      toast.error(msg);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-headline-lg font-bold text-slate-900">Kiểm tra email của bạn</h1>
        <p className="text-body-md text-slate-600">
          Nếu email <strong>{submittedEmail}</strong> tồn tại trong hệ thống EduVerse, chúng tôi đã tạo liên kết đặt lại mật khẩu an toàn.
        </p>
        <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          💡 Lưu ý cho nhà phát triển / kiểm thử: Đường dẫn chứa Token Reset đã được in ra tại Terminal của Backend Server!
        </p>
        <div className="pt-2 space-y-2">
          <Link 
            to={`/auth/reset-password?email=${encodeURIComponent(submittedEmail)}`} 
            className={`${btnCls} inline-flex items-center justify-center`}
          >
            Chuyển tới trang Đặt lại mật khẩu
          </Link>
          <p className="text-center text-body-md">
            <Link to="/auth/login" className="text-primary font-semibold hover:underline">
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-headline-lg font-bold text-slate-900">Quên mật khẩu</h1>
        <p className="text-body-md text-slate-600 mt-1">
          Nhập địa chỉ email tài khoản của bạn để nhận liên kết khôi phục mật khẩu.
        </p>
      </div>

      <Field label="Email đã đăng ký" error={errors.email?.message}>
        <input 
          type="email" 
          className={inputCls} 
          placeholder="ban@email.com"
          {...register('email', { 
            required: 'Vui lòng nhập địa chỉ email', 
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' } 
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
            Đang gửi yêu cầu...
          </span>
        ) : 'Gửi hướng dẫn đặt lại'}
      </button>

      <p className="text-center text-body-md">
        <Link to="/auth/login" className="text-primary font-semibold hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
