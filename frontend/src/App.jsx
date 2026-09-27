import { useState } from 'react';

const categories = [
  { id: 'it', icon: '</>', title: 'Lập trình & CNTT', description: 'Web Fullstack, Mobile App, Cloud Computing, DevOps & Kiến trúc hệ thống.', tone: 'blue' },
  { id: 'ai', icon: '▣', title: 'Trí tuệ Nhân tạo & Data', description: 'Machine Learning, Deep Learning, Generative AI, Phân tích dữ liệu & Big Data.', tone: 'indigo' },
  { id: 'business', icon: '◉', title: 'Kinh doanh & Quản trị', description: 'Marketing số, Tài chính, Thương mại điện tử, Quản trị vận hành & Logistics.', tone: 'green' },
  { id: 'design', icon: '◈', title: 'Kỹ thuật & Thiết kế', description: 'UI/UX Design, Đồ họa 3D, IoT & Hệ thống nhúng, Kỹ thuật vi điện tử.', tone: 'amber' },
  { id: 'language', icon: '文', title: 'Ngoại ngữ Chuyên ngành', description: 'Tiếng Anh CNTT, Business English, Tiếng Nhật & Hàn kỹ thuật.', tone: 'purple' },
];

const learningFeatures = [
  { icon: '▤', title: 'Khóa học có lộ trình rõ ràng', text: 'Nội dung sắp xếp theo khóa học, chương và bài học để dễ dàng theo dõi hành trình.' },
  { icon: '✓', title: 'Quiz chấm điểm tự động', text: 'Làm bài trắc nghiệm và đúng/sai, nhận kết quả ngay sau khi hoàn thành.' },
  { icon: '⇧', title: 'Nộp bài, nhận phản hồi', text: 'Tải bài tập lên lớp học và xem điểm số cùng nhận xét từ giảng viên.' },
  { icon: '◔', title: 'Theo dõi tiến độ học tập', text: 'Đánh dấu bài học đã hoàn thành và chủ động xem tiến độ khóa học của bạn.' },
];

const courses = [
  {
    category: 'LẬP TRÌNH & CNTT',
    title: 'Lập trình Web Fullstack Hiện đại (Node.js, React & Docker)',
    instructor: 'ThS. Nguyễn Văn A',
    image: '/images/course-fullstack.jpg',
    tone: 'blue',
  },
  {
    category: 'TRÍ TUỆ NHÂN TẠO',
    title: 'Nhập môn Machine Learning & Ứng dụng Generative AI',
    instructor: 'TS. Lê Minh Đức',
    image: '/images/course-machine-learning.jpg',
    tone: 'indigo',
  },
  {
    category: 'KINH DOANH & QUẢN TRỊ',
    title: 'Phân tích Dữ liệu Kinh doanh với SQL & Power BI',
    instructor: 'Chuyên gia Trần Thị Mai',
    image: '/images/course-data.jpg',
    tone: 'green',
  },
  {
    category: 'THIẾT KẾ & KỸ THUẬT',
    title: 'Thiết kế Sản phẩm Số & UI/UX Design System Thực chiến',
    instructor: 'Lead Designer Sarah Jenkins',
    image: '/images/course-design.jpg',
    tone: 'amber',
  },
];

const valueProps = [
  { icon: '⌂', tone: 'blue', title: 'Lớp học gắn kết khóa học', text: 'Học viên ghi danh bằng mã lớp, theo dõi thông tin lớp và tài liệu học tập tại một nơi.' },
  { icon: '✓', tone: 'sky', title: 'Kiểm tra minh bạch, tức thì', text: 'Bài trắc nghiệm và câu hỏi đúng/sai được hệ thống chấm tự động sau khi nộp.' },
  { icon: '⇧', tone: 'amber', title: 'Bài tập có giảng viên phản hồi', text: 'Nộp bài bằng tệp, nhận điểm và nhận xét trực tiếp từ giảng viên phụ trách.' },
  { icon: '◔', tone: 'green', title: 'Tiến độ học do bạn làm chủ', text: 'Tự đánh dấu bài học hoàn thành và xem phần trăm tiến độ của khóa học.' },
];

