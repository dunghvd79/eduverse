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
    id: 'toan-thpt',
    category: 'Toán học',
    title: 'Toán THPT: Nắm vững kiến thức và phương pháp giải bài',
    instructor: 'Tổ Toán EduVerse',
    description: 'Ôn tập các mạch kiến thức trọng tâm của chương trình THPT, từ đại số đến hình học, với hướng dẫn từng bước.',
    outline: ['Hàm số và đồ thị', 'Mũ, logarit và phương trình', 'Nguyên hàm, tích phân và ứng dụng', 'Hình học không gian và tọa độ'],
    icon: '∑',
    tone: 'blue',
  },
  {
    id: 'tieng-anh-thpt',
    category: 'Tiếng Anh',
    title: 'Tiếng Anh THPT: Ngữ pháp, từ vựng và đọc hiểu',
    instructor: 'Tổ Tiếng Anh EduVerse',
    description: 'Củng cố ngữ pháp, mở rộng vốn từ và rèn kỹ năng đọc hiểu qua các chủ đề quen thuộc ở bậc THPT.',
    outline: ['Các thì và dạng động từ', 'Câu bị động và câu điều kiện', 'Từ vựng theo chủ đề', 'Đọc hiểu và tìm ý chính'],
    icon: 'A+',
    tone: 'indigo',
  },
  {
    id: 'ngu-van-thpt',
    category: 'Ngữ văn',
    title: 'Ngữ văn THPT: Đọc hiểu tác phẩm và viết bài nghị luận',
    instructor: 'Tổ Ngữ văn EduVerse',
    description: 'Rèn kỹ năng đọc hiểu, cảm thụ tác phẩm và xây dựng bài viết nghị luận rõ ý, có dẫn chứng.',
    outline: ['Đọc hiểu văn bản', 'Phân tích thơ và truyện', 'Nghị luận xã hội', 'Nghị luận văn học'],
    icon: '文',
    tone: 'green',
  },
  {
    id: 'lich-su-thpt',
    category: 'Lịch sử',
    title: 'Lịch sử Việt Nam và thế giới qua các thời kỳ',
    instructor: 'Tổ Lịch sử EduVerse',
    description: 'Hệ thống hóa sự kiện, nhân vật và bối cảnh lịch sử Việt Nam, thế giới theo từng giai đoạn.',
    outline: ['Thế giới từ năm 1918 đến nay', 'Việt Nam từ năm 1918 đến nay', 'Các phong trào giải phóng dân tộc', 'Kỹ năng đọc tư liệu lịch sử'],
    icon: '◷',
    tone: 'amber',
  },
  {
    id: 'dia-ly-thpt',
    category: 'Địa lý',
    title: 'Địa lý THPT: Atlat, tự nhiên và kinh tế - xã hội',
    instructor: 'Tổ Địa lý EduVerse',
    description: 'Ôn tập địa lý tự nhiên và kinh tế - xã hội, kết hợp luyện kỹ năng đọc bản đồ và khai thác Atlat.',
    outline: ['Địa lý tự nhiên Việt Nam', 'Dân cư và lao động', 'Các ngành kinh tế', 'Kỹ năng sử dụng Atlat Địa lý Việt Nam'],
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

function CourseFilters({ activeFilter, onChange }) {
  const filterOptions = ['Tất cả môn học', ...categories.map((category) => category.title)];

  return (
    <div className="course-filters" role="group" aria-label="Lọc khóa học theo môn">
      {filterOptions.map((filter) => (
        <button
          className={`filter-button${activeFilter === filter ? ' active' : ''}`}
          key={filter}
          onClick={() => onChange(filter)}
          type="button"
          aria-pressed={activeFilter === filter}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function CourseCard({ course }) {
  return (
    <article className="course-card">
      <div className={`course-image-wrap subject-art ${course.tone}`}>
        <span className="course-art-icon" aria-hidden="true">{course.icon}</span>
        <span className={`course-label ${course.tone}`}>{course.category}</span>
        <span className="course-free">Lớp 10–12</span>
      </div>
      <div className="course-content">
        <h3>{course.title}</h3>
        <p>{course.instructor}</p>
        <div className="course-card-footer">
          <span>{course.category}</span>
          <a href={`/courses/${course.id}`} aria-label={`Xem chi tiết: ${course.title}`}>
            Xem chi tiết <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </article>
  );
}

function CategoryDropdown() {
  return (
    <details className="category-dropdown">
      <summary>Môn học THPT <span aria-hidden="true">⌄</span></summary>
      <div className="dropdown-panel">
        {categories.map((category) => (
          <a className="dropdown-link" href={`/courses?subject=${category.id}`} key={category.id}>
            <span className={`dropdown-icon ${category.tone}`}>{category.icon}</span>
            <span><strong>{category.title}</strong><small>{category.description}</small></span>
          </a>
        ))}
      </div>
    </details>
  );
}

function CoursesPage() {
  const selectedSubject = new URLSearchParams(window.location.search).get('subject');
  const initialFilter = categories.find((category) => category.id === selectedSubject)?.title
    ?? 'Tất cả môn học';
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const visibleCourses = activeFilter === 'Tất cả môn học'
    ? courses
    : courses.filter((course) => course.category === activeFilter);

  return (
    <section className="section catalog-page" aria-labelledby="catalog-heading">
      <div className="catalog-intro">
        <div className="catalog-breadcrumb"><a href="/">Trang chủ</a><span aria-hidden="true">/</span><span>Môn học THPT</span></div>
        <span className="section-kicker">KHỐI LỚP 10–12</span>
        <h1 id="catalog-heading">Khám phá môn học</h1>
        <p>Chọn môn học để xem nội dung tham khảo và lộ trình ôn tập phù hợp với học sinh THPT.</p>
      </div>
      <div className="demo-notice" role="note">
        <span aria-hidden="true">i</span>
        <p>Danh mục và nội dung hiện là dữ liệu minh họa tĩnh. Đăng nhập, ghi danh và bài học trực tuyến chưa được kết nối backend.</p>
      </div>
      <CourseFilters activeFilter={activeFilter} onChange={setActiveFilter} />
      {visibleCourses.length > 0 ? (
        <div className="course-grid">
          {visibleCourses.map((course) => <CourseCard course={course} key={course.id} />)}
        </div>
      ) : (
        <p className="catalog-empty">Chưa có môn học phù hợp với lựa chọn này.</p>
      )}
    </section>
  );
}

function CourseDetailPage({ courseId }) {
  const course = courses.find((item) => item.id === courseId);

  if (!course) {
    return <NotFoundPage />;
  }

  return (
    <section className="section course-detail-page" aria-labelledby="course-detail-heading">
      <div className="catalog-breadcrumb">
        <a href="/">Trang chủ</a><span aria-hidden="true">/</span>
        <a href="/courses">Môn học THPT</a><span aria-hidden="true">/</span>
        <span>{course.category}</span>
      </div>
      <div className="course-detail-layout">
        <div className={`course-detail-art subject-art ${course.tone}`}>
          <span aria-hidden="true">{course.icon}</span>
          <span className={`course-label ${course.tone}`}>{course.category}</span>
          <span className="course-free">Lớp 10–12</span>
        </div>
        <div className="course-detail-copy">
          <span className="section-kicker">MÔN HỌC THPT</span>
          <h1 id="course-detail-heading">{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-detail-meta">
            <span><strong>Khối lớp</strong>10, 11 và 12</span>
            <span><strong>Phụ trách</strong>{course.instructor}</span>
            <span><strong>Hình thức</strong>Tự học theo chủ đề</span>
          </div>
          <button className="button button-primary" type="button" disabled title="Tính năng sẽ khả dụng khi backend được kết nối">
            Chưa thể ghi danh
          </button>
        </div>
      </div>
      <div className="course-detail-sections">
        <article className="detail-panel">
          <span className="section-kicker">LỘ TRÌNH THAM KHẢO</span>
          <h2>Nội dung dự kiến</h2>
          <ol className="outline-list">
            {course.outline.map((topic, index) => (
              <li key={topic}><span>{String(index + 1).padStart(2, '0')}</span>{topic}</li>
            ))}
          </ol>
          <p className="detail-disclaimer">Đây là đề cương minh họa để giới thiệu giao diện; bài học thực tế sẽ được bổ sung khi có dữ liệu từ hệ thống.</p>
        </article>
        <aside className="detail-panel detail-aside">
          <span className="section-kicker">DÀNH CHO HỌC SINH</span>
          <h2>Học theo nhịp độ của bạn</h2>
          <p>Nội dung được định hướng theo môn học phổ thông và khối lớp. Tính năng lưu tiến độ, làm bài và nhận phản hồi chưa khả dụng trong bản demo này.</p>
          <a className="text-link" href="/courses">Quay lại danh mục <ArrowIcon /></a>
        </aside>
      </div>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section className="section not-found-page">
      <span className="section-kicker">KHÔNG TÌM THẤY TRANG</span>
      <h1>Trang này chưa có trong EduVerse.</h1>
      <p>Hãy quay lại trang chủ hoặc xem danh mục môn học THPT.</p>
      <div className="hero-actions">
        <a className="button button-primary" href="/">Về trang chủ</a>
        <a className="button button-secondary" href="/courses">Xem môn học</a>
      </div>
    </section>
  );
}

function App() {
  const [activeFilter, setActiveFilter] = useState('Tất cả môn học');
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const courseDetailMatch = pathname.match(/^\/courses\/([^/]+)$/);
  const visibleCourses = activeFilter === 'Tất cả môn học'
    ? courses
    : courses.filter((course) => course.category === activeFilter);

  return (
    <div className="site-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <a className="brand" href="/" aria-label="EduVerse - Trang chủ">
            <span className="brand-mark"><span>e</span>v</span>
            <span>edu<span className="brand-accent">verse</span></span>
          </a>
          <nav className={`nav-links${menuOpen ? ' nav-open' : ''}`} aria-label="Điều hướng chính">
            <CategoryDropdown />
            <a href="/courses">Danh mục môn học</a>
            <a href="/#learning-tools">Trải nghiệm học tập</a>
            <a href="/#values">Lớp học & bài tập</a>
            <a href="/#activate-class">Kích hoạt mã lớp</a>
          </nav>
          <div className="nav-actions">
            <button className="login-link" type="button" disabled title="Đăng nhập chưa khả dụng trong bản demo">Đăng nhập</button>
            <button className="register-button" type="button" disabled title="Đăng ký chưa khả dụng trong bản demo">Đăng ký</button>
          </div>
          <button className="menu-button" type="button" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main>
        {pathname === '/courses' ? <CoursesPage /> : courseDetailMatch ? (
          <CourseDetailPage courseId={courseDetailMatch[1]} />
        ) : pathname === '/' ? (
          <>
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
                <img src="/images/hero-learning.jpg" alt="Không gian học tập trực tuyến EduVerse" />
                <div className="image-shade" />
                <div className="image-caption"><span>EDUVERSE • THPT</span><strong>Đồng hành cùng học sinh trên hành trình học tập</strong></div>
              </div>
              <div className="hero-badge badge-courses"><strong>10–12</strong><span>KHỐI<br />LỚP</span></div>
              <div className="hero-badge badge-students"><strong>5</strong><span>MÔN HỌC</span></div>
            </div>
          </div>
        </section>

        <div className="demo-notice home-demo-notice" role="note">
          <span aria-hidden="true">i</span>
          <p>Bản xem trước giao diện: nội dung môn học và hoạt động học trực tuyến đang là minh họa. Đăng nhập, ghi danh, làm bài và nộp bài chưa khả dụng.</p>
        </div>

        <section className="section categories-section" id="categories">
          <div className="section-heading category-heading">
            <div><span className="section-kicker">CÁC MÔN HỌC THPT</span><h2>Chọn môn học bạn quan tâm</h2></div>
            <p>Ôn tập kiến thức phổ thông theo từng môn và khối lớp 10, 11, 12.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <a className="category-card" href={`/courses?subject=${category.id}`} key={category.id}>
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
            <button type="button" disabled title="Tính năng chưa khả dụng trong bản demo">Kích hoạt mã lớp <ArrowIcon /></button>
          </div>
        </section>

        <section className="section courses-section" id="courses">
          <div className="section-heading courses-heading">
            <div><span className="section-kicker">NỘI DUNG HỌC TẬP THPT</span><h2>Môn học nổi bật</h2></div>
            <a className="all-courses-link" href="/courses">Xem các môn học <ArrowIcon /></a>
          </div>
          <CourseFilters activeFilter={activeFilter} onChange={setActiveFilter} />
          <div className="course-grid">
            {visibleCourses.map((course) => <CourseCard course={course} key={course.id} />)}
          </div>
          <div className="course-more"><a href="/courses">Xem tất cả môn học <ArrowIcon /></a></div>
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
          </>
        ) : <NotFoundPage />}
      </main>

      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <a className="brand footer-brand" href="/" aria-label="EduVerse - Trang chủ"><span className="brand-mark"><span>e</span>v</span><span>edu<span className="brand-accent">verse</span></span></a>
            <p>Nền tảng học tập trực tuyến dành cho học sinh THPT, đồng hành trên hành trình củng cố kiến thức và phát triển kỹ năng.</p>
            <span className="footer-contact">Kết nối hành trình học tập của bạn cùng EduVerse.</span>
          </div>
          <div><h3>Môn học THPT</h3><a href="/courses?subject=math">Toán học</a><a href="/courses?subject=english">Tiếng Anh</a><a href="/courses?subject=literature">Ngữ văn</a><a href="/courses?subject=history">Lịch sử</a><a href="/courses?subject=geography">Địa lý</a></div>
          <div><h3>Học tập trực tuyến</h3><a href="/courses">Khám phá môn học</a><a href="/#learning-tools">Chương trình và bài học</a><a href="/#learning-tools">Bài kiểm tra</a><a href="/#learning-tools">Bài tập và nhận xét</a><a href="/#activate-class">Tham gia lớp học</a></div>
          <div><h3>Về EduVerse</h3><a href="/#values">Giới thiệu nền tảng</a><a href="/#values">Dành cho học viên</a><a href="/#values">Dành cho giảng viên</a><a href="/#values">Trợ giúp</a><a href="/#values">Điều khoản & bảo mật</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 EduVerse. Nền tảng học tập trực tuyến.</span><span>Học tập để tiến xa hơn.</span></div>
      </footer>
    </div>
  );
}

export default App;
