import { useState } from 'react';

const categories = [
  { id: 'math', icon: '∑', title: 'Toán học', description: 'Đại số, hình học, giải tích và phương pháp giải bài theo từng khối lớp.', tone: 'blue' },
  { id: 'english', icon: 'A+', title: 'Tiếng Anh', description: 'Ngữ pháp, từ vựng, đọc hiểu và luyện các dạng bài theo chương trình THPT.', tone: 'indigo' },
  { id: 'literature', icon: '文', title: 'Ngữ văn', description: 'Đọc hiểu, tác phẩm văn học, tiếng Việt và kỹ năng viết bài nghị luận.', tone: 'green' },
  { id: 'history', icon: '◷', title: 'Lịch sử', description: 'Hệ thống các giai đoạn, sự kiện và kiến thức lịch sử Việt Nam, thế giới.', tone: 'amber' },
  { id: 'geography', icon: '◎', title: 'Địa lý', description: 'Địa lý tự nhiên, kinh tế - xã hội, bản đồ và kỹ năng khai thác Atlat.', tone: 'purple' },
];

const learningFeatures = [
  { icon: '▤', title: 'Khóa học có lộ trình rõ ràng', text: 'Nội dung sắp xếp theo khóa học, chương và bài học để dễ dàng theo dõi hành trình.' },
  { icon: '✓', title: 'Quiz chấm điểm tự động', text: 'Làm bài trắc nghiệm và đúng/sai, nhận kết quả ngay sau khi hoàn thành.' },
  { icon: '⇧', title: 'Nộp bài, nhận phản hồi', text: 'Tải bài tập lên lớp học và xem điểm số cùng nhận xét từ giảng viên.' },
  { icon: '◔', title: 'Theo dõi tiến độ học tập', text: 'Đánh dấu bài học đã hoàn thành và chủ động xem tiến độ khóa học của bạn.' },
];

