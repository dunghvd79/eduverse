# EduVerse Feature - Ngocson

## Hoan thien 28 man hinh role-based

Frontend React/Vite cua EduVerse da bo sung:
- 4 Master Layouts: Student, Teacher, Manager, Admin
- Student Portal: 9 man hinh
- Teacher Portal: 10 man hinh
- Training Manager: 5 man hinh
- Admin Console: 4 man hinh
- Tong: 28 man hinh moi

## Chay project

```bash
cd frontend
npm install
npm run dev
```

## Routes

### Student
- /student/dashboard
- /student/my-courses
- /student/classes/:id
- /student/courses/:courseId/learn/:lessonId
- /student/quizzes/:id/take
- /student/quizzes/:id/result/:attemptId
- /student/assignments/:id
- /student/grades
- /student/profile

### Teacher
- /teacher/dashboard
- /teacher/courses
- /teacher/courses/:id/curriculum
- /teacher/classes
- /teacher/classes/:id
- /teacher/quizzes
- /teacher/quizzes/ai-generator
- /teacher/assignments
- /teacher/assignments/:id/grade
- /teacher/classes/:id/gradebook

### Manager
- /manager/dashboard
- /manager/approvals
- /manager/approvals/:id/review
- /manager/categories
- /manager/reports

### Admin
- /admin/dashboard
- /admin/users
- /admin/audit-logs
- /admin/settings

UI follows the learning-platform patterns referenced from Study4: course catalog/dashboard, progress tracking, practice/quiz workflows and learning analytics, while keeping EduVerse branding and the requested four-role architecture.
