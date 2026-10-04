import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  Sparkles, 
  Camera, 
  Calendar,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { PortalHeader, Button, Card, SectionTitle, Badge } from '../../components/portal/PortalUI';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../stores/useAuthStore';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80'
];

export default function ProfilePage() {
  const storeUser = useAuthStore((state) => state.user);
  const updateUserInStore = useAuthStore((state) => state.updateUser);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    avatarUrl: '',
    role: '',
    createdAt: ''
  });

  // Profile Form State
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Fetch latest profile from backend API
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await userService.getMe();
        if (isMounted && res) {
          setProfileData({
            fullName: res.fullName || '',
            email: res.email || '',
            phoneNumber: res.phoneNumber || '',
            bio: res.bio || '',
            avatarUrl: res.avatarUrl || '',
            role: res.role || 'student',
            createdAt: res.createdAt || ''
          });
          updateUserInStore(res);
        }
      } catch (err) {
        if (isMounted && storeUser) {
          setProfileData({
            fullName: storeUser.fullName || '',
            email: storeUser.email || '',
            phoneNumber: storeUser.phoneNumber || '',
            bio: storeUser.bio || '',
            avatarUrl: storeUser.avatarUrl || '',
            role: storeUser.role || 'student',
            createdAt: storeUser.createdAt || ''
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();
    return () => { isMounted = false; };
  }, []);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileData.fullName.trim()) {
      setProfileError('Họ và tên không được để trống.');
      return;
    }

    try {
      setIsSavingProfile(true);
      const updated = await userService.updateMe({
        fullName: profileData.fullName.trim(),
        phoneNumber: profileData.phoneNumber.trim() || null,
        bio: profileData.bio.trim() || null,
        avatarUrl: profileData.avatarUrl.trim() || null
      });

      updateUserInStore(updated);
      setProfileSuccess('Cập nhật thông tin hồ sơ thành công!');
      setTimeout(() => setProfileSuccess(''), 5000);
    } catch (err) {
      setProfileError(err?.message || 'Không thể cập nhật hồ sơ cá nhân.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Strength Calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/\d/.test(pass)) score += 25;
    if (/[@$!%*?&#^()_+\-=\[\]{}|;:,.<>]/.test(pass)) score += 25;
    return score;
  };
  const strength = getPasswordStrength(passwordData.newPassword);

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (strength < 75) {
      setPasswordError('Mật khẩu mới phải gồm chữ hoa, chữ số và ký tự đặc biệt.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    try {
      setIsChangingPass(true);
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      setPasswordSuccess('Đổi mật khẩu thành công! Các phiên đăng nhập trên thiết bị khác đã được thu hồi an toàn.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 6000);
    } catch (err) {
      setPasswordError(err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge tone="purple">Quản trị viên (Admin)</Badge>;
      case 'training_manager': return <Badge tone="orange">Quản lý đào tạo (Manager)</Badge>;
      case 'teacher': return <Badge tone="blue">Giảng viên (Teacher)</Badge>;
      default: return <Badge tone="green">Học viên (Student)</Badge>;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'EV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formattedDate = profileData.createdAt 
    ? new Date(profileData.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <>
      <PortalHeader 
        eyebrow="TÀI KHOẢN & BẢO MẬT" 
        title="Hồ sơ cá nhân" 
        desc="Quản lý thông tin định danh, liên hệ và thiết lập mật khẩu truy cập hệ thống EduVerse."
      />

      <div className="dashboard-grid">
        {/* =========================================
            CARD 1: THÔNG TIN HỒ SƠ & LIÊN HỆ
        ========================================= */}
        <Card>
          <SectionTitle title="Thông tin cá nhân & Ảnh đại diện" />

          {/* Profile Overview Card */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center text-2xl font-bold border-2 border-white shadow-md">
                {profileData.avatarUrl ? (
                  <img 
                    src={profileData.avatarUrl} 
                    alt={profileData.fullName} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  getInitials(profileData.fullName)
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-800 m-0">{profileData.fullName || 'Người dùng EduVerse'}</h3>
                {getRoleBadge(profileData.role)}
              </div>
              <p className="text-xs text-slate-500 m-0 mb-1 flex items-center justify-center sm:justify-start gap-1">
                <Mail size={13} /> {profileData.email}
              </p>
              <p className="text-xs text-slate-400 m-0 flex items-center justify-center sm:justify-start gap-1">
                <Calendar size={13} /> Tham gia: {formattedDate}
              </p>
            </div>
          </div>

          {/* Quick Preset Avatars */}
          <div className="mb-5">
            <span className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Chọn nhanh ảnh đại diện mẫu:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setProfileData({ ...profileData, avatarUrl: url })}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all p-0 flex-shrink-0 cursor-pointer ${
                    profileData.avatarUrl === url ? 'border-primary ring-2 ring-blue-100 scale-105' : 'border-transparent hover:opacity-80'
                  }`}
                  title={`Ảnh đại diện mẫu ${idx + 1}`}
                >
                  <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
              {profileData.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, avatarUrl: '' })}
                  className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded border border-slate-200 ml-1"
                  title="Xóa avatar về chữ viết tắt"
                >
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSaveProfile}>
            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle2 size={18} className="flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="form-grid mb-4">
              <label className="field">
                <span>Họ và tên *</span>
                <input 
                  type="text" 
                  value={profileData.fullName} 
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  placeholder="Nhập họ và tên đầy đủ"
                  required
                />
              </label>

              <label className="field">
                <span>Địa chỉ Email (Định danh tài khoản)</span>
                <div className="relative">
                  <input 
                    type="email" 
                    value={profileData.email} 
                    disabled 
                    className="bg-slate-100 text-slate-500 cursor-not-allowed pr-24"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ĐÃ XÁC THỰC
                  </span>
                </div>
              </label>

              <label className="field">
                <span>Số điện thoại liên hệ</span>
                <input 
                  type="text" 
                  value={profileData.phoneNumber} 
                  onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                  placeholder="Ví dụ: 0987654321"
                />
              </label>

              <label className="field">
                <span>URL Ảnh đại diện (Tùy chọn)</span>
                <input 
                  type="url" 
                  value={profileData.avatarUrl} 
                  onChange={(e) => setProfileData({ ...profileData, avatarUrl: e.target.value })}
                  placeholder="https://..."
                />
              </label>
            </div>

            <label className="field mb-5">
              <div className="flex justify-between items-center mb-1">
                <span>Giới thiệu bản thân (Bio)</span>
                <span className="text-[11px] text-slate-400">{profileData.bio?.length || 0}/500</span>
              </div>
              <textarea 
                rows={3} 
                maxLength={500}
                value={profileData.bio} 
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Chia sẻ ngắn về bản thân, chuyên ngành hoặc học vị của bạn..."
              />
            </label>

            <Button type="submit" disabled={isSavingProfile}>
              <Save size={16} /> {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}
            </Button>
          </form>
        </Card>

        {/* =========================================
            CARD 2: TỰ ĐỔI MẬT KHẨU TÀI KHOẢN
        ========================================= */}
        <Card>
          <SectionTitle title="Bảo mật & Đổi mật khẩu" />
          <p className="text-xs text-slate-500 -mt-2 mb-4 leading-relaxed">
            Để bảo vệ an toàn cho tài khoản, hãy sử dụng mật khẩu mạnh có tối thiểu 8 ký tự kết hợp chữ hoa, chữ số và ký tự đặc biệt.
          </p>

          <form onSubmit={handleChangePassword}>
            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle2 size={18} className="flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Current Password */}
            <label className="field relative">
              <span>Mật khẩu hiện tại *</span>
              <div className="relative">
                <input 
                  type={showCurrentPass ? 'text' : 'password'} 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Nhập mật khẩu hiện tại của bạn"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* New Password */}
            <label className="field relative">
              <span>Mật khẩu mới *</span>
              <div className="relative">
                <input 
                  type={showNewPass ? 'text' : 'password'} 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Password Strength Meter */}
            {passwordData.newPassword && (
              <div className="mb-4">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-500">Độ an toàn mật khẩu:</span>
                  <span className={`font-bold ${
                    strength <= 25 ? 'text-red-500' : strength <= 50 ? 'text-amber-500' : strength <= 75 ? 'text-blue-500' : 'text-emerald-500'
                  }`}>
                    {strength <= 25 ? 'Rất yếu' : strength <= 50 ? 'Trung bình' : strength <= 75 ? 'Khá' : 'Rất mạnh'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      strength <= 25 ? 'bg-red-500' : strength <= 50 ? 'bg-amber-500' : strength <= 75 ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <label className="field relative mb-5">
              <span>Xác nhận lại mật khẩu mới *</span>
              <div className="relative">
                <input 
                  type={showConfirmPass ? 'text' : 'password'} 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Nhập lại chính xác mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <Button variant="secondary" type="submit" disabled={isChangingPass} className="w-full">
              <KeyRound size={16} /> {isChangingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
            </Button>

            <div className="security-note mt-4">
              <Shield size={18} className="text-blue-600 flex-shrink-0" />
              <span>
                Khi đổi mật khẩu thành công, toàn bộ phiên đăng nhập trên các trình duyệt và thiết bị khác sẽ được tự động đăng xuất để bảo vệ an toàn.
              </span>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
