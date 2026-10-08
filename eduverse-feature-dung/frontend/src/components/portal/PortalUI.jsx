import React, {useState} from 'react';
import {NavLink, Navigate, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {BookOpen, LayoutDashboard, GraduationCap, Users, ClipboardCheck, FileText, BarChart3, Settings, ShieldCheck, FolderTree, Sparkles, Menu, X, Search, Bell, ChevronRight, LogOut, UserCircle} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

// Ánh xạ role trong DB sang tiền tố URL của portal
const PORTAL_BY_ROLE = { student: 'student', teacher: 'teacher', training_manager: 'manager', admin: 'admin' };

const roleConfig={
 student:{label:'Học viên',color:'blue',links:[
  ['Tổng quan','/student/dashboard',LayoutDashboard],['Khóa học của tôi','/student/my-courses',BookOpen],['Lớp học','/student/classes/1',Users],['Bài học','/student/courses/1/learn/1',GraduationCap],['Bài kiểm tra','/student/quizzes/1/take',ClipboardCheck],['Bài tập','/student/assignments/1',FileText],['Điểm số','/student/grades',BarChart3],['Hồ sơ','/student/profile',UserCircle]
 ]},
 teacher:{label:'Giảng viên',links:[
  ['Tổng quan','/teacher/dashboard',LayoutDashboard],['Khóa học','/teacher/courses',BookOpen],['Đề cương','/teacher/courses/1/curriculum',FolderTree],['Lớp học','/teacher/classes',Users],['Bài kiểm tra','/teacher/quizzes',ClipboardCheck],['AI Quiz','/teacher/quizzes/ai-generator',Sparkles],['Bài tập','/teacher/assignments',FileText],['Chấm bài','/teacher/assignments/1/grade',ClipboardCheck],['Sổ điểm','/teacher/classes/1/gradebook',BarChart3],['Hồ sơ','/teacher/profile',UserCircle]
 ]},
 manager:{label:'Quản lý đào tạo',links:[
  ['Tổng quan','/manager/dashboard',LayoutDashboard],['Duyệt khóa học','/manager/approvals',ClipboardCheck],['Chi tiết duyệt','/manager/approvals/1/review',FileText],['Danh mục','/manager/categories',FolderTree],['Báo cáo','/manager/reports',BarChart3],['Hồ sơ','/manager/profile',UserCircle]
 ]},
 admin:{label:'Quản trị viên',links:[
  ['Tổng quan','/admin/dashboard',LayoutDashboard],['Người dùng','/admin/users',Users],['Audit Logs','/admin/audit-logs',ShieldCheck],['Cài đặt hệ thống','/admin/settings',Settings],['Hồ sơ','/admin/profile',UserCircle]
 ]}
};

export function PortalLayout({role}) {
 const [open,setOpen]=useState(false); const cfg=roleConfig[role]; const location=useLocation();
 const nav = useNavigate();
 const user = useAuthStore((state) => state.user);
 const logout = useAuthStore((state) => state.logout);
 const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
 const isInitializing = useAuthStore((state) => state.isInitializing);

 const handleLogout = async (e) => {
   e.preventDefault();
   await logout();
   nav('/auth/login');
 };

 const getInitials = (name) => {
   if (!name) return 'EV';
   const parts = name.trim().split(' ');
   if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
   return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
 };

 const displayName = user?.fullName || (role==='student'?'Học viên':role==='teacher'?'Giảng viên':role==='manager'?'Quản lý':'Admin');
 const initials = getInitials(displayName);

 // Route guard: phải đăng nhập, đúng portal của role, và đổi mật khẩu tạm trước khi dùng hệ thống
 if (isInitializing) {
   return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang khôi phục phiên đăng nhập...</div>;
 }
 if (!isAuthenticated || !user) {
   return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
 }
 const userPortal = PORTAL_BY_ROLE[user.role];
 if (userPortal !== role) {
   return <Navigate to={`/${userPortal}/dashboard`} replace />;
 }
 const profilePath = `/${userPortal}/profile`;
 if (user.mustChangePassword && location.pathname !== profilePath) {
   return <Navigate to={profilePath} replace />;
 }

 return <div className="portal-shell">
  <aside className={`portal-sidebar ${open?'is-open':''}`}>
   <div className="portal-brand"><div className="brand-mark">E</div><div><b>Edu<span>Verse</span></b><small>{cfg.label}</small></div><button className="mobile-close" onClick={()=>setOpen(false)}><X size={20}/></button></div>
   <nav className="portal-nav">
    <div className="nav-caption">KHÔNG GIAN {role==='student'?'HỌC TẬP':role==='teacher'?'GIẢNG DẠY':role==='manager'?'ĐÀO TẠO':'QUẢN TRỊ'}</div>
    {cfg.links.map(([label,path,Icon])=><NavLink key={path} to={path} onClick={()=>setOpen(false)} className={({isActive})=>'portal-nav-link '+(isActive?'active':'')}><Icon size={18}/><span>{label}</span></NavLink>)}
   </nav>
   <div className="portal-sidebar-bottom"><div className="mini-user cursor-pointer transition-opacity hover:opacity-85" onClick={()=>nav(`/${role}/profile`)} title="Xem hồ sơ cá nhân"><div className="avatar overflow-hidden">{user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : initials}</div><div><b>{displayName}</b><small>{cfg.label}</small></div></div><button type="button" className="portal-logout bg-transparent border-0 cursor-pointer flex items-center gap-1.5" onClick={handleLogout}><LogOut size={17}/> Đăng xuất</button></div>
  </aside>
  {open&&<div className="sidebar-overlay" onClick={()=>setOpen(false)}/>}
  <section className="portal-main">
   <header className="portal-topbar"><button className="mobile-menu" onClick={()=>setOpen(true)}><Menu/></button><div className="crumb"><span>EduVerse</span><ChevronRight size={15}/><b>{cfg.label}</b></div><div className="top-actions"><div className="search-mini"><Search size={17}/><input placeholder="Tìm kiếm..."/></div><button className="icon-btn"><Bell size={19}/><i/></button><div className="top-avatar cursor-pointer overflow-hidden transition-transform hover:scale-105" onClick={()=>nav(`/${role}/profile`)} title="Xem hồ sơ cá nhân">{user?.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : initials}</div></div></header>
   <main className="portal-content"><Outlet/></main>
  </section>
 </div>
}
export const PortalHeader=({eyebrow,title,desc,actions})=><div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{desc&&<p>{desc}</p>}</div>{actions&&<div className="heading-actions">{actions}</div>}</div>;
export const Button=({children,variant='primary',...p})=><button className={`ui-btn ${variant}`} {...p}>{children}</button>;
export const StatCard=({icon:Icon,label,value,trend,sub})=><div className="stat-card"><div className="stat-icon"><Icon size={21}/></div><div><span>{label}</span><strong>{value}</strong>{trend&&<small className="trend">{trend}</small>}{sub&&<small>{sub}</small>}</div></div>;
export const Progress=({value})=><div className="progress-track"><div style={{width:`${value}%`}}/></div>;
export const Card=({children,className=''})=><section className={`portal-card ${className}`}>{children}</section>;
export const SectionTitle=({title,action})=><div className="section-title"><h2>{title}</h2>{action}</div>;
export const Table=({headers,rows})=><div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>;
export const Badge=({children,tone='blue'})=><span className={`badge ${tone}`}>{children}</span>;
export const Field=({label,children,placeholder,...p})=><label className="field"><span>{label}</span>{children||<input placeholder={placeholder} {...p}/>}</label>;
