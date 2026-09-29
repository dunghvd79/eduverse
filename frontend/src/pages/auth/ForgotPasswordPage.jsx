import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Field, inputCls, btnCls } from './authUi';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500)); // TODO: POST /api/v1/auth/forgot-password
    setSent(true);
  };
  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-headline-lg text-slate-900">Kiểm tra email của bạn</h1>
        <p className="text-body-md text-slate-600">Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.</p>
        <Link to="/auth/reset-password" className={`${btnCls} inline-flex items-center justify-center`}>Nhập mã đặt lại</Link>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-headline-lg text-slate-900">Quên mật khẩu</h1>
      <Field label="Email đã đăng ký" error={errors.email?.message}>
        <input type="email" className={inputCls} {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' } })} />
      </Field>
      <button className={btnCls} disabled={isSubmitting}>{isSubmitting ? 'Đang gửi...' : 'Gửi hướng dẫn'}</button>
      <p className="text-center text-body-md"><Link to="/auth/login" className="text-primary font-semibold hover:underline">Quay lại đăng nhập</Link></p>
    </form>
  );
}
