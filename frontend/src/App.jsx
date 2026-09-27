const courses = [
  {
    title: "IELTS Foundation",
    subtitle: "Từ vựng và ngữ pháp cơ bản IELTS",
    level: "A2 - B1",
    lessons: "32 bài học",
    students: "2.450 học viên",
    color: "from-blue-100 to-blue-50",
    accent: "text-blue-600",
  },
  {
    title: "IELTS Intensive Listening",
    subtitle: "Luyện nghe IELTS theo từng dạng bài",
    level: "B1 - B2",
    lessons: "28 bài học",
    students: "1.820 học viên",
    color: "from-orange-100 to-yellow-50",
    accent: "text-orange-500",
  },
  {
    title: "English Communication",
    subtitle: "Tiếng Anh giao tiếp thực tế hàng ngày",
    level: "A1 - B1",
    lessons: "30 bài học",
    students: "3.120 học viên",
    color: "from-purple-100 to-purple-50",
    accent: "text-purple-600",
  },
];

const exams = [
  {
    title: "IELTS Listening Practice Test 01",
    time: "40 phút",
    views: "12.350",
    questions: "40 câu hỏi",
    tags: ["IELTS", "Listening"],
  },
  {
    title: "IELTS Reading Practice Test 01",
    time: "60 phút",
    views: "10.280",
    questions: "40 câu hỏi",
    tags: ["IELTS", "Reading"],
  },
  {
    title: "IELTS Listening Practice Test 02",
    time: "40 phút",
    views: "8.920",
    questions: "40 câu hỏi",
    tags: ["IELTS", "Listening"],
  },
  {
    title: "IELTS Reading Practice Test 02",
    time: "60 phút",
    views: "7.640",
    questions: "40 câu hỏi",
    tags: ["IELTS", "Reading"],
  },
  {
    title: "English Grammar Test - B1",
    time: "30 phút",
    views: "6.520",
    questions: "30 câu hỏi",
    tags: ["Grammar", "B1"],
  },
  {
    title: "English Vocabulary Test - B2",
    time: "30 phút",
    views: "5.810",
    questions: "30 câu hỏi",
    tags: ["Vocabulary", "B2"],
  },
  {
    title: "TOEIC Listening Practice",
    time: "45 phút",
    views: "9.430",
    questions: "50 câu hỏi",
    tags: ["TOEIC", "Listening"],
  },
  {
    title: "TOEIC Reading Practice",
    time: "60 phút",
    views: "8.210",
    questions: "50 câu hỏi",
    tags: ["TOEIC", "Reading"],
  },
];

const levels = [
  {
    level: "A1",
    name: "Beginner",
    description: "Làm quen với tiếng Anh cơ bản",
  },
  {
    level: "A2",
    name: "Elementary",
    description: "Giao tiếp trong những tình huống quen thuộc",
  },
  {
    level: "B1",
    name: "Intermediate",
    description: "Sử dụng tiếng Anh độc lập",
  },
  {
    level: "B2",
    name: "Upper Intermediate",
    description: "Giao tiếp tự tin trong học tập và công việc",
  },
  {
    level: "C1",
    name: "Advanced",
    description: "Sử dụng tiếng Anh chuyên sâu",
  },
  {
    level: "C2",
    name: "Proficient",
    description: "Làm chủ tiếng Anh",
  },
];

