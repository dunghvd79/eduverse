import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { toast } from '../../components/common/Toast';
import { btnCls } from './authUi';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';

export default function VerifyOtpPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const initialEmail = location.state?.email || searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [left, setLeft] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
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

  const key = (i, e) => { 
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus(); 
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      setDigits(pasted.split(''));
      refs.current[5]?.focus();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email) {
      return toast.error('Vui lòng nhập địa chỉ email cần xác thực.');
    }
    const otp = digits.join('');
    if (otp.length < 6) {
      return toast.error('Vui lòng nhập đủ 6 chữ số mã OTP.');
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp
      });

      const { user, accessToken } = response.data;
      setAuth(user, accessToken);

      toast.success(`Kích hoạt tài khoản thành công! Chào mừng ${user.fullName}`);
      nav('/student/dashboard');
    } catch (err) {
      console.error('Verify OTP error:', err);
      const msg = err.message || err.error || 'Mã OTP không chính xác hoặc đã hết hạn.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    if (!email) {
      return toast.error('Vui lòng nhập địa chỉ email để nhận lại mã.');
    }
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setLeft(60);
      setDigits(Array(6).fill(''));
      toast.info('Mã OTP mới đã được gửi vào hòm thư của bạn.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      const msg = err.message || err.error || 'Không thể gửi lại mã OTP lúc này.';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 text-center">
      <div>
        <h1 className="text-headline-lg font-bold text-slate-900">Xác thực tài khoản</h1>
        <p className="text-body-md text-slate-600 mt-1">
          Nhập mã OTP 6 chữ số đã được gửi tới địa chỉ:
        </p>
        {initialEmail ? (
          <p className="font-semibold text-primary mt-0.5">{initialEmail}</p>
        ) : (
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
      </div>

      {/* 6 Ô nhập ký tự OTP */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input 
            key={i} 
            ref={(el) => (refs.current[i] = el)} 
            value={d} 
            inputMode="numeric" 
            maxLength={1}
            onChange={(e) => change(i, e.target.value)} 
            onKeyDown={(e) => key(i, e)}
            className="w-11 h-12 text-center text-xl font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition" 
          />
        ))}
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
        ) : 'Kích hoạt tài khoản'}
      </button>

      <div className="flex flex-col items-center gap-2 pt-1">
        <button 
          type="button" 
          onClick={resend} 
          disabled={left > 0 || isResending} 
          className="text-body-md text-primary font-medium hover:underline disabled:text-slate-400 disabled:no-underline"
        >
          {isResending ? 'Đang gửi lại...' : left > 0 ? `Gửi lại mã sau ${left}s` : 'Chưa nhận được mã? Gửi lại'}
        </button>

        <p className="text-xs text-slate-500">
          💡 <i>Lưu ý trong lúc phát triển: Bạn có thể xem mã OTP trực tiếp tại Terminal Backend Server.</i>
        </p>

        <Link to="/auth/login" className="text-xs text-slate-600 hover:text-primary transition mt-2">
          ← Quay lại trang Đăng nhập
        </Link>
      </div>
    </form>
  );
}