function ArrowIcon({ className = '' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CategoryDropdown() {
  return (
    <details className="category-dropdown">
      <summary>Chuyên ngành đào tạo <span aria-hidden="true">⌄</span></summary>
      <div className="dropdown-panel">
        {categories.map((category) => (
          <a className="dropdown-link" href="#categories" key={category.id}>
            <span className={`dropdown-icon ${category.tone}`}>{category.icon}</span>
            <span><strong>{category.title}</strong><small>{category.description}</small></span>
          </a>
        ))}
      </div>
    </details>
  );
}

function App() {
  const [activeFilter, setActiveFilter] = useState('Tất cả môn học');
  const [menuOpen, setMenuOpen] = useState(false);
  const filterOptions = ['Tất cả môn học', 'Lập trình & CNTT', 'Trí tuệ Nhân tạo', 'Kinh doanh & Quản trị', 'Thiết kế & Kỹ thuật'];
  const visibleCourses = activeFilter === 'Tất cả môn học'
    ? courses
    : courses.filter((course) => course.category.toLowerCase().includes(activeFilter === 'Trí tuệ Nhân tạo' ? 'trí tuệ nhân tạo' : activeFilter.toLowerCase()));

  return (
    <div className="site-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <a className="brand" href="#" aria-label="EduVerse - Trang chủ">
            <span className="brand-mark"><span>e</span>v</span>
            <span>edu<span className="brand-accent">verse</span></span>
          </a>
          <nav className={`nav-links${menuOpen ? ' nav-open' : ''}`} aria-label="Điều hướng chính">
            <CategoryDropdown />
            <a href="#courses">Khóa học trực tuyến</a>
            <a href="#learning-tools">Trải nghiệm học tập</a>
            <a href="#values">Lớp học & bài tập</a>
            <a href="#activate-class">Kích hoạt mã lớp</a>
          </nav>
          <div className="nav-actions">
            <a className="login-link" href="#login">Đăng nhập</a>
            <a className="register-button" href="#register">Đăng ký</a>
          </div>
          <button className="menu-button" type="button" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-pattern" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="hero-tag"><span>✦</span> Nền tảng học tập đa ngành thế hệ mới</div>
              <h1 id="hero-heading">NỀN TẢNG HỌC TẬP<br />ĐA NGÀNH <span>THÔNG MINH</span></h1>
              <p className="hero-description">Khám phá <strong>500+ khóa học</strong> đa ngành, học cùng giảng viên và phát triển kiến thức qua lớp học trực tuyến.</p>
              <ul className="hero-highlights">
                <li><span className="bullet" /><span><strong>Kho khóa học đa ngành:</strong> Công nghệ thông tin, Trí tuệ nhân tạo, Khoa học dữ liệu, Kinh doanh, Kỹ thuật...</span></li>
                <li><span className="bullet" /><span><strong>Lớp học trực tuyến:</strong> Ghi danh bằng mã lớp, truy cập chương trình và tài liệu học tập.</span></li>
                <li><span className="bullet" /><span><strong>Kiểm tra kiến thức:</strong> Bài trắc nghiệm và đúng/sai được hệ thống chấm tự động.</span></li>
                <li><span className="bullet" /><span><strong>Thực hành và tiến bộ:</strong> Nộp bài tập, nhận nhận xét và theo dõi tiến độ học tập.</span></li>
              </ul>
              <div className="hero-actions">
                <a className="button button-primary" href="#courses">Khám phá khóa học ngay <ArrowIcon /></a>
                <a className="button button-secondary" href="#learning-tools">Tìm hiểu thêm</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-frame">
                <img src="/images/hero-learning.jpg" alt="Sinh viên học tập tại không gian EduVerse" />
                <div className="image-shade" />
                <div className="image-caption"><span>EDUVERSE ACADEMIC HUB</span><strong>Không gian học tập cho hành trình đa ngành</strong></div>
              </div>
              <div className="hero-badge badge-courses"><strong>500+</strong><span>KHÓA HỌC<br />ĐA NGÀNH</span></div>
              <div className="hero-badge badge-students"><strong>1M+</strong><span>HỌC VIÊN</span></div>
            </div>
          </div>
        </section>

        <section className="section categories-section" id="categories">
          <div className="section-heading category-heading">
            <div><span className="section-kicker">CHƯƠNG TRÌNH ĐÀO TẠO TRỌNG TÂM</span><h2>Danh mục ngành học mũi nhọn</h2></div>
            <p>Bao quát từ công nghệ lõi, khoa học dữ liệu tới khối kinh tế và thiết kế.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <a className="category-card" href="#courses" key={category.id}>
                <span className={`category-icon ${category.tone}`}>{category.icon}</span>
                <strong>{category.title}</strong>
                <span className="category-description">{category.description}</span>
                <span className="category-footer"><span>Khám phá khóa học</span><span aria-hidden="true">→</span></span>
              </a>
            ))}
          </div>
        </section>

        <section className="section learning-tools" id="learning-tools">
          <div className="section-heading">
            <div><span className="section-kicker">CÔNG CỤ HỌC TẬP TRỰC TUYẾN</span><h2>Học tập, thực hành và<br />theo dõi tiến độ</h2></div>
            <p>Một hành trình liền mạch từ bài học đầu tiên đến khi hoàn thành khóa học.</p>
          </div>
          <div className="feature-grid">
            {learningFeatures.map((feature, index) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-top"><span className="feature-icon">{feature.icon}</span><span className="feature-index">0{index + 1}</span></div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
          <div className="class-code-banner" id="activate-class">
            <span className="class-code-icon">⌂</span>
            <span className="class-code-copy"><strong>Bạn đã có mã lớp?</strong><small>Đăng nhập để ghi danh vào lớp học cùng giảng viên.</small></span>
            <a href="#login">Kích hoạt mã lớp <ArrowIcon /></a>
          </div>
        </section>

        <section className="section courses-section" id="courses">
          <div className="section-heading courses-heading">
            <div><span className="section-kicker">KHÓA HỌC THEO CHỦ ĐỀ</span><h2>Khóa học nổi bật đa ngành</h2></div>
            <a className="all-courses-link" href="#categories">Khám phá danh mục <ArrowIcon /></a>
          </div>
          <div className="course-filters" role="group" aria-label="Lọc khóa học">
            {filterOptions.map((filter) => (
              <button className={`filter-button${activeFilter === filter ? ' active' : ''}`} key={filter} onClick={() => setActiveFilter(filter)} type="button" aria-pressed={activeFilter === filter}>{filter}</button>
            ))}
          </div>
          <div className="course-grid">
            {visibleCourses.map((course) => (
              <article className="course-card" key={course.title}>
                <div className="course-image-wrap">
                  <img src={course.image} alt="" className="course-image" loading="lazy" />
                  <span className={`course-label ${course.tone}`}>{course.category}</span>
                  <span className="course-free">Miễn phí</span>
                </div>
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <p>Giảng viên: {course.instructor}</p>
                  <div className="course-card-footer"><span>Khóa học trực tuyến</span><a href="#login" aria-label={`Xem khóa học: ${course.title}`}>Xem chi tiết <span aria-hidden="true">→</span></a></div>
                </div>
              </article>
            ))}
          </div>
          <div className="course-more"><a href="#categories">Xem các khóa học theo ngành <ArrowIcon /></a></div>
        </section>

        <section className="section values-section" id="values">
          <div className="values-heading"><span className="section-kicker">TRẢI NGHIỆM HỌC TẬP EDUVERSE</span><h2>Học tập có định hướng.<br />Tiến bộ qua từng chặng.</h2><p>Những công cụ thiết thực đồng hành cùng học viên và giảng viên trong từng khóa học.</p></div>
          <div className="values-grid">
            {valueProps.map((value) => (
              <article className="value-card" key={value.title}>
                <span className={`value-icon ${value.tone}`}>{value.icon}</span>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="#" aria-label="EduVerse - Trang chủ"><span className="brand-mark"><span>e</span>v</span><span>edu<span className="brand-accent">verse</span></span></a>
            <p>Nền tảng học tập trực tuyến đa ngành, đồng hành cùng người học trên hành trình phát triển tri thức và kỹ năng.</p>
            <span className="footer-contact">Kết nối hành trình học tập của bạn cùng EduVerse.</span>
          </div>
          <div><h3>Chuyên ngành đào tạo</h3><a href="#categories">Lập trình & CNTT</a><a href="#categories">Trí tuệ Nhân tạo & Data</a><a href="#categories">Kinh doanh & Quản trị</a><a href="#categories">Kỹ thuật & Thiết kế</a><a href="#categories">Ngoại ngữ Chuyên ngành</a></div>
          <div><h3>Học tập trực tuyến</h3><a href="#courses">Khám phá khóa học</a><a href="#learning-tools">Chương trình và bài học</a><a href="#learning-tools">Bài kiểm tra</a><a href="#learning-tools">Bài tập và nhận xét</a><a href="#activate-class">Tham gia lớp học</a></div>
          <div><h3>Về EduVerse</h3><a href="#values">Giới thiệu nền tảng</a><a href="#values">Dành cho học viên</a><a href="#values">Dành cho giảng viên</a><a href="#support">Trợ giúp</a><a href="#terms">Điều khoản & bảo mật</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 EduVerse. Nền tảng học tập trực tuyến.</span><span>Học tập để tiến xa hơn.</span></div>
      </footer>
    </div>
  );
}

export default App;
