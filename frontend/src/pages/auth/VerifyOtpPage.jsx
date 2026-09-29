import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../components/common/Toast';
import { btnCls } from './authUi';

export default function VerifyOtpPage() {
  const nav = useNavigate();
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [left, setLeft] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const change = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const key = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };
  const submit = (e) => {
    e.preventDefault();
    if (digits.some((d) => !d)) return toast.error('Vui lòng nhập đủ 6 chữ số');
    toast.success('Xác thực thành công'); // TODO: POST /api/v1/auth/verify-otp
    nav('/auth/login');
  };
  const resend = () => { setLeft(60); toast.info('Đã gửi lại mã OTP'); };

  return (
    <form onSubmit={submit} className="space-y-5 text-center">
      <h1 className="text-headline-lg text-slate-900">Xác thực email</h1>
      <p className="text-body-md text-slate-600">Nhập mã 6 chữ số đã gửi tới email của bạn.</p>
      <div className="flex justify-center gap-2">
        {digits.map((d, i) => (
          <input key={i} ref={(el) => (refs.current[i] = el)} value={d} inputMode="numeric" maxLength={1}
            onChange={(e) => change(i, e.target.value)} onKeyDown={(e) => key(i, e)}
            className="w-11 h-12 text-center text-xl font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        ))}
      </div>
      <button className={btnCls}>Xác nhận</button>
      <button type="button" onClick={resend} disabled={left > 0} className="text-body-md text-primary font-medium disabled:text-slate-400">
        {left > 0 ? `Gửi lại mã sau ${left}s` : 'Gửi lại mã'}
      </button>
    </form>
  );
}