const courses = [
  {
    category: 'Toán học',
    title: 'Toán THPT: Nắm vững kiến thức và phương pháp giải bài',
    instructor: 'Tổ Toán EduVerse',
    icon: '∑',
    tone: 'blue',
  },
  {
    category: 'Tiếng Anh',
    title: 'Tiếng Anh THPT: Ngữ pháp, từ vựng và đọc hiểu',
    instructor: 'Tổ Tiếng Anh EduVerse',
    icon: 'A+',
    tone: 'indigo',
  },
  {
    category: 'Ngữ văn',
    title: 'Ngữ văn THPT: Đọc hiểu tác phẩm và viết bài nghị luận',
    instructor: 'Tổ Ngữ văn EduVerse',
    icon: '文',
    tone: 'green',
  },
  {
    category: 'Lịch sử',
    title: 'Lịch sử Việt Nam và thế giới qua các thời kỳ',
    instructor: 'Tổ Lịch sử EduVerse',
    icon: '◷',
    tone: 'amber',
  },
  {
    category: 'Địa lý',
    title: 'Địa lý THPT: Atlat, tự nhiên và kinh tế - xã hội',
    instructor: 'Tổ Địa lý EduVerse',
    icon: '◎',
    tone: 'purple',
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
      <summary>Môn học THPT <span aria-hidden="true">⌄</span></summary>
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
  const filterOptions = ['Tất cả môn học', ...categories.map((category) => category.title)];
  const visibleCourses = activeFilter === 'Tất cả môn học'
    ? courses
    : courses.filter((course) => course.category === activeFilter);

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
            <a href="#courses">Môn học</a>
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
              <div className="hero-tag"><span>✦</span> Nền tảng học tập dành cho học sinh THPT</div>
              <h1 id="hero-heading">HỌC TỐT CÁC MÔN<br />THPT CÙNG <span>EDUVERSE</span></h1>
              <p className="hero-description">Cùng học sinh lớp 10–12 củng cố kiến thức <strong>Toán, Tiếng Anh, Ngữ văn, Lịch sử, Địa lý</strong> qua bài học và hoạt động học tập trực tuyến.</p>
              <ul className="hero-highlights">
                <li><span className="bullet" /><span><strong>Môn học phổ thông:</strong> Nội dung bám sát các môn học và chương trình THPT.</span></li>
                <li><span className="bullet" /><span><strong>Lớp học trực tuyến:</strong> Ghi danh bằng mã lớp, truy cập bài học và tài liệu học tập.</span></li>
                <li><span className="bullet" /><span><strong>Luyện tập kiến thức:</strong> Làm bài trắc nghiệm và nhận kết quả sau khi hoàn thành.</span></li>
                <li><span className="bullet" /><span><strong>Theo dõi tiến độ:</strong> Ôn tập theo từng bài học và xem quá trình học của mình.</span></li>
              </ul>
              <div className="hero-actions">
                <a className="button button-primary" href="#courses">Khám phá môn học <ArrowIcon /></a>
                <a className="button button-secondary" href="#learning-tools">Tìm hiểu thêm</a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-frame">
                <img src="/images/hero-learning.jpg" alt="Sinh viên học tập tại không gian EduVerse" />
                <div className="image-shade" />
                <div className="image-caption"><span>EDUVERSE • THPT</span><strong>Đồng hành cùng học sinh trên hành trình học tập</strong></div>
              </div>
              <div className="hero-badge badge-courses"><strong>10–12</strong><span>KHỐI<br />LỚP</span></div>
              <div className="hero-badge badge-students"><strong>5</strong><span>MÔN HỌC</span></div>
            </div>
          </div>
        </section>

        <section className="section categories-section" id="categories">
          <div className="section-heading category-heading">
            <div><span className="section-kicker">CÁC MÔN HỌC THPT</span><h2>Chọn môn học bạn quan tâm</h2></div>
            <p>Ôn tập kiến thức phổ thông theo từng môn và khối lớp 10, 11, 12.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <a className="category-card" href="#courses" key={category.id}>
                <span className={`category-icon ${category.tone}`}>{category.icon}</span>
                <strong>{category.title}</strong>
                <span className="category-description">{category.description}</span>
                <span className="category-footer"><span>Khám phá môn học</span><span aria-hidden="true">→</span></span>
              </a>
            ))}
          </div>
        </section>

        <section className="section learning-tools" id="learning-tools">
          <div className="section-heading">
            <div><span className="section-kicker">CÔNG CỤ HỌC TẬP TRỰC TUYẾN</span><h2>Học tập, luyện tập và<br />theo dõi tiến độ</h2></div>
            <p>Củng cố kiến thức từng môn qua bài học, bài luyện tập và lớp học trực tuyến.</p>
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
            <div><span className="section-kicker">NỘI DUNG HỌC TẬP THPT</span><h2>Môn học nổi bật</h2></div>
            <a className="all-courses-link" href="#categories">Xem các môn học <ArrowIcon /></a>
          </div>
          <div className="course-filters" role="group" aria-label="Lọc khóa học">
            {filterOptions.map((filter) => (
              <button className={`filter-button${activeFilter === filter ? ' active' : ''}`} key={filter} onClick={() => setActiveFilter(filter)} type="button" aria-pressed={activeFilter === filter}>{filter}</button>
            ))}
          </div>
          <div className="course-grid">
            {visibleCourses.map((course) => (
              <article className="course-card" key={course.title}>
                <div className={`course-image-wrap subject-art ${course.tone}`}>
                  <span className="course-art-icon" aria-hidden="true">{course.icon}</span>
                  <span className={`course-label ${course.tone}`}>{course.category}</span>
                  <span className="course-free">Lớp 10–12</span>
                </div>
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <p>Giảng viên: {course.instructor}</p>
                  <div className="course-card-footer"><span>{course.category}</span><a href="#login" aria-label={`Tìm hiểu môn học: ${course.title}`}>Tìm hiểu <span aria-hidden="true">→</span></a></div>
                </div>
              </article>
            ))}
          </div>
          <div className="course-more"><a href="#categories">Xem tất cả môn học <ArrowIcon /></a></div>
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
            <p>Nền tảng học tập trực tuyến dành cho học sinh THPT, đồng hành trên hành trình củng cố kiến thức và phát triển kỹ năng.</p>
            <span className="footer-contact">Kết nối hành trình học tập của bạn cùng EduVerse.</span>
          </div>
          <div><h3>Môn học THPT</h3><a href="#categories">Toán học</a><a href="#categories">Tiếng Anh</a><a href="#categories">Ngữ văn</a><a href="#categories">Lịch sử</a><a href="#categories">Địa lý</a></div>
          <div><h3>Học tập trực tuyến</h3><a href="#courses">Khám phá môn học</a><a href="#learning-tools">Chương trình và bài học</a><a href="#learning-tools">Bài kiểm tra</a><a href="#learning-tools">Bài tập và nhận xét</a><a href="#activate-class">Tham gia lớp học</a></div>
          <div><h3>Về EduVerse</h3><a href="#values">Giới thiệu nền tảng</a><a href="#values">Dành cho học viên</a><a href="#values">Dành cho giảng viên</a><a href="#support">Trợ giúp</a><a href="#terms">Điều khoản & bảo mật</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 EduVerse. Nền tảng học tập trực tuyến.</span><span>Học tập để tiến xa hơn.</span></div>
      </footer>
    </div>
  );
}

export default App;
