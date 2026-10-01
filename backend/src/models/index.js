import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'training_manager', 'admin'),
    allowNull: false,
    defaultValue: 'student'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  block_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  must_change_password: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['role'] }
  ]
});

export const UserToken = sequelize.define('user_tokens', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  token_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
  indexes: [
    { fields: ['token_hash', 'token_type', 'is_used'] }
  ]
});

export const Course = sequelize.define('courses', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'draft'
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['owner_id'] },
    { fields: ['status'] }
  ]
});

export const Chapter = sequelize.define('chapters', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['course_id', 'order_index'] }
  ]
});

export const Lesson = sequelize.define('lessons', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  chapter_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  lesson_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'theory'
  },
  content_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  video_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['chapter_id', 'order_index'] }
  ]
});

export const CourseMaterial = sequelize.define('course_materials', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export const ClassModel = sequelize.define('classes', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  course_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  teacher_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  class_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['teacher_id'] },
    { fields: ['course_id'] }
  ]
});

export const Enrollment = sequelize.define('enrollments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  enrolled_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  paranoid: true,
  updatedAt: false,
  createdAt: 'created_at',
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['student_id'] }
  ]
});

export const Quiz = sequelize.define('quizzes', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 15
  },
  max_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  pass_score: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 5.00
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  show_answers_after_submit: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

export const ClassQuiz = sequelize.define('class_quizzes', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  open_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  close_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_id', 'quiz_id'] }
  ]
});

export const Question = sequelize.define('questions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  question_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'multiple_choice'
  },
  points: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    defaultValue: 1.00
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: false
});

export const QuestionOption = sequelize.define('question_options', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  question_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  option_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: false
});

export const QuizAttempt = sequelize.define('quiz_attempts', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  score: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'in_progress'
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_quiz_id', 'student_id', 'attempt_number'] }
  ]
});

export const QuizAttemptAnswer = sequelize.define('quiz_attempt_answers', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  attempt_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  question_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  selected_option_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['attempt_id', 'question_id'] }
  ]
});

export const Assignment = sequelize.define('assignments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  instruction: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  allowed_file_types: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'pdf,zip,docx'
  },
  max_file_size_mb: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 25
  }
}, {
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at'
});

export const ClassAssignment = sequelize.define('class_assignments', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  assignment_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  open_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  allow_late_submission: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  cutoff_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_id', 'assignment_id'] }
  ]
});

export const AssignmentSubmission = sequelize.define('assignment_submissions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_assignment_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  student_note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'submitted'
  },
  grade: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  graded_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  graded_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_assignment_id', 'student_id'] }
  ]
});

export const LessonProgress = sequelize.define('lesson_progress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  class_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  student_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  lesson_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  is_completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  indexes: [
    { unique: true, fields: ['class_id', 'student_id', 'lesson_id'] }
  ]
});

// Associations Setup
// Users & Tokens
User.hasMany(UserToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserToken.belongsTo(User, { foreignKey: 'user_id' });

// Courses & Owner
User.hasMany(Course, { foreignKey: 'owner_id', as: 'owned_courses' });
Course.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

User.hasMany(Course, { foreignKey: 'approved_by', as: 'approved_courses' });
Course.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Courses & Chapters & Lessons
Course.hasMany(Chapter, { foreignKey: 'course_id', onDelete: 'CASCADE' });
Chapter.belongsTo(Course, { foreignKey: 'course_id' });

Chapter.hasMany(Lesson, { foreignKey: 'chapter_id', onDelete: 'CASCADE' });
Lesson.belongsTo(Chapter, { foreignKey: 'chapter_id' });

// Lessons & Materials
Lesson.hasMany(CourseMaterial, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
CourseMaterial.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// Classes & Courses & Teachers
Course.hasMany(ClassModel, { foreignKey: 'course_id' });
ClassModel.belongsTo(Course, { foreignKey: 'course_id' });

User.hasMany(ClassModel, { foreignKey: 'teacher_id', as: 'taught_classes' });
ClassModel.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// Enrollments
ClassModel.hasMany(Enrollment, { foreignKey: 'class_id', onDelete: 'CASCADE' });
Enrollment.belongsTo(ClassModel, { foreignKey: 'class_id' });

User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Quizzes & Lessons
Lesson.hasOne(Quiz, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
Quiz.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// ClassQuizzes
ClassModel.hasMany(ClassQuiz, { foreignKey: 'class_id', onDelete: 'CASCADE' });
ClassQuiz.belongsTo(ClassModel, { foreignKey: 'class_id' });

Quiz.hasMany(ClassQuiz, { foreignKey: 'quiz_id', onDelete: 'CASCADE' });
ClassQuiz.belongsTo(Quiz, { foreignKey: 'quiz_id' });

// Questions & Options
Quiz.hasMany(Question, { foreignKey: 'quiz_id', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

Question.hasMany(QuestionOption, { foreignKey: 'question_id', onDelete: 'CASCADE' });
QuestionOption.belongsTo(Question, { foreignKey: 'question_id' });

// Quiz Attempts & Answers
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

// Assignments & Lessons
Lesson.hasOne(Assignment, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
Assignment.belongsTo(Lesson, { foreignKey: 'lesson_id' });

// ClassAssignments
ClassModel.hasMany(ClassAssignment, { foreignKey: 'class_id', onDelete: 'CASCADE' });
ClassAssignment.belongsTo(ClassModel, { foreignKey: 'class_id' });

Assignment.hasMany(ClassAssignment, { foreignKey: 'assignment_id', onDelete: 'CASCADE' });
ClassAssignment.belongsTo(Assignment, { foreignKey: 'assignment_id' });

// Assignment Submissions
ClassAssignment.hasMany(AssignmentSubmission, { foreignKey: 'class_assignment_id', onDelete: 'CASCADE' });
AssignmentSubmission.belongsTo(ClassAssignment, { foreignKey: 'class_assignment_id' });

User.hasMany(AssignmentSubmission, { foreignKey: 'student_id' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

User.hasMany(AssignmentSubmission, { foreignKey: 'graded_by', as: 'graded_submissions' });
AssignmentSubmission.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });

// LessonProgress
ClassModel.hasMany(LessonProgress, { foreignKey: 'class_id', onDelete: 'CASCADE' });
LessonProgress.belongsTo(ClassModel, { foreignKey: 'class_id' });

User.hasMany(LessonProgress, { foreignKey: 'student_id' });
LessonProgress.belongsTo(User, { foreignKey: 'student_id' });

Lesson.hasMany(LessonProgress, { foreignKey: 'lesson_id', onDelete: 'CASCADE' });
LessonProgress.belongsTo(Lesson, { foreignKey: 'lesson_id' });

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
