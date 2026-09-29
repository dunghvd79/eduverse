import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from '../../components/common/Toast';
import { Field, inputCls, btnCls } from './authUi';

export default function LoginPage() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500)); // TODO: POST /api/v1/auth/login
    toast.success('Đăng nhập thành công');
    nav('/');
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-headline-lg text-slate-900">Đăng nhập</h1>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" className={inputCls} placeholder="ban@email.com"
          {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' } })} />
      </Field>
      <Field label="Mật khẩu" error={errors.password?.message}>
        <input type="password" className={inputCls} {...register('password', { required: 'Vui lòng nhập mật khẩu' })} />
      </Field>
      <div className="flex items-center justify-between text-body-md">
        <label className="flex items-center gap-2"><input type="checkbox" {...register('remember')} /> Ghi nhớ đăng nhập</label>
        <Link to="/auth/forgot-password" className="text-primary font-medium hover:underline">Quên mật khẩu?</Link>
      </div>
      <button className={btnCls} disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}</button>
      <p className="text-center text-body-md text-slate-600">Chưa có tài khoản? <Link to="/auth/register" className="text-primary font-semibold hover:underline">Đăng ký</Link></p>
    </form>
  );
}
