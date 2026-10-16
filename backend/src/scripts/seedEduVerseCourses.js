import models from '../models/index.js';

const { Course, Category, User, Chapter, Lesson, sequelize } = models;

async function runSeed() {
  console.log('🚀 Bắt đầu cập nhật và seed khóa học chuẩn EduVerse...');

  try {
    // 1. Ẩn 2 khóa test cũ (chuyển sang 'draft')
    console.log('📦 1. Ẩn 2 khóa test cũ sang trạng thái draft...');
    await Course.update(
      { status: 'draft' },
      {
        where: {
          title: ['Khóa Test UI', 'Lập trình Ứng dụng Web Hiện đại với Node.js, Express và React']
        }
      }
    );
    console.log('✅ Đã chuyển 2 khóa test cũ về draft thành công!');

    // 2. Tìm hoặc tạo các Categories chuẩn cho EduVerse
    console.log('📂 2. Đồng bộ các danh mục môn học EduVerse...');
    const categoriesData = [
      { name: 'Tiếng Anh Quốc tế', slug: 'english', description: 'IELTS, TOEIC và Tiếng Anh THPT', sort_order: 1 },
      { name: 'Toán học 10-11-12', slug: 'math', description: 'Toán học THPT ma trận mới mục tiêu 9+', sort_order: 2 },
      { name: 'Ngữ văn THPT', slug: 'literature', description: 'Nghị luận văn học, nghị luận xã hội & đọc hiểu', sort_order: 3 },
      { name: 'Khoa học Tự nhiên', slug: 'science', description: 'Lý - Hóa - Sinh format trắc nghiệm 2026', sort_order: 4 },
      { name: 'Luyện thi ĐGNL & THPT QG', slug: 'exam', description: 'Đánh giá năng lực ĐHQG HN & HCM, đề thi thử', sort_order: 5 },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      const [categoryRecord] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          sort_order: cat.sort_order,
          is_active: true
        }
      });
      categoryMap[cat.slug] = categoryRecord.id;
    }
    console.log('✅ Đã đồng bộ 5 danh mục môn học!');

    // 3. Lấy giáo viên và người phê duyệt
    const teacherAn = await User.findOne({ where: { email: 'teacher.an@eduverse.com' } });
    const teacherBinh = await User.findOne({ where: { email: 'teacher.binh@eduverse.com' } });
    const teacherNhung = await User.findOne({ where: { email: 'teacher.nhung@eduverse.com' } });
    const adminUser = await User.findOne({ where: { email: 'admin@eduverse.com' } });

    const owner1 = teacherAn ? teacherAn.id : adminUser.id;
    const owner2 = teacherBinh ? teacherBinh.id : adminUser.id;
    const owner3 = teacherNhung ? teacherNhung.id : adminUser.id;
    const approverId = adminUser ? adminUser.id : null;

    // 4. Danh sách 5 khóa học chính thức chuẩn thương mại EduVerse
    console.log('📚 3. Tạo các khóa học chuẩn EduVerse...');
    const officialCourses = [
      {
        title: '[Complete IELTS 7.0+] Chiến lược làm bài 4 kỹ năng - Chữa đề - Luyện nghe với Dictation [Tặng AI Writing & Speaking]',
        slug: 'ielts-master-7',
        description: 'Khóa học IELTS toàn diện từ nền tảng 5.5 lên mục tiêu 7.5+. Tích hợp phần mềm Dictation luyện nghe chuyên sâu, ngân hàng đề thi thật Cambridge và trợ lý AI sửa bài viết & luyện phát âm.',
        thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        price: 1050000,
        owner_id: owner1,
        category_id: categoryMap['english'],
        status: 'published',
        approved_by: approverId,
        approved_at: new Date()
      },
      {
        title: '[Complete TOEIC 850+] Chiến lược bứt phá Reading & Listening - Phản xạ từ vựng Spaced Repetition',
        slug: 'toeic-intensive-850',
        description: 'Luyện thi TOEIC 2 kỹ năng nghe hiểu và đọc hiểu theo format ETS mới nhất. Ứng dụng flashcards thuật toán lặp lại ngắt quãng để ghi nhớ hơn 3.000 từ vựng kinh tế, thương mại.',
        thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80',
        price: 799000,
        owner_id: owner2,
        category_id: categoryMap['english'],
        status: 'published',
        approved_by: approverId,
        approved_at: new Date()
      },
      {
        title: '[Toán 12 Bứt Phá 9+] Tổng ôn ma trận mới 2026 - Kỹ thuật Casio & Tư duy giải nhanh trắc nghiệm đúng/sai',
        slug: 'toan-12-9plus',
        description: 'Khóa ôn luyện trọng tâm toàn bộ chương trình Toán 12: Hàm số, Tích phân, Không gian Oxyz, Xác suất thống kê bám sát 100% định dạng đề thi tốt nghiệp mới của Bộ GD&ĐT.',
        thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
        price: 890000,
        owner_id: owner1,
        category_id: categoryMap['math'],
        status: 'published',
        approved_by: approverId,
        approved_at: new Date()
      },
      {
        title: '[Ngữ văn 12 Chuyên Sâu] Kỹ năng Phân tích Ngữ liệu Ngoài SGK & Viết Nghị luận Xã hội 2026',
        slug: 'ngu-van-12-chuyen-sau',
        description: 'Phương pháp đọc hiểu và bình luận văn học hiện đại. Rèn luyện tư duy phản biện, kỹ năng viết đoạn văn 200 chữ và bài văn nghị luận xã hội bám sát format khảo thí mới nhất.',
        thumbnail_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
        price: 650000,
        owner_id: owner3,
        category_id: categoryMap['literature'],
        status: 'published',
        approved_by: approverId,
        approved_at: new Date()
      },
      {
        title: '[HSA & APT Master] Luyện thi Đánh giá Năng lực ĐHQG Hà Nội & TP.HCM - Tư duy định lượng, định tính & Khoa học',
        slug: 'luyen-thi-dgnl-hsa',
        description: 'Chinh phục kỳ thi ĐGNL ĐHQGHN (HSA) và ĐHQG-HCM (APT). Hệ thống lý thuyết trọng tâm, phương pháp tư duy định lượng, tư duy ngôn ngữ và giải quyết vấn đề khoa học tự nhiên.',
        thumbnail_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
        price: 1190000,
        owner_id: owner2,
        category_id: categoryMap['exam'],
        status: 'published',
        approved_by: approverId,
        approved_at: new Date()
      },
      {
        title: '[KHTN Vận Dụng Cao] Bộ câu hỏi trắc nghiệm Đúng/Sai & Trả lời ngắn môn Vật Lý, Hóa Học, Sinh Học',
        slug: 'khtn-chinh-phuc-diem-9',
        description: 'Tổng ôn toàn diện khối Khoa học tự nhiên bám sát ma trận thi THPT 2026. Giải quyết triệt để dạng câu hỏi thực tiễn và bài toán thí nghiệm liên môn.',
        thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
        price: 790000,
        owner_id: owner1,
        category_id: categoryMap['science'],
        status: 'published',
        approved_by: approverId,
        approved_at: new Date()
      }
    ];

    for (const item of officialCourses) {
      let course = await Course.findOne({ where: { slug: item.slug } });
      if (!course) {
        course = await Course.create(item);
        console.log(`+ Đã tạo mới khóa học: ${item.title.substring(0, 45)}...`);
      } else {
        await course.update({
          ...item,
          status: 'published'
        });
        console.log(`* Đã cập nhật khóa học: ${item.title.substring(0, 45)}...`);
      }

      // Tạo tối thiểu 1 chapter và 2 lessons mẫu cho mỗi khóa để học viên có thể học thử
      const [chapter] = await Chapter.findOrCreate({
        where: { course_id: course.id, order_index: 1 },
        defaults: {
          course_id: course.id,
          title: 'Chương 1: Tổng quan & Chiến lược chinh phục mục tiêu',
          order_index: 1
        }
      });

      await Lesson.findOrCreate({
        where: { chapter_id: chapter.id, order_index: 1 },
        defaults: {
          chapter_id: chapter.id,
          title: 'Bài 1: Giới thiệu lộ trình & Phương pháp ôn luyện hiệu quả',
          lesson_type: 'video',
          order_index: 1,
          is_free_preview: true,
          content: 'Chào mừng bạn đến với khóa học tại EduVerse! Video bài giảng hướng dẫn phương pháp học.'
        }
      });

      await Lesson.findOrCreate({
        where: { chapter_id: chapter.id, order_index: 2 },
        defaults: {
          chapter_id: chapter.id,
          title: 'Bài 2: Hướng dẫn sử dụng phòng thi thử & Công nghệ AI hỗ trợ',
          lesson_type: 'article',
          order_index: 2,
          is_free_preview: true,
          content: 'Hướng dẫn chi tiết cách làm bài kiểm tra bấm giờ, nộp bài và xem giải thích chi tiết.'
        }
      });
    }

    console.log('🎉 Hoàn thành seed toàn bộ khóa học chuẩn EduVerse lên CSDL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed:', error);
    process.exit(1);
  }
}

runSeed();
