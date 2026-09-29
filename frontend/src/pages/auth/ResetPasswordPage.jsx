import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from '../../components/common/Toast';
import { Field, inputCls, btnCls } from './authUi';

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const pw = watch('password');
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500)); // TODO: POST /api/v1/auth/reset-password
    toast.success('Đặt lại mật khẩu thành công');
    nav('/auth/login');
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-headline-lg text-slate-900">Đặt lại mật khẩu</h1>
      <Field label="Mã xác nhận" error={errors.token?.message}>
        <input className={inputCls} {...register('token', { required: 'Vui lòng nhập mã' })} />
      </Field>
      <Field label="Mật khẩu mới" error={errors.password?.message}>
        <input type="password" className={inputCls} {...register('password', { required: 'Vui lòng nhập mật khẩu', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })} />
      </Field>
      <Field label="Xác nhận mật khẩu mới" error={errors.confirm?.message}>
        <input type="password" className={inputCls} {...register('confirm', { validate: (v) => v === pw || 'Mật khẩu không khớp' })} />
      </Field>
      <button className={btnCls} disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}</button>
    </form>
  );
}
