const img = (id) => `https://images.unsplash.com/${id}?w=800&auto=format&fit=crop&q=80`;

export const categories = [
  { id: 'all', label: 'Tất cả' },
  { id: 'english', label: 'Tiếng Anh' },
  { id: 'math', label: 'Toán học' },
  { id: 'literature', label: 'Ngữ văn' },
  { id: 'exam', label: 'Luyện thi' },
];

export const courses = [
  { id: 'ielts-master-7', slug: 'ielts-master-7', thumbnail: img('photo-1516321318423-f06f85e504b3'), badge: 'Bestseller', badgeType: 'rose', lessonCount: '68 bài giảng', rating: '4.9', reviewCount: '1.450', title: 'IELTS Master 7.0+ Toàn diện 4 Kỹ Năng', instructor: 'Đội ngũ Cựu Examiner', price: '1.490.000đ', originalPrice: '2.800.000đ', category: 'english', priceValue: 1490000 },
  { id: 'toan-12-9plus', slug: 'toan-12-9plus', thumbnail: img('photo-1434030216411-0b793f4b4173'), badge: 'Mới', badgeType: 'emerald', lessonCount: '82 bài giảng', rating: '4.8', reviewCount: '980', title: 'Toán 12 Bứt phá 9+ THPT Quốc gia', instructor: 'Thầy Nguyễn Minh Hải', price: '990.000đ', originalPrice: '1.800.000đ', category: 'math', priceValue: 990000 },
  { id: 'van-12-chuyen-de', slug: 'van-12-chuyen-de', thumbnail: img('photo-1455390582262-044cdead277a'), badge: 'Hot', badgeType: 'amber', lessonCount: '45 bài giảng', rating: '4.7', reviewCount: '640', title: 'Ngữ văn 12 Chuyên đề Nghị luận', instructor: 'Cô Lê Thu Hà', price: '790.000đ', originalPrice: '1.400.000đ', category: 'literature', priceValue: 790000 },
  { id: 'toeic-750', slug: 'toeic-750', thumbnail: img('photo-1522202176988-66273c2fd55f'), badge: 'Bestseller', badgeType: 'brand', lessonCount: '56 bài giảng', rating: '4.8', reviewCount: '1.120', title: 'TOEIC 750+ Listening & Reading', instructor: 'Cô Trần Mai Anh', price: '1.190.000đ', originalPrice: '2.200.000đ', category: 'english', priceValue: 1190000 },
  { id: 'dgnl-hn', slug: 'dgnl-hn', thumbnail: img('photo-1503676260728-1c00da094a0b'), badge: 'Mới', badgeType: 'emerald', lessonCount: '40 bài giảng', rating: '4.6', reviewCount: '410', title: 'Luyện đề Đánh giá năng lực ĐHQG Hà Nội', instructor: 'Nhóm giảng viên ĐHQG', price: '0đ', originalPrice: '', category: 'exam', priceValue: 0 },
  { id: 'toan-11-nen-tang', slug: 'toan-11-nen-tang', thumbnail: img('photo-1509228468518-180dd4864904'), badge: '', badgeType: 'brand', lessonCount: '60 bài giảng', rating: '4.7', reviewCount: '520', title: 'Toán 11 Nền tảng vững chắc', instructor: 'Thầy Phạm Quốc Bảo', price: '690.000đ', originalPrice: '1.200.000đ', category: 'math', priceValue: 690000 },
];

export const findCourse = (slug) => courses.find((c) => c.slug === slug);