function App() {
  return (
    <div className="min-h-screen bg-white text-[#222]">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-[58px] max-w-[1180px] items-center justify-between px-4">

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3154a5] text-lg font-bold text-white">
              E
            </div>

            <span className="text-[22px] font-extrabold tracking-tight">
              EDU<span className="text-[#3154a5]">VERSE</span>
            </span>
          </div>

          <nav className="hidden items-center gap-5 text-[13px] md:flex">
            <a className="hover:text-[#3154a5]" href="#">
              Giới thiệu
            </a>

            <a className="hover:text-[#3154a5]" href="#courses">
              Chương trình học
            </a>

            <a className="hover:text-[#3154a5]" href="#tests">
              Đề thi online
            </a>

            <a className="hover:text-[#3154a5]" href="#ai">
              Học liệu AI
            </a>

            <a className="hover:text-[#3154a5]" href="#levels">
              Lộ trình học
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button className="rounded-md bg-[#3154a5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#28468c]">
              Đăng nhập
            </button>

            <button className="hidden rounded-md border border-[#3154a5] px-5 py-2 text-sm font-semibold text-[#3154a5] sm:block">
              Đăng ký
            </button>
          </div>

        </div>
      </header>


      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-r from-[#eef7ff] via-[#fffef2] to-[#eef8ff]">
        <div className="relative mx-auto max-w-[1180px] overflow-hidden px-4">

          <div className="grid min-h-[350px] items-center gap-8 py-8 md:grid-cols-2">

            {/* LEFT */}
            <div className="relative z-10">

              <div className="mb-3 inline-block -rotate-2 bg-[#3154a5] px-4 py-1 text-sm font-bold text-white">
                EDUVERSE
              </div>

              <h1 className="text-4xl font-extrabold uppercase leading-[1.1] text-[#28479a] md:text-[48px]">
                HỌC TIẾNG ANH
                <br />
                <span className="text-[#3154a5]">
                  KHÔNG GIỚI HẠN
                </span>
              </h1>

              <div className="mt-5 space-y-2 text-[15px] text-gray-700">

                <p>✓ Học tiếng Anh theo cấp độ từ A1 đến C2</p>

                <p>✓ Đa dạng khóa học IELTS, TOEIC và giao tiếp</p>

                <p>✓ Học liệu được thiết kế phù hợp với trình độ</p>

                <p>✓ AI hỗ trợ tạo bài tập và cá nhân hóa việc học</p>

                <p>✓ Theo dõi tiến độ và kết quả học tập</p>

              </div>

              <button className="mt-6 rounded-md bg-[#3154a5] px-7 py-3 font-bold text-white shadow-md hover:bg-[#28468c]">
                Bắt đầu học ngay →
              </button>

            </div>


            {/* RIGHT */}
            <div className="relative flex h-[300px] items-center justify-center">

              <div className="absolute h-[270px] w-[270px] rounded-full bg-[#dbeaff]" />

              <div className="relative z-10 flex h-[245px] w-[360px] items-center justify-center rounded-[45%] border-4 border-[#3154a5] bg-white shadow-lg">

                <div className="text-center">

                  <div className="text-7xl">
                    👩🏻‍💻
                  </div>

                  <p className="mt-3 text-xl font-bold text-[#3154a5]">
                    Học tiếng Anh
                  </p>

                  <p className="text-sm text-gray-500">
                    mọi lúc · mọi nơi
                  </p>

                </div>

              </div>


              <div className="absolute left-5 top-8 rounded-full bg-[#ef6d7a] px-5 py-4 text-center text-white shadow-lg">
                <p className="text-xl font-bold">
                  100+
                </p>

                <p className="text-xs">
                  khóa học
                </p>
              </div>


              <div className="absolute bottom-5 right-4 rounded-full bg-[#536fd0] px-5 py-4 text-center text-white shadow-lg">
                <p className="text-xl font-bold">
                  10K+
                </p>

                <p className="text-xs">
                  học viên
                </p>
              </div>

            </div>

          </div>


          {/* arrows */}
          <button className="absolute left-2 top-1/2 text-4xl text-blue-500">
            ‹
          </button>

          <button className="absolute right-2 top-1/2 text-4xl text-blue-500">
            ›
          </button>

          <div className="flex justify-center gap-2 pb-4">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            <span className="h-2 w-2 rounded-full bg-gray-300" />
          </div>

        </div>
      </section>


      {/* ================= FEATURED COURSES ================= */}
      <section
        id="courses"
        className="mx-auto max-w-[1180px] px-4 py-12"
      >

        <SectionTitle title="Khóa học online nổi bật" />

        <div className="mt-7 grid gap-5 md:grid-cols-3">

          {courses.map((course) => (
            <CourseCard
              key={course.title}
              course={course}
            />
          ))}

        </div>

        <div className="mt-5 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="h-2 w-2 rounded-full bg-gray-300" />
          <span className="h-2 w-2 rounded-full bg-gray-300" />
          <span className="h-2 w-2 rounded-full bg-gray-300" />
        </div>

      </section>


      {/* ================= INTRO + FORM ================= */}
      <section className="bg-[#e9f3ff]">
        <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-10 md:grid-cols-[1fr_300px]">

          <div className="text-[14px] leading-7 text-gray-700">

            <h2 className="mb-5 text-2xl font-bold text-[#222]">
              Học tiếng Anh hiệu quả cùng EduVerse
            </h2>

            <p>
              EduVerse là nền tảng học tiếng Anh trực tuyến cung cấp hệ
              thống học liệu được xây dựng theo cấp độ từ A1 đến C2.
              Người học có thể lựa chọn nội dung phù hợp với trình độ,
              kỹ năng và mục tiêu học tập của mình.
            </p>

            <p className="mt-3">
              Hệ thống cung cấp các khóa học về ngữ pháp, từ vựng,
              nghe, nói, đọc, viết cùng các chương trình luyện thi
              IELTS và TOEIC.
            </p>

            <p className="mt-3">
              Đặc biệt, EduVerse ứng dụng trí tuệ nhân tạo để hỗ trợ
              xây dựng học liệu. AI có thể hỗ trợ tạo bài học, bài tập,
              câu hỏi, đáp án và lời giải theo nhiều mức độ khó khác nhau.
            </p>

            <p className="mt-3">
              Học liệu do AI tạo ra sẽ được kiểm duyệt trước khi đưa
              vào hệ thống nhằm bảo đảm chất lượng và phù hợp với
              mục tiêu học tập.
            </p>

          </div>


          <div className="rounded-md border bg-white p-5 shadow-md">

            <h3 className="mb-5 text-center text-xl font-bold">
              Tư vấn lộ trình học
            </h3>

            <input
              className="mb-3 w-full border px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Họ tên*"
            />

            <input
              className="mb-3 w-full border px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Số điện thoại*"
            />

            <input
              className="mb-3 w-full border px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Email*"
            />

            <select className="mb-3 w-full border px-3 py-2 text-sm">
              <option>Trình độ hiện tại</option>
              <option>A1 - Beginner</option>
              <option>A2 - Elementary</option>
              <option>B1 - Intermediate</option>
              <option>B2 - Upper Intermediate</option>
              <option>C1 - Advanced</option>
              <option>C2 - Proficient</option>
            </select>

            <select className="mb-3 w-full border px-3 py-2 text-sm">
              <option>Mục tiêu học tập</option>
              <option>Giao tiếp</option>
              <option>IELTS</option>
              <option>TOEIC</option>
              <option>Cải thiện tiếng Anh</option>
            </select>

            <button className="w-full rounded-md bg-[#3154a5] py-2.5 text-sm font-bold text-white hover:bg-[#28468c]">
              Đăng ký tư vấn miễn phí
            </button>

          </div>

        </div>
      </section>


      {/* ================= TEST BANNER ================= */}
      <section className="mx-auto max-w-[1000px] px-4 py-8">

        <div className="relative overflow-hidden rounded-sm bg-gradient-to-r from-[#fff3b0] via-[#fff8d7] to-[#ffd65c] px-8 py-8 text-center">

          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-5xl">
            💡
          </div>

          <h2 className="text-3xl font-extrabold text-[#222] md:text-4xl">
            TEST TRÌNH ĐỘ MIỄN PHÍ
          </h2>

          <button className="mt-3 rounded-full bg-[#3154a5] px-8 py-2.5 text-lg font-bold text-white shadow-md">
            CÓ NGAY KẾT QUẢ!
          </button>

          <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 text-5xl md:block">
            💻
          </div>

        </div>

      </section>


      {/* ================= TESTS ================= */}
      <section
        id="tests"
        className="mx-auto max-w-[1180px] px-4 py-8 pb-14"
      >

        <SectionTitle title="Đề thi mới nhất" />

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {exams.map((exam) => (
            <ExamCard
              key={exam.title}
              exam={exam}
            />
          ))}

        </div>

      </section>


      {/* ================= LEVELS ================= */}
      <section
        id="levels"
        className="border-y bg-white"
      >

        <div className="mx-auto max-w-[1000px] px-4 py-14">

          <SectionTitle
            title="Học tiếng Anh theo cấp độ"
            subtitle="Lựa chọn nội dung phù hợp với trình độ của bạn"
          />

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">

            {levels.map((item) => (
              <div
                key={item.level}
                className="border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-400"
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf2ff] text-xl font-extrabold text-[#3154a5]">
                    {item.level}
                  </div>

                  <div>
                    <h3 className="font-bold">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {item.description}
                    </p>
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>

      </section>


      {/* ================= AI ================= */}
      <section
        id="ai"
        className="bg-[#3154a5]"
      >

        <div className="mx-auto grid max-w-[1000px] items-center gap-10 px-4 py-14 md:grid-cols-2">

          <div className="text-white">

            <h2 className="text-3xl font-bold">
              Học liệu thông minh với AI
            </h2>

            <p className="mt-4 text-sm leading-7 text-blue-100">
              EduVerse ứng dụng trí tuệ nhân tạo để hỗ trợ giảng viên
              xây dựng học liệu tiếng Anh theo nhiều cấp độ khác nhau.
            </p>

            <div className="mt-6 space-y-3 text-sm">

              <p>✓ Tạo bài học theo cấp độ</p>

              <p>✓ Tạo bài tập và câu hỏi</p>

              <p>✓ Tự động tạo đáp án và lời giải</p>

              <p>✓ Điều chỉnh độ khó của học liệu</p>

              <p>✓ Hỗ trợ kiểm duyệt trước khi xuất bản</p>

            </div>

            <button className="mt-7 rounded-md bg-white px-7 py-3 font-bold text-[#3154a5]">
              Khám phá học liệu AI
            </button>

          </div>


          <div className="rounded-lg bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                ✨
              </div>

              <div>
                <p className="font-bold">
                  Trợ lý học tập AI
                </p>

                <p className="text-xs text-gray-500">
                  Học liệu trình độ B1
                </p>
              </div>

            </div>

            <div className="rounded-md bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Câu hỏi:
              </p>

              <p className="mt-2 font-semibold">
                If I _____ more time, I would learn another language.
              </p>

              <div className="mt-4 space-y-2">

                <div className="border bg-white p-3 text-sm">
                  A. have
                </div>

                <div className="border border-green-400 bg-green-50 p-3 text-sm text-green-700">
                  B. had ✓
                </div>

                <div className="border bg-white p-3 text-sm">
                  C. will have
                </div>

              </div>

              <div className="mt-4 rounded bg-green-50 p-3 text-xs leading-5 text-green-700">
                Đáp án đúng: B. had.
                Đây là câu điều kiện loại 2, dùng để diễn tả
                tình huống giả định.
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= COMMUNITY ================= */}
      <section className="mx-auto max-w-[1000px] px-4 py-16">

        <div className="text-center">

          <h2 className="text-2xl font-bold md:text-3xl">
            Học tiếng Anh không giới hạn
          </h2>

          <p className="mt-3 text-gray-500">
            Cộng đồng học tập cùng nhau tiến bộ mỗi ngày
          </p>

        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2">

          <div className="grid grid-cols-3 gap-2">

            {[
              "📚",
              "👩🏻‍🎓",
              "🎧",
              "💬",
              "📝",
              "👨🏻‍💻",
              "🎯",
              "🌎",
              "✨",
            ].map((item, index) => (
              <div
                key={index}
                className="flex aspect-square items-center justify-center rounded-sm bg-gradient-to-br from-blue-100 to-blue-50 text-4xl"
              >
                {item}
              </div>
            ))}

          </div>


          <div className="flex flex-col justify-center">

            <div className="space-y-4 text-sm leading-6 text-gray-700">

              <p>
                ✓ Học tập cùng cộng đồng người học tiếng Anh
              </p>

              <p>
                ✓ Thực hành các kỹ năng nghe, nói, đọc và viết
              </p>

              <p>
                ✓ Theo dõi tiến độ học tập của bản thân
              </p>

              <p>
                ✓ Nhận đề xuất học liệu phù hợp với trình độ
              </p>

            </div>

            <button className="mt-6 w-full rounded-md bg-[#3154a5] py-3 font-bold text-white">
              Bắt đầu học ngay
            </button>

          </div>

        </div>

      </section>


      {/* ================= REGISTER ================= */}
      <section className="bg-gradient-to-r from-[#182d62] to-[#3154a5]">

        <div className="mx-auto max-w-[1000px] px-4 py-14">

          <h2 className="text-center text-2xl font-bold text-white md:text-3xl">
            Đăng ký thông tin khóa học
          </h2>

          <p className="mt-3 text-center text-blue-100">
            Nhận tư vấn miễn phí về lộ trình học phù hợp với bạn
          </p>

          <div className="mx-auto mt-7 max-w-[650px] rounded-md bg-white p-5 shadow-xl">

            <input
              className="mb-3 w-full border px-4 py-3 text-sm"
              placeholder="Họ tên"
            />

            <input
              className="mb-3 w-full border px-4 py-3 text-sm"
              placeholder="Email"
            />

            <input
              className="mb-3 w-full border px-4 py-3 text-sm"
              placeholder="Số điện thoại"
            />

            <select className="mb-3 w-full border px-4 py-3 text-sm">
              <option>Mục tiêu học tập</option>
              <option>Giao tiếp</option>
              <option>IELTS</option>
              <option>TOEIC</option>
              <option>Cải thiện tiếng Anh</option>
            </select>

            <button className="w-full rounded-md bg-[#3154a5] py-3 font-bold text-white">
              Đăng ký tư vấn miễn phí
            </button>

          </div>

        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="bg-white">

        <div className="mx-auto grid max-w-[1000px] gap-10 px-4 py-12 md:grid-cols-4">

          <div>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3154a5] font-bold text-white">
                E
              </div>

              <span className="text-xl font-extrabold">
                EDU<span className="text-[#3154a5]">VERSE</span>
              </span>

            </div>

            <p className="mt-4 text-sm leading-6 text-gray-500">
              Nền tảng học tiếng Anh trực tuyến theo cấp độ,
              ứng dụng trí tuệ nhân tạo trong xây dựng học liệu.
            </p>

          </div>


          <FooterColumn
            title="Về EduVerse"
            items={[
              "Giới thiệu",
              "Khóa học",
              "Giảng viên",
              "Liên hệ",
            ]}
          />


          <FooterColumn
            title="Tài nguyên"
            items={[
              "Đề thi online",
              "Học liệu",
              "Lộ trình học",
              "Học liệu AI",
            ]}
          />


          <FooterColumn
            title="Chính sách chung"
            items={[
              "Hướng dẫn sử dụng",
              "Điều khoản sử dụng",
              "Chính sách bảo mật",
              "Liên hệ hỗ trợ",
            ]}
          />

        </div>


        <div className="border-t py-4 text-center text-xs text-gray-500">
          © 2026 EduVerse. All rights reserved.
        </div>

      </footer>

    </div>
  );
}


/* ================= COMPONENTS ================= */

function SectionTitle({ title, subtitle }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold md:text-3xl">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-2 text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}


function CourseCard({ course }) {
  return (
    <div className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      <div
        className={`relative flex h-[155px] items-center justify-center bg-gradient-to-br ${course.color}`}
      >

        <div className="text-center">

          <div className={`text-5xl font-extrabold ${course.accent}`}>
            {course.level}
          </div>

          <p className="mt-2 text-sm font-bold text-gray-600">
            ENGLISH COURSE
          </p>

        </div>

        <span className="absolute right-2 top-2 rounded-sm bg-white px-2 py-1 text-xs font-bold text-[#3154a5]">
          EDUVERSE
        </span>

      </div>


      <div className="p-4">

        <h3 className="min-h-[42px] text-sm font-bold leading-5">
          {course.title}
        </h3>

        <p className="mt-1 min-h-[40px] text-xs leading-5 text-gray-600">
          {course.subtitle}
        </p>

        <div className="mt-3 text-xs text-gray-500">
          ⭐⭐⭐⭐⭐
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {course.lessons} &nbsp; | &nbsp; {course.students}
        </div>

        <button className="mt-4 w-full rounded-sm border border-[#3154a5] py-2 text-xs font-semibold text-[#3154a5] hover:bg-[#3154a5] hover:text-white">
          Xem khóa học
        </button>

      </div>

    </div>
  );
}


function ExamCard({ exam }) {
  return (
    <div className="rounded-sm border border-gray-200 bg-white p-3 shadow-sm">

      <h3 className="min-h-[40px] text-sm font-semibold leading-5">
        {exam.title}
      </h3>

      <div className="mt-3 space-y-1 text-xs text-gray-500">

        <p>
          ◷ {exam.time} &nbsp; | &nbsp; 👁 {exam.views}
        </p>

        <p>
          📝 {exam.questions}
        </p>

      </div>

      <div className="mt-3 flex gap-2">

        {exam.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-500"
          >
            #{tag}
          </span>
        ))}

      </div>

      <button className="mt-4 w-full rounded border border-[#3154a5] py-2 text-xs font-semibold text-[#3154a5] hover:bg-[#3154a5] hover:text-white">
        Chi tiết
      </button>

    </div>
  );
}


function FooterColumn({ title, items }) {
  return (
    <div>

      <h3 className="font-bold">
        {title}
      </h3>

      <ul className="mt-4 space-y-2 text-sm text-gray-500">

        {items.map((item) => (
          <li
            key={item}
            className="cursor-pointer hover:text-[#3154a5]"
          >
            {item}
          </li>
        ))}

      </ul>

    </div>
  );
}

export default App;