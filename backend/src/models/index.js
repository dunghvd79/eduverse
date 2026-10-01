import { sequelize } from '../config/database.js';

import User from './User.js';
import UserToken from './UserToken.js';
import Course from './Course.js';
import Chapter from './Chapter.js';
import Lesson from './Lesson.js';
import CourseMaterial from './CourseMaterial.js';
import ClassModel from './Class.js';
import Enrollment from './Enrollment.js';
import Quiz from './Quiz.js';
import ClassQuiz from './ClassQuiz.js';
import Question from './Question.js';
import QuestionOption from './QuestionOption.js';
import QuizAttempt from './QuizAttempt.js';
import QuizAttemptAnswer from './QuizAttemptAnswer.js';
import Assignment from './Assignment.js';
import ClassAssignment from './ClassAssignment.js';
import AssignmentSubmission from './AssignmentSubmission.js';
import LessonProgress from './LessonProgress.js';

// ==========================================
// 🔗 THIẾT LẬP CÁC MỐI QUAN HỆ (ASSOCIATIONS)
// ==========================================

// 1. Users & Tokens
User.hasMany(UserToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserToken.belongsTo(User, { foreignKey: 'user_id' });

// 2. Users & Courses (Owner & Approver)
User.hasMany(Course, { foreignKey: 'owner_id', as: 'owned_courses' });
Course.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

User.hasMany(Course, { foreignKey: 'approved_by', as: 'approved_courses' });
Course.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// 3. Courses, Chapters & Lessons
Course.hasMany(Chapter, { foreignKey: 'course_id', onDelete: 'CASCADE' });
Chapter.belongsTo(Course, { foreignKey: 'course_id' });

Chapter.hasMany(Lesson, { foreignKey: 'chapter_id', onDelete: 'CASCADE' });
Lesson.belongsTo(Chapter, { foreignKey: 'chapter_id' });

// 4. Lessons & Materials
Lesson.hasMany(CourseMaterial, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
CourseMaterial.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// 5. Classes, Courses & Teachers
Course.hasMany(ClassModel, { foreignKey: 'course_id' });
ClassModel.belongsTo(Course, { foreignKey: 'course_id' });

User.hasMany(ClassModel, { foreignKey: 'teacher_id', as: 'taught_classes' });
ClassModel.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// 6. Enrollments
ClassModel.hasMany(Enrollment, { foreignKey: 'class_id', onDelete: 'CASCADE' });
Enrollment.belongsTo(ClassModel, { foreignKey: 'class_id' });

User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// 7. Quizzes & Lessons
Lesson.hasOne(Quiz, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
Quiz.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// 8. ClassQuizzes
ClassModel.hasMany(ClassQuiz, { foreignKey: 'class_id', onDelete: 'CASCADE' });
ClassQuiz.belongsTo(ClassModel, { foreignKey: 'class_id' });

Quiz.hasMany(ClassQuiz, { foreignKey: 'quiz_id', onDelete: 'CASCADE' });
ClassQuiz.belongsTo(Quiz, { foreignKey: 'quiz_id' });

// 9. Questions & Options
Quiz.hasMany(Question, { foreignKey: 'quiz_id', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

Question.hasMany(QuestionOption, { foreignKey: 'question_id', onDelete: 'CASCADE' });
QuestionOption.belongsTo(Question, { foreignKey: 'question_id' });

// 10. Quiz Attempts & Answers
ClassQuiz.hasMany(QuizAttempt, { foreignKey: 'class_quiz_id', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(ClassQuiz, { foreignKey: 'class_quiz_id' });

User.hasMany(QuizAttempt, { foreignKey: 'student_id' });
QuizAttempt.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

QuizAttempt.hasMany(QuizAttemptAnswer, { foreignKey: 'attempt_id', onDelete: 'CASCADE' });
QuizAttemptAnswer.belongsTo(QuizAttempt, { foreignKey: 'attempt_id' });

Question.hasMany(QuizAttemptAnswer, { foreignKey: 'question_id' });
QuizAttemptAnswer.belongsTo(Question, { foreignKey: 'question_id' });

QuestionOption.hasMany(QuizAttemptAnswer, { foreignKey: 'selected_option_id' });
QuizAttemptAnswer.belongsTo(QuestionOption, { foreignKey: 'selected_option_id' });

// 11. Assignments & Lessons
Lesson.hasOne(Assignment, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
Assignment.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// 12. ClassAssignments
ClassModel.hasMany(ClassAssignment, { foreignKey: 'class_id', onDelete: 'CASCADE' });
ClassAssignment.belongsTo(ClassModel, { foreignKey: 'class_id' });

Assignment.hasMany(ClassAssignment, { foreignKey: 'assignment_id', onDelete: 'CASCADE' });
ClassAssignment.belongsTo(Assignment, { foreignKey: 'assignment_id' });

// 13. Assignment Submissions
ClassAssignment.hasMany(AssignmentSubmission, { foreignKey: 'class_assignment_id', onDelete: 'CASCADE' });
AssignmentSubmission.belongsTo(ClassAssignment, { foreignKey: 'class_assignment_id' });

User.hasMany(AssignmentSubmission, { foreignKey: 'student_id' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

User.hasMany(AssignmentSubmission, { foreignKey: 'graded_by', as: 'graded_submissions' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });

// 14. LessonProgress
ClassModel.hasMany(LessonProgress, { foreignKey: 'class_id', onDelete: 'CASCADE' });
LessonProgress.belongsTo(ClassModel, { foreignKey: 'class_id' });

User.hasMany(LessonProgress, { foreignKey: 'student_id' });
LessonProgress.belongsTo(User, { foreignKey: 'student_id' });

Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// ==========================================
// 📦 EXPORTS
// ==========================================
export {
  sequelize,
  User,
  UserToken,
  Course,
  Chapter,
  Lesson,
  CourseMaterial,
  ClassModel,
  Enrollment,
  Quiz,
  ClassQuiz,
  Question,
  QuestionOption,
  QuizAttempt,
  QuizAttemptAnswer,
  Assignment,
  ClassAssignment,
  AssignmentSubmission,
  LessonProgress
};

export default {
  sequelize,
  User,
  UserToken,
  Course,
  Chapter,
  Lesson,
  CourseMaterial,
  ClassModel,
  Enrollment,
  Quiz,
  ClassQuiz,
  Question,
  QuestionOption,
  QuizAttempt,
  QuizAttemptAnswer,
  Assignment,
  ClassAssignment,
  AssignmentSubmission,
  LessonProgress
};
