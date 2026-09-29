import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from '../../components/common/Toast';
import { Field, inputCls, btnCls } from './authUi';

const strength = (p = '') => [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;

export default function RegisterPage() {
  const nav = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const pw = watch('password');
  const s = strength(pw);
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500)); // TODO: POST /api/v1/auth/register
    toast.success('Đăng ký thành công. Vui lòng xác thực email.');
    nav('/auth/verify-email');
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-headline-lg text-slate-900">Tạo tài khoản học viên</h1>
      <Field label="Họ và tên" error={errors.fullName?.message}>
        <input className={inputCls} {...register('fullName', { required: 'Vui lòng nhập họ tên' })} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input type="email" className={inputCls} {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' } })} />
      </Field>
      <Field label="Mật khẩu" error={errors.password?.message}>
        <input type="password" className={inputCls} {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })} />
      </Field>
      <div className="flex gap-1" aria-label="Độ mạnh mật khẩu">
        {[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= s ? (s < 3 ? 'bg-warning' : 'bg-success') : 'bg-slate-200'}`} />)}
      </div>
      <Field label="Xác nhận mật khẩu" error={errors.confirm?.message}>
        <input type="password" className={inputCls} {...register('confirm', { required: 'Vui lòng xác nhận', validate: (v) => v === pw || 'Mật khẩu không khớp' })} />
      </Field>
      <button className={btnCls} disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Đăng ký'}</button>
      <p className="text-center text-body-md text-slate-600">Đã có tài khoản? <Link to="/auth/login" className="text-primary font-semibold hover:underline">Đăng nhập</Link></p>
    </form>
  );
}
