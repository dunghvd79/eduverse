const categories = [
  { icon: "💻", name: "Lập trình", courses: "32 khóa học" },
  { icon: "🗄️", name: "Cơ sở dữ liệu", courses: "12 khóa học" },
  { icon: "🌐", name: "Mạng máy tính", courses: "10 khóa học" },
  { icon: "⚙️", name: "Kiểm thử phần mềm", courses: "8 khóa học" },
  { icon: "🧠", name: "Trí tuệ nhân tạo", courses: "15 khóa học" },
  { icon: "👥", name: "Kỹ năng mềm", courses: "18 khóa học" },
]

const courses = [
  {
    image: "⚛️",
    title: "React từ cơ bản đến nâng cao",
    description: "Xây dựng giao diện web hiện đại với React và các công cụ phổ biến.",
    teacher: "Nguyễn Văn A",
    lessons: "24 bài học",
    students: "1.2K học viên",
    rating: "4.8",
    badge: "Hot",
  },
  {
    image: "🐍",
    title: "Lập trình Python cho người mới bắt đầu",
    description: "Nắm vững kiến thức Python từ cơ bản đến nâng cao.",
    teacher: "Trần Thị B",
    lessons: "20 bài học",
    students: "980 học viên",
    rating: "4.7",
    badge: "Mới",
  },
  {
    image: "🗄️",
    title: "Cơ sở dữ liệu và SQL nâng cao",
    description: "Từ kiến thức cơ bản đến truy vấn SQL chuyên sâu.",
    teacher: "Lê Văn C",
    lessons: "18 bài học",
    students: "650 học viên",
    rating: "4.6",
    badge: "",
  },
  {
    image: "🔍",
    title: "Kiểm thử phần mềm thực chiến",
    description: "Từ lý thuyết đến thực hành kiểm thử phần mềm.",
    teacher: "Phạm Thị D",
    lessons: "16 bài học",
    students: "520 học viên",
    rating: "4.8",
    badge: "",
  },
]

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xl text-white">
              🎓
            </div>
            <span className="text-2xl font-bold text-slate-900">
              Edu<span className="text-blue-600">Verse</span>
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#" className="font-medium text-blue-600">Trang chủ</a>
            <a href="#" className="text-slate-600 hover:text-blue-600">Khóa học</a>
            <a href="#" className="text-slate-600 hover:text-blue-600">Giảng viên</a>
            <a href="#" className="text-slate-600 hover:text-blue-600">Tin tức</a>
            <a href="#" className="text-slate-600 hover:text-blue-600">Liên hệ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-lg border border-blue-600 px-5 py-2 font-medium text-blue-600 hover:bg-blue-50 sm:block">
              Đăng nhập
            </button>

            <button className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700">
              Đăng ký
            </button>
          </div>

        </div>
      </header>

      {/* HERO */}
      <section className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">

          <div>
            <span className="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              Nền tảng học tập trực tuyến hiện đại
            </span>

            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Học tập không giới hạn
              <span className="block text-blue-600">
                Kiến tạo tương lai
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              EduVerse mang đến trải nghiệm học tập trực tuyến linh hoạt
              với nội dung chất lượng, giảng viên uy tín và công nghệ hiện đại.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
                Khám phá khóa học →
              </button>

              <button className="rounded-lg border border-blue-600 px-7 py-3 font-semibold text-blue-600 hover:bg-blue-50">
                Tìm hiểu thêm
              </button>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-6">
              <Stat number="1.000+" label="Học viên" />
              <Stat number="100+" label="Khóa học" />
              <Stat number="50+" label="Giảng viên" />
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="flex h-[430px] items-center justify-center rounded-[40px] bg-blue-100">
              <div className="text-center">
                <div className="text-8xl">👩‍💻</div>
                <p className="mt-5 text-xl font-semibold text-blue-800">
                  Học mọi lúc, mọi nơi
                </p>
              </div>
            </div>

            <div className="absolute right-0 top-10 rounded-2xl bg-white p-5 shadow-xl">
              <p className="font-semibold">Tiến độ học tập</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">75%</p>
              <p className="text-sm text-slate-500">Hoàn thành khóa học</p>
            </div>
          </div>

        </div>
      </section>

      {/* CATEGORY */}
      <section className="mx-auto max-w-7xl px-6 py-16">

        <SectionTitle
          title="Danh mục khóa học"
          subtitle="Khám phá các lĩnh vực học tập đa dạng, phù hợp với mục tiêu của bạn"
        />

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="rounded-2xl border bg-slate-50 p-6 text-center transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="text-4xl">{category.icon}</div>
              <h3 className="mt-4 font-semibold">{category.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {category.courses}
              </p>
            </div>
          ))}
        </div>

      </section>

      {/* COURSES */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">

          <SectionTitle
            title="Khóa học online nổi bật"
            subtitle="Những khóa học chất lượng được nhiều học viên lựa chọn"
          />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {courses.map((course) => (
              <div
                key={course.title}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-slate-900 to-blue-800">
                  <span className="text-7xl">{course.image}</span>

                  {course.badge && (
                    <span className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      {course.badge}
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold leading-6">
                    {course.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {course.description}
                  </p>

                  <p className="mt-4 text-sm font-medium">
                    {course.teacher}
                  </p>

                  <div className="mt-4 flex justify-between text-xs text-slate-500">
                    <span>{course.lessons}</span>
                    <span>{course.students}</span>
                    <span>⭐ {course.rating}</span>
                  </div>
                </div>

              </div>
            ))}

          </div>

        </div>
      </section>

      {/* BANNER */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl bg-gradient-to-r from-yellow-300 to-orange-200 px-8 py-10 text-center">
          <h2 className="text-3xl font-extrabold">
            TEST TRÌNH ĐỘ MIỄN PHÍ
          </h2>
          <p className="mt-2 text-lg font-medium">
            Đánh giá năng lực và chọn khóa học phù hợp
          </p>
          <button className="mt-5 rounded-lg bg-blue-700 px-7 py-3 font-semibold text-white hover:bg-blue-800">
            Làm bài test ngay →
          </button>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        <SectionTitle
          title="Tại sao nên chọn EduVerse?"
          subtitle="Chúng tôi cam kết mang đến trải nghiệm học tập tốt nhất cho bạn"
        />

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Benefit icon="💻" title="Học mọi lúc, mọi nơi" />
          <Benefit icon="💎" title="Nội dung chất lượng" />
          <Benefit icon="📊" title="Theo dõi tiến độ" />
          <Benefit icon="🤖" title="Hỗ trợ AI" />
        </div>

      </section>

      {/* REGISTER */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl bg-blue-100 p-8 md:p-10">

          <h2 className="text-3xl font-bold">
            Đăng ký thông tin khóa học
          </h2>

          <p className="mt-2 text-slate-600">
            Nhận tư vấn miễn phí về lộ trình học phù hợp với mục tiêu của bạn.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <input
              className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Họ tên"
            />

            <input
              className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Số điện thoại"
            />

            <select className="rounded-lg border bg-white px-4 py-3">
              <option>Môn học quan tâm</option>
              <option>Lập trình</option>
              <option>Cơ sở dữ liệu</option>
              <option>Kiểm thử phần mềm</option>
            </select>

            <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
              Đăng ký tư vấn
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">

          <div>
            <h2 className="text-2xl font-bold">
              Edu<span className="text-blue-400">Verse</span>
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              Nền tảng học tập trực tuyến hiện đại,
              đồng hành cùng bạn trên hành trình phát triển.
            </p>
          </div>

          <FooterColumn
            title="Về EduVerse"
            items={["Giới thiệu", "Khóa học", "Giảng viên", "Tin tức"]}
          />

          <FooterColumn
            title="Hỗ trợ"
            items={["Trung tâm trợ giúp", "Câu hỏi thường gặp", "Điều khoản sử dụng", "Chính sách bảo mật"]}
          />

          <FooterColumn
            title="Liên hệ"
            items={["support@eduverse.edu.vn", "0123 456 789", "Hà Nội, Việt Nam"]}
          />

        </div>

        <div className="border-t border-slate-800 py-5 text-center text-sm text-slate-500">
          © 2026 EduVerse. All rights reserved.
        </div>
      </footer>

    </div>
  )
}

function Stat({ number, label }) {
  return (
    <div>
      <p className="text-2xl font-bold text-blue-600">{number}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-500">{subtitle}</p>
    </div>
  )
}

function Benefit({ icon, title }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Trải nghiệm học tập thuận tiện, hiện đại và phù hợp với nhu cầu của bạn.
      </p>
    </div>
  )
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <h3 className="font-bold">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-400">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default App