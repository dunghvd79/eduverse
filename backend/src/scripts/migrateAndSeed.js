import bcrypt from 'bcryptjs';
import models from '../models/index.js';

const {
  sequelize,
  User,
  Course,
  Chapter,
  Lesson,
  ClassModel,
  Enrollment,
  Quiz,
  ClassQuiz,
  Question,
  QuestionOption,
  Assignment,
  ClassAssignment
} = models;

async function runMigrateAndSeed() {
  console.log('🚀 Bắt đầu quá trình Đồng bộ 19 Bảng CSDL lên Neon.tech (AWS Singapore)...');

  try {
    // 1. Sync models to database (Create/Alter tables)
    await sequelize.sync({ alter: true });
    console.log('✅ Đã tạo thành công toàn bộ 19 bảng dữ liệu quan hệ trên Neon.tech!');

    // 2. Hash default password
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('EduVerse@2026', salt);

    // 3. Seed Users
    console.log('🌱 Đang nạp dữ liệu người dùng mẫu (Seed Users)...');
    const usersData = [
      {
        email: 'admin@eduverse.com',
        full_name: 'Quản Trị Viên Hệ Thống',
        password_hash: defaultPasswordHash,
        role: 'admin',
        is_active: true,
        email_verified: true
      },
      {
        email: 'manager@eduverse.com',
        full_name: 'Hoàng Minh Quản Lý',
        password_hash: defaultPasswordHash,
        role: 'training_manager',
        is_active: true,
        email_verified: true
      },
      {
        email: 'teacher.an@eduverse.com',
        full_name: 'ThS. Nguyễn Văn An',
        password_hash: defaultPasswordHash,
        role: 'teacher',
        is_active: true,
        email_verified: true
      },
      {
        email: 'teacher.binh@eduverse.com',
        full_name: 'TS. Trần Thị Bình',
        password_hash: defaultPasswordHash,
        role: 'teacher',
        is_active: true,
        email_verified: true
      },
      {
        email: 'student.dung@eduverse.com',
        full_name: 'Hoàng Văn Dũng',
        password_hash: defaultPasswordHash,
        role: 'student',
        is_active: true,
        email_verified: true
      },
      {
        email: 'student.hoa@eduverse.com',
        full_name: 'Lê Thị Hoa',
        password_hash: defaultPasswordHash,
        role: 'student',
        is_active: true,
        email_verified: true
      },
      {
        email: 'student.nam@eduverse.com',
        full_name: 'Phạm Văn Nam',
        password_hash: defaultPasswordHash,
        role: 'student',
        is_active: true,
        email_verified: true
      }
    ];

    const usersMap = {};
    for (const u of usersData) {
      const [userRecord] = await User.findOrCreate({
        where: { email: u.email },
        defaults: u
      });
      usersMap[u.email] = userRecord;
    }
    console.log(`✅ Đã nạp ${Object.keys(usersMap).length} tài khoản người dùng mặc định!`);

    // 4. Seed Course
    console.log('🌱 Đang nạp Khóa học mẫu...');
    const teacherAn = usersMap['teacher.an@eduverse.com'];
    const manager = usersMap['manager@eduverse.com'];

    const [sampleCourse] = await Course.findOrCreate({
      where: { slug: 'lap-trinh-web-nodejs-express-react' },
      defaults: {
        owner_id: teacherAn.id,
        title: 'Lập trình Ứng dụng Web Hiện đại với Node.js, Express và React',
        slug: 'lap-trinh-web-nodejs-express-react',
        description: 'Khóa học toàn diện trang bị kỹ năng xây dựng hệ thống web chuẩn doanh nghiệp từ Backend Express.js (Node.js ES Modules, Sequelize ORM, PostgreSQL) đến Frontend React (Vite, Tailwind CSS, TanStack Query).',
        price: 0.00,
        status: 'published',
        approved_by: manager.id,
        approved_at: new Date()
      }
    });

    // 5. Seed Chapters & Lessons
    console.log('🌱 Đang nạp Chương & Bài học mẫu...');
    const [chapter1] = await Chapter.findOrCreate({
      where: { course_id: sampleCourse.id, order_index: 1 },
      defaults: {
        course_id: sampleCourse.id,
        title: 'Chương 1: Kiến trúc Backend & Express.js Căn bản',
        order_index: 1
      }
    });

    const [lesson1_1] = await Lesson.findOrCreate({
      where: { chapter_id: chapter1.id, order_index: 1 },
      defaults: {
        chapter_id: chapter1.id,
        title: 'Bài 1.1: Tổng quan Express.js & Kiến trúc Layered',
        lesson_type: 'theory',
        content_text: 'Tìm hiểu tổng quan về Express.js, cách phân tách Controllers, Services, Models chuẩn nghiệp vụ.',
        order_index: 1
      }
    });

    const [lesson1_2] = await Lesson.findOrCreate({
      where: { chapter_id: chapter1.id, order_index: 2 },
      defaults: {
        chapter_id: chapter1.id,
        title: 'Bài 1.2: Tích hợp PostgreSQL và Sequelize ORM',
        lesson_type: 'video',
        video_url: 'https://example.com/videos/lesson1-2.mp4',
        content_text: 'Hướng dẫn cấu hình kết nối PostgreSQL SSL trên Cloud và định nghĩa Models.',
        order_index: 2
      }
    });

    const [lesson1_3] = await Lesson.findOrCreate({
      where: { chapter_id: chapter1.id, order_index: 3 },
      defaults: {
        chapter_id: chapter1.id,
        title: 'Bài 1.3: Trắc nghiệm kiểm tra kiến thức Express.js',
        lesson_type: 'quiz',
        order_index: 3
      }
    });

    // 6. Seed Quiz & Questions
    console.log('🌱 Đang nạp Đề thi trắc nghiệm mẫu...');
    const [quiz1] = await Quiz.findOrCreate({
      where: { lesson_id: lesson1_3.id },
      defaults: {
        lesson_id: lesson1_3.id,
        title: 'Kiểm tra kiến thức Node.js & Express.js',
        description: 'Bài kiểm tra trắc nghiệm 15 phút, 2 câu hỏi mẫu.',
        duration_minutes: 15,
        max_attempts: 3,
        pass_score: 5.00,
        is_published: true,
        show_answers_after_submit: true
      }
    });

    // Question 1
    const [q1] = await Question.findOrCreate({
      where: { quiz_id: quiz1.id, order_index: 1 },
      defaults: {
        quiz_id: quiz1.id,
        prompt: 'Thư viện nào sau đây dùng để thiết lập HTTP Security Headers trong Express.js?',
        question_type: 'single_choice',
        points: 5.00,
        explanation: 'Helmet giúp bảo mật Express app bằng cách thiết lập các HTTP headers phù hợp.',
        order_index: 1
      }
    });

    await QuestionOption.findOrCreate({
      where: { question_id: q1.id, order_index: 0 },
      defaults: { question_id: q1.id, option_text: 'cors', is_correct: false, order_index: 0 }
    });
    await QuestionOption.findOrCreate({
      where: { question_id: q1.id, order_index: 1 },
      defaults: { question_id: q1.id, option_text: 'helmet', is_correct: true, order_index: 1 }
    });
    await QuestionOption.findOrCreate({
      where: { question_id: q1.id, order_index: 2 },
      defaults: { question_id: q1.id, option_text: 'morgan', is_correct: false, order_index: 2 }
    });
    await QuestionOption.findOrCreate({
      where: { question_id: q1.id, order_index: 3 },
      defaults: { question_id: q1.id, option_text: 'dotenv', is_correct: false, order_index: 3 }
    });

    // Question 2
    const [q2] = await Question.findOrCreate({
      where: { quiz_id: quiz1.id, order_index: 2 },
      defaults: {
        quiz_id: quiz1.id,
        prompt: 'Trong Sequelize ORM, tùy chọn nào dùng để bật xóa mềm (Soft Delete)?',
        question_type: 'single_choice',
        points: 5.00,
        explanation: 'Tùy chọn paranoid: true sẽ kích hoạt cột deletedAt thay vì xóa vĩnh viễn dòng dữ liệu.',
        order_index: 2
      }
    });

    await QuestionOption.findOrCreate({
      where: { question_id: q2.id, order_index: 0 },
      defaults: { question_id: q2.id, option_text: 'softDelete: true', is_correct: false, order_index: 0 }
    });
    await QuestionOption.findOrCreate({
      where: { question_id: q2.id, order_index: 1 },
      defaults: { question_id: q2.id, option_text: 'paranoid: true', is_correct: true, order_index: 1 }
    });
    await QuestionOption.findOrCreate({
      where: { question_id: q2.id, order_index: 2 },
      defaults: { question_id: q2.id, option_text: 'timestamps: false', is_correct: false, order_index: 2 }
    });

    // 7. Seed Class Instance & Enrollments
    console.log('🌱 Đang nạp Lớp học thực tế & Ghi danh...');
    const [sampleClass] = await ClassModel.findOrCreate({
      where: { class_code: 'EDU2026A' },
      defaults: {
        course_id: sampleCourse.id,
        teacher_id: teacherAn.id,
        name: 'Lớp Đồ Án Liên Ngành — Nhóm 01 (K2026)',
        class_code: 'EDU2026A',
        start_date: '2026-09-20',
        end_date: '2026-11-30',
        status: 'active'
      }
    });

    // Link Quiz to Class
    await ClassQuiz.findOrCreate({
      where: { class_id: sampleClass.id, quiz_id: quiz1.id },
      defaults: {
        class_id: sampleClass.id,
        quiz_id: quiz1.id,
        open_time: new Date(),
        is_active: true
      }
    });

    // Enrollments for 3 students
    const studentEmails = [
      'student.dung@eduverse.com',
      'student.hoa@eduverse.com',
      'student.nam@eduverse.com'
    ];

    for (const email of studentEmails) {
      const student = usersMap[email];
      await Enrollment.findOrCreate({
        where: { class_id: sampleClass.id, student_id: student.id },
        defaults: {
          class_id: sampleClass.id,
          student_id: student.id,
          status: 'active'
        }
      });
    }

    console.log('🎉 QUÁ TRÌNH TẠO 18 BẢNG VÀ NẠP DỮ LIỆU MẪU LÊN NEON.TECH HOÀN TẤT 100%!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ hoặc nạp seed data:', error);
    process.exit(1);
  }
}

runMigrateAndSeed();
