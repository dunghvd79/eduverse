import React from 'react';
import {Routes,Route} from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import StudentLayout from '../layouts/StudentLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import ManagerLayout from '../layouts/ManagerLayout';
import AdminLayout from '../layouts/AdminLayout';
import HomePage from '../pages/public/HomePage';
import CourseCatalogPage from '../pages/public/CourseCatalogPage';
import CourseDetailPage from '../pages/public/CourseDetailPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import MyCoursesPage from '../pages/student/MyCoursesPage';
import StudentClassDetailPage from '../pages/student/StudentClassDetailPage';
import ClassroomPage from '../pages/student/ClassroomPage';
import QuizTakePage from '../pages/student/QuizTakePage';
import QuizResultPage from '../pages/student/QuizResultPage';
import AssignmentDetailPage from '../pages/student/AssignmentDetailPage';
import GradesPage from '../pages/student/GradesPage';
import ProfilePage from '../pages/student/ProfilePage';
import TeacherDashboardPage from '../pages/teacher/TeacherDashboardPage';
import TeacherCoursesPage from '../pages/teacher/TeacherCoursesPage';
import CourseCurriculumBuilderPage from '../pages/teacher/CourseCurriculumBuilderPage';
import TeacherClassesPage from '../pages/teacher/TeacherClassesPage';
import TeacherClassDetailPage from '../pages/teacher/TeacherClassDetailPage';
import TeacherQuizzesPage from '../pages/teacher/TeacherQuizzesPage';
import AIQuizGeneratorPage from '../pages/teacher/AIQuizGeneratorPage';
import TeacherAssignmentsPage from '../pages/teacher/TeacherAssignmentsPage';
import AssignmentGradingPage from '../pages/teacher/AssignmentGradingPage';
import GradebookPage from '../pages/teacher/GradebookPage';
import ManagerDashboardPage from '../pages/manager/ManagerDashboardPage';
import CourseApprovalQueuePage from '../pages/manager/CourseApprovalQueuePage';
import CourseReviewDetailPage from '../pages/manager/CourseReviewDetailPage';
import CategoryManagementPage from '../pages/manager/CategoryManagementPage';
import ManagerReportsPage from '../pages/manager/ManagerReportsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';
import PlatformSettingsPage from '../pages/admin/PlatformSettingsPage';

export default function AppRoutes(){
 return <Routes>
  <Route element={<PublicLayout/>}><Route path="/" element={<HomePage/>}/><Route path="/courses" element={<CourseCatalogPage/>}/><Route path="/courses/:id" element={<CourseDetailPage/>}/></Route>
  <Route path="/auth" element={<AuthLayout/>}><Route path="login" element={<LoginPage/>}/><Route path="register" element={<RegisterPage/>}/><Route path="verify-email" element={<VerifyOtpPage/>}/><Route path="forgot-password" element={<ForgotPasswordPage/>}/><Route path="reset-password" element={<ResetPasswordPage/>}/></Route>
  <Route path="/student" element={<StudentLayout/>}>
   <Route path="dashboard" element={<StudentDashboardPage/>}/><Route path="my-courses" element={<MyCoursesPage/>}/><Route path="classes/:id" element={<StudentClassDetailPage/>}/><Route path="courses/:courseId/learn/:lessonId" element={<ClassroomPage/>}/><Route path="quizzes/:id/take" element={<QuizTakePage/>}/><Route path="quizzes/:id/result/:attemptId" element={<QuizResultPage/>}/><Route path="assignments/:id" element={<AssignmentDetailPage/>}/><Route path="grades" element={<GradesPage/>}/><Route path="profile" element={<ProfilePage/>}/>
  </Route>
  <Route path="/teacher" element={<TeacherLayout/>}>
   <Route path="dashboard" element={<TeacherDashboardPage/>}/><Route path="courses" element={<TeacherCoursesPage/>}/><Route path="courses/:id/curriculum" element={<CourseCurriculumBuilderPage/>}/><Route path="classes" element={<TeacherClassesPage/>}/><Route path="classes/:id" element={<TeacherClassDetailPage/>}/><Route path="quizzes" element={<TeacherQuizzesPage/>}/><Route path="quizzes/ai-generator" element={<AIQuizGeneratorPage/>}/><Route path="assignments" element={<TeacherAssignmentsPage/>}/><Route path="assignments/:id/grade" element={<AssignmentGradingPage/>}/><Route path="classes/:id/gradebook" element={<GradebookPage/>}/>
  </Route>
  <Route path="/manager" element={<ManagerLayout/>}><Route path="dashboard" element={<ManagerDashboardPage/>}/><Route path="approvals" element={<CourseApprovalQueuePage/>}/><Route path="approvals/:id/review" element={<CourseReviewDetailPage/>}/><Route path="categories" element={<CategoryManagementPage/>}/><Route path="reports" element={<ManagerReportsPage/>}/></Route>
  <Route path="/admin" element={<AdminLayout/>}><Route path="dashboard" element={<AdminDashboardPage/>}/><Route path="users" element={<UserManagementPage/>}/><Route path="audit-logs" element={<AuditLogsPage/>}/><Route path="settings" element={<PlatformSettingsPage/>}/></Route>
  <Route path="*" element={<NotFoundPage/>}/>
 </Routes>
}