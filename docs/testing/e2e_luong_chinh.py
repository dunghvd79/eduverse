"""
Kiểm thử luồng chính qua giao diện (Playwright), mô phỏng 3 người dùng thật:
  GV tạo khóa -> QL duyệt -> mở lớp -> HV ghi danh, học, làm quiz, nộp bài, thảo luận
  -> GV chấm -> HV xem điểm, nhận thông báo -> QL xem báo cáo, xuất Excel

Yêu cầu: backend :5000 và frontend :5173 đang chạy (npm run dev); Python Playwright đã cài.
Chạy (từ thư mục gốc repo):  python docs/testing/e2e_luong_chinh.py [--keep]
  --keep  giữ lại dữ liệu thử để xem bằng tay (dọn sau bằng: cd backend && node src/scripts/secTestCleanup.js)

Dữ liệu thử dùng email sec-test-*@example.com và bị xóa hẳn khi kết thúc. Ảnh chụp từng bước và báo cáo
lỗi ghi vào docs/testing/e2e-ket-qua/ (không commit ảnh).
Nội dung khóa học mẫu và điểm mong đợi: docs/testing/e2e-luong-chinh.md.
"""
import json
import os
import re
import struct
import subprocess
import sys
import time
import urllib.request
import zlib
from contextlib import contextmanager
from datetime import datetime, timedelta

from playwright.sync_api import sync_playwright, expect

WEB = 'http://localhost:5173'
API = 'http://localhost:5000/api/v1'
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'docs', 'testing', 'e2e-ket-qua')
STAMP = format(int(time.time()), 'x')
PASS = 'SecTest@2026'
SEED_PASS = 'EduVerse@2026'
TEACHER = f'sec-test-gv-{STAMP}@example.com'
STUDENT = f'sec-test-hv-{STAMP}@example.com'
MANAGER = 'manager@eduverse.com'
KEEP = '--keep' in sys.argv

COURSE_TITLE = f'Nhập môn Git và GitHub cho người mới bắt đầu ({STAMP})'
COURSE_DESC = ('Khóa học giúp người mới làm quen với hệ thống quản lý phiên bản Git và nền tảng GitHub: '
               'khái niệm commit, repository, các lệnh cơ bản và quy trình làm việc nhóm.')
CHAPTER = 'Làm quen với Git'
L1, L2, L3, L4 = ('Git là gì và vì sao cần quản lý phiên bản', 'Cài đặt và cấu hình Git',
                  'Kiểm tra nhanh: các lệnh Git cơ bản', 'Thực hành: tạo repository đầu tiên')
L1_TEXT = """Git là hệ thống quản lý phiên bản phân tán (Distributed Version Control System) do Linus Torvalds tạo ra năm 2005 để phát triển nhân Linux.

Khi làm việc một mình, bạn có thể lưu nhiều bản sao như "baocao_v1.docx", "baocao_v2_final.docx"... Cách này nhanh chóng trở nên rối: không biết bản nào mới nhất, ai sửa gì, và rất khó quay lại một thay đổi cũ. Khi làm việc nhóm, việc gửi file qua lại còn dễ ghi đè lên công sức của nhau.

Git giải quyết vấn đề đó bằng ba khái niệm chính:
- Repository (kho chứa): thư mục dự án được Git theo dõi, lưu toàn bộ lịch sử thay đổi.
- Commit: một "ảnh chụp" trạng thái dự án tại một thời điểm, kèm lời mô tả ai đã thay đổi gì và vì sao.
- Branch (nhánh): một hướng phát triển riêng, cho phép thử nghiệm tính năng mới mà không ảnh hưởng tới bản chính.

Nhờ vậy, mỗi thành viên làm việc trên máy của mình, sau đó hợp nhất (merge) thay đổi lại với nhau. GitHub là dịch vụ lưu trữ repository Git trên mạng, giúp nhóm chia sẻ mã nguồn, xem lại thay đổi qua Pull Request và quản lý công việc."""
L2_TEXT = 'Video hướng dẫn tải Git cho Windows/macOS và cấu hình tên, email bằng lệnh git config --global.'
L2_VIDEO = 'https://www.youtube.com/watch?v=8JJ101D3knE'
QUIZ_TITLE = 'Kiểm tra nhanh: các lệnh Git cơ bản'
# (nội dung, loại, các lựa chọn, chỉ số đáp án đúng); học viên sẽ trả lời đúng 3/4 câu (sai câu 3)
QUESTIONS = [
    ('Lệnh nào dùng để tạo một repository Git mới trong thư mục hiện tại?', 'single_choice',
     ['git init', 'git start', 'git create', 'git new'], [0]),
    ('Lệnh nào dùng để lưu các thay đổi đã chọn vào lịch sử của repository?', 'single_choice',
     ['git save', 'git commit', 'git push', 'git store'], [1]),
    ('Những lệnh nào làm việc với repository trên máy chủ (remote)?', 'multiple_choice',
     ['git push', 'git pull', 'git status', 'git log'], [0, 1]),
    ('Lệnh "git status" cho biết trạng thái các tệp trong thư mục làm việc.', 'true_false', ['Đúng', 'Sai'], [0]),
]
ASSIGNMENT_TITLE = 'Thực hành: tạo repository đầu tiên'
ASSIGNMENT_TEXT = ('Tạo một repository mới trên máy, thêm tệp README.md, thực hiện ít nhất 2 commit. '
                   'Chụp màn hình kết quả lệnh "git log --oneline" và nộp dưới dạng tệp PDF.')
QUESTION_ASKED = 'Khi nào nên dùng git rebase thay vì git merge ạ?'
ANSWER = ('Dùng rebase khi muốn lịch sử commit thẳng hàng trên nhánh cá nhân chưa chia sẻ; '
          'với nhánh đã đẩy lên chung thì nên dùng merge để không viết lại lịch sử của người khác.')
ASSIGNMENT_GRADE = 8
# Mong đợi (grading-policy.md): Quiz 3/4 = 7.5; Bài tập 8; Tiến độ 4/4 = 10 -> 0.4*7.5 + 0.5*8 + 0.1*10 = 8.0 (Giỏi)
EXPECTED_FINAL = 8.0
EXPECTED_RANK = 'Giỏi'

issues = []   # {step, severity, message}
ctx = {}      # dữ liệu chia sẻ giữa các bước (id khóa học, mã lớp...)
current = {'step': 'chuẩn bị'}


def log(msg):
    print(msg, flush=True)


def issue(severity, message):
    """severity: 'chặn' (không đi tiếp được) | 'dữ liệu' (sai số liệu) | 'giao diện' (hiển thị/chữ)"""
    issues.append({'step': current['step'], 'severity': severity, 'message': message})
    log(f'   [{severity.upper()}] {message}')


# ---------------- API (chỉ dùng để chuẩn bị tài khoản và đối chiếu số liệu)
def api(method, path, token=None, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Content-Type': 'application/json', **({'Authorization': f'Bearer {token}'} if token else {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'{}')


def api_login(email, password):
    status, body = api('POST', '/auth/login', body={'email': email, 'password': password})
    if status != 200:
        raise RuntimeError(f'Không đăng nhập API được {email}: {status} {body.get("message")}')
    return body['data']['accessToken']


def make_user(admin, email, role, name):
    status, body = api('POST', '/users', admin, {'email': email, 'fullName': name, 'role': role, 'password': 'TamThoi@2026'})
    if status != 201:
        raise RuntimeError(f'Admin không tạo được {role}: {status} {body.get("message")}')
    token = api_login(email, 'TamThoi@2026')
    api('PATCH', '/users/me/password', token, {'currentPassword': 'TamThoi@2026', 'newPassword': PASS, 'confirmPassword': PASS})


# ---------------- tệp mẫu
def png_bytes(w=320, h=180, rgb=(17, 104, 189)):
    raw = b''.join(b'\x00' + bytes(rgb) * w for _ in range(h))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')


def pdf_bytes():
    return (b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj '
            b'3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n')


# ---------------- trình duyệt
class Actor:
    """Một người dùng với cửa sổ trình duyệt riêng; ghi lại lỗi JS và response API 4xx/5xx của bước hiện tại."""

    def __init__(self, browser, name, email, password, mobile=False):
        self.name, self.email, self.password = name, email, password
        self.context = browser.new_context(viewport={'width': 390, 'height': 844} if mobile else {'width': 1440, 'height': 900},
                                           accept_downloads=True)
        self.page = self.context.new_page()
        self.page.set_default_timeout(15000)
        self.page.on('pageerror', lambda e: issue('chặn', f'{self.name}: lỗi JavaScript: {e}'))
        self.page.on('response', self._on_response)
        self.expected_errors = set()

    def _on_response(self, r):
        if '/api/' in r.url and r.status >= 400 and 'refresh-token' not in r.url:
            key = f'{r.request.method} {re.sub(r"[0-9a-f-]{36}", ":id", r.url.split("/api/v1")[-1].split("?")[0])} {r.status}'
            if key not in self.expected_errors:
                try:
                    msg = r.json().get('message')
                except Exception:
                    msg = ''
                issue('chặn' if r.status >= 500 else 'dữ liệu', f'{self.name}: API lỗi {key} — {msg}')

    def login(self):
        p = self.page
        p.goto(f'{WEB}/auth/login')
        p.fill("input[placeholder='ban@email.com']", self.email)
        p.fill("input[placeholder='••••••••']", self.password)
        p.press("input[placeholder='••••••••']", 'Enter')
        p.wait_for_url(re.compile(r'/(student|teacher|manager|admin)/|/$'), timeout=15000)
        p.wait_for_load_state('networkidle')

    def go(self, path):
        self.page.goto(WEB + path)
        self.page.wait_for_load_state('networkidle')
        self.page.wait_for_timeout(400)

    def shot(self, name):
        shots = [f for f in os.listdir(OUT) if f.endswith('.png') and not f.startswith('_')]
        self.page.screenshot(path=os.path.join(OUT, f'{len(shots) + 1:02d}-{name}.png'))

    def toast_text(self):
        try:
            return self.page.locator('[data-sonner-toast]').last.inner_text(timeout=4000)
        except Exception:
            return ''

    def bell(self):
        """Mở chuông thông báo, trả về nội dung danh sách thông báo."""
        p = self.page
        p.reload()
        p.wait_for_load_state('networkidle')
        p.locator("button[aria-label*='hông báo']").first.click()
        p.wait_for_timeout(800)
        text = p.locator('body').inner_text()
        p.keyboard.press('Escape')
        return text


@contextmanager
def step(name):
    current['step'] = name
    log(f'\n== {name}')
    before = len(issues)
    try:
        yield
    except Exception as e:  # bước bị chặn: ghi lại, các bước sau vẫn chạy nếu đủ dữ liệu
        issue('chặn', f'{type(e).__name__}: {str(e).splitlines()[0][:300]}')
    log(f'   -> {"ĐẠT" if len(issues) == before else f"{len(issues) - before} vấn đề"}')


# ======================================================================
def step1_teacher_creates_course(gv):
    p = gv.page
    gv.go('/teacher/courses')
    p.get_by_role('button', name=re.compile('Tạo khóa mới')).first.click()
    p.get_by_label('Tên khóa học *').fill(COURSE_TITLE)
    p.get_by_label('Mô tả khóa học').fill(COURSE_DESC)
    category = p.get_by_label('Danh mục đào tạo')
    options = category.locator('option').all_inner_texts()
    it = next((o for o in options if re.search('công nghệ|lập trình|tin học', o, re.I)), None)
    if it:
        category.select_option(label=it)
    else:
        issue('giao diện', f'Không có danh mục CNTT để chọn (có: {options})')
    thumb = os.path.join(OUT, '_anh-bia.png')
    with open(thumb, 'wb') as f:
        f.write(png_bytes())
    p.locator("input[type=file][accept*='image']").set_input_files(thumb)
    gv.shot('gv-tao-khoa-hoc')
    p.get_by_role('button', name='Tạo khóa học & Soạn đề cương').click()
    p.wait_for_url(re.compile(r'/teacher/courses/[0-9a-f-]{36}/curriculum'))
    ctx['courseId'] = re.search(r'courses/([0-9a-f-]{36})', p.url).group(1)
    p.wait_for_load_state('networkidle')
    log(f'   khóa học {ctx["courseId"]}')

    # Chương + 4 bài
    p.get_by_placeholder('Tên chương mới...').fill(CHAPTER)
    p.get_by_role('button', name='Thêm chương').click()
    expect(p.get_by_text(f'1. {CHAPTER}')).to_be_visible()

    def add_lesson(title, kind, text='', video=''):
        p.get_by_role('button', name='Thêm bài học').first.click()
        p.get_by_label('Tiêu đề bài học').fill(title)
        p.get_by_label('Loại bài học').select_option(label=kind)
        if text:
            p.get_by_label('Nội dung').fill(text)
        if video:
            p.get_by_label('Video URL').fill(video)
        p.get_by_role('button', name='Tạo bài học').click()
        expect(p.locator('.chapter-lessons .lesson', has_text=title)).to_be_visible()

    add_lesson(L1, 'Lý thuyết', L1_TEXT)
    add_lesson(L2, 'Video', L2_TEXT, L2_VIDEO)
    add_lesson(L3, 'Quiz', 'Bài kiểm tra 4 câu, làm trong 10 phút.')
    add_lesson(L4, 'Bài tập', 'Thực hành tạo repository và nộp ảnh chụp kết quả.')
    gv.shot('gv-de-cuong')

    # Đề bài tập (bài 4)
    p.locator('.chapter-lessons .lesson', has_text=L4).click()
    p.get_by_role('button', name='Tạo đề bài tập').click()
    modal = p.locator('.modal')
    modal.get_by_label('Tiêu đề bài tập').fill(ASSIGNMENT_TITLE)
    modal.locator('textarea').first.fill(ASSIGNMENT_TEXT)
    modal.get_by_label(re.compile('Định dạng cho phép')).fill('pdf,zip')
    modal.get_by_label(re.compile('Dung lượng tối đa')).fill('10')
    modal.get_by_role('button', name='Tạo bài tập').click()
    expect(p.get_by_role('button', name='Sửa đề bài tập')).to_be_visible()

    # Đề quiz (bài 3) -> trang soạn đề
    p.locator('.chapter-lessons .lesson', has_text=L3).click()
    p.get_by_role('button', name='Tạo đề thi').click()
    modal = p.locator('.modal')
    modal.get_by_label('Tiêu đề bài kiểm tra').fill(QUIZ_TITLE)
    modal.get_by_label('Thời gian (phút)').fill('10')
    modal.get_by_label('Số lần làm tối đa').fill('2')
    modal.get_by_label('Điểm đạt (thang 10)').fill('5')
    modal.get_by_role('button', name='Tạo bài kiểm tra').click()
    p.wait_for_url(re.compile(r'/teacher/quizzes/[0-9a-f-]{36}'))
    ctx['quizId'] = re.search(r'quizzes/([0-9a-f-]{36})', p.url).group(1)
    p.wait_for_load_state('networkidle')

    types = {'single_choice': None, 'multiple_choice': None, 'true_false': None}
    for content, qtype, choices, correct in QUESTIONS:
        p.get_by_role('button', name='Thêm câu hỏi').click()
        modal = p.locator('.modal')
        modal.locator('textarea').first.fill(content)
        type_select = modal.get_by_label('Loại câu hỏi')
        if types[qtype] is None:
            types[qtype] = type_select.locator(f'option[value="{qtype}"]').inner_text()
        type_select.select_option(qtype)
        if qtype != 'true_false':
            for i, choice in enumerate(choices):
                modal.get_by_placeholder(f'Lựa chọn {"ABCDEF"[i]}').fill(choice)
        for i in correct:
            box = modal.get_by_label(f'Đánh dấu lựa chọn {"ABCDEF"[i]} là đáp án đúng')
            if not box.is_checked():
                box.check()
        if qtype == 'multiple_choice':  # ô A mặc định đúng: bỏ chọn những ô không thuộc đáp án
            for i in range(len(choices)):
                box = modal.get_by_label(f'Đánh dấu lựa chọn {"ABCDEF"[i]} là đáp án đúng')
                if i not in correct and box.is_checked():
                    box.uncheck()
        modal.get_by_role('button', name='Lưu câu hỏi').click()
        expect(p.locator('.modal')).to_have_count(0)
    p.get_by_role('button', name=re.compile('Công khai')).click()
    expect(p.get_by_text('Đề đã công khai')).to_be_visible()
    gv.shot('gv-soan-de-quiz')

    # Gửi duyệt
    gv.go(f'/teacher/courses/{ctx["courseId"]}/curriculum')
    p.get_by_role('button', name='Gửi duyệt').first.click()
    confirm = p.get_by_role('button', name=re.compile('Gửi duyệt|Xác nhận|Đồng ý'))
    if confirm.count() > 1:
        confirm.last.click()
    p.wait_for_timeout(1500)
    gv.shot('gv-gui-duyet')
    status = api('GET', f'/courses/{ctx["courseId"]}', api_login(TEACHER, PASS))[1].get('data', {}).get('status')
    if status != 'pending':
        issue('chặn', f'Sau khi gửi duyệt, trạng thái khóa là "{status}" (mong đợi pending)')


def local_input(dt):
    return dt.strftime('%Y-%m-%dT%H:%M')


def step2_manager_approves(ql, gv):
    p = ql.page
    text = ql.bell()
    if COURSE_TITLE not in text:
        issue('dữ liệu', 'Chuông của QL không có thông báo "khóa học mới chờ duyệt" cho khóa vừa gửi')
    ql.go('/manager/approvals')
    row = p.locator('tr', has_text=COURSE_TITLE)
    expect(row).to_be_visible()
    row.get_by_role('button').first.click()
    p.wait_for_url(re.compile(r'/manager/approvals/[0-9a-f-]{36}/review'))
    p.wait_for_load_state('networkidle')
    p.get_by_text(L1, exact=False).first.click()
    p.wait_for_timeout(1000)
    if 'Linus Torvalds' not in p.locator('body').inner_text():
        issue('dữ liệu', 'Trang duyệt không hiển thị nội dung bài học lý thuyết')
    ql.shot('ql-xem-noi-dung-duyet')
    p.get_by_role('button', name=re.compile('Duyệt & xuất bản')).click()
    p.wait_for_url(re.compile(r'/manager/approvals$'))
    status = api('GET', f'/courses/{ctx["courseId"]}', api_login(TEACHER, PASS))[1].get('data', {}).get('status')
    if status != 'published':
        raise RuntimeError(f'Sau khi duyệt, trạng thái khóa là "{status}" (mong đợi published)')
    if 'đã được duyệt' not in gv.bell().lower():
        issue('dữ liệu', 'GV không nhận thông báo "khóa học đã được duyệt"')


def step3_teacher_opens_class(gv):
    p = gv.page
    gv.go('/teacher/classes')
    p.get_by_role('button', name=re.compile('Mở lớp mới')).click()
    modal = p.locator('.modal')
    course_select = modal.get_by_label('Khóa học (đã công khai)')
    try:  # danh sách khóa học tải bất đồng bộ sau khi mở form
        expect(course_select.locator('option', has_text=STAMP)).to_have_count(1, timeout=10000)
    except AssertionError:
        raise RuntimeError('Khóa vừa duyệt không có trong danh sách chọn khi mở lớp')
    options = course_select.locator('option').all_inner_texts()
    option = next(o for o in options if STAMP in o)
    others = [o for o in options[1:] if 'Trần Minh Git' not in o]
    if others:  # BR-023: giảng viên chỉ mở lớp cho khóa học của mình
        issue('dữ liệu', f'Form mở lớp của GV liệt kê {len(others)} khóa học của giảng viên khác')
    course_select.select_option(label=option)
    modal.get_by_label('Tên lớp học').fill(f'Git cơ bản — Nhóm thử nghiệm ({STAMP})')
    today = datetime.now()
    modal.get_by_label('Ngày bắt đầu').fill(today.strftime('%Y-%m-%d'))
    modal.get_by_label('Ngày kết thúc').fill((today + timedelta(days=60)).strftime('%Y-%m-%d'))
    modal.get_by_role('button', name='Mở lớp').click()
    p.wait_for_url(re.compile(r'/teacher/classes/[0-9a-f-]{36}'))
    p.wait_for_load_state('networkidle')
    ctx['classId'] = re.search(r'classes/([0-9a-f-]{36})', p.url).group(1)
    ctx['classCode'] = p.locator('code.text-2xl').inner_text().strip()
    log(f'   lớp {ctx["classId"]}, mã {ctx["classCode"]}')
    gv.shot('gv-mo-lop')

    p.locator('button.tab', has_text='Bài tập').click()
    p.get_by_role('button', name=f'Giao {ASSIGNMENT_TITLE}').click()
    modal = p.locator('.modal')
    ctx['deadline'] = today + timedelta(days=3)
    modal.get_by_label('Hạn nộp (deadline)').fill(local_input(ctx['deadline']))
    modal.get_by_role('button', name='Giao bài').click()
    expect(p.locator('.modal')).to_have_count(0)
    expect(p.get_by_role('button', name='Chấm bài')).to_be_visible()

    p.locator('button.tab', has_text='Bài kiểm tra').click()
    p.get_by_role('button', name=f'Đặt lịch {QUIZ_TITLE}').click()
    modal = p.locator('.modal')
    modal.get_by_label('Mở đề từ').fill(local_input(today - timedelta(hours=1)))
    modal.get_by_label('Đóng đề lúc').fill(local_input(today + timedelta(days=5)))
    modal.get_by_role('button', name='Lưu lịch').click()
    expect(p.locator('.modal')).to_have_count(0)
    gv.shot('gv-dat-lich-quiz')


def card_of(hv):
    return hv.page.locator('.course-row').filter(has=hv.page.locator('h3', has_text=STAMP))


def step4_student_enrolls(hv):
    p = hv.page
    hv.go('/student/my-courses')
    p.get_by_role('button', name='Nhập mã lớp').first.click()
    p.get_by_label('Mã lớp').fill(ctx['classCode'])
    p.get_by_role('button', name='Tham gia lớp').click()
    p.wait_for_url(re.compile(rf'/student/classes/{ctx["classId"]}'))
    hv.go('/student/my-courses')
    card = card_of(hv)
    expect(card).to_be_visible()
    text = card.inner_text()
    hv.shot('hv-khoa-hoc-cua-toi-sau-ghi-danh')
    # Bài tập hạn +3 ngày, quiz đóng +5 ngày -> 2 việc sắp đến hạn
    if '2 việc sắp đến hạn' not in text:
        issue('dữ liệu', f'Thẻ lớp không hiện "2 việc sắp đến hạn" (thẻ: {text!r})')
    card.get_by_role('button', name='Bắt đầu học').click()
    p.wait_for_url(re.compile(r'/student/courses/.+/learn/'))
    p.wait_for_load_state('networkidle')
    try:
        expect(p.locator('.lesson-item.active')).to_contain_text(L1, timeout=10000)
    except AssertionError:
        issue('dữ liệu', 'Nút "Bắt đầu học" không mở bài đầu tiên của khóa học')


def step5_student_learns_and_asks(hv):
    p = hv.page
    p.get_by_role('button', name='Đánh dấu đã hoàn thành').click()
    expect(p.get_by_text('Đã hoàn thành bài học này')).to_be_visible()
    p.get_by_placeholder(re.compile('Bạn có thắc mắc về bài học này')).fill(QUESTION_ASKED)
    p.get_by_role('button', name='Đăng câu hỏi').click()
    expect(p.get_by_text(QUESTION_ASKED)).to_be_visible()
    hv.shot('hv-hoc-bai-va-hoi')
    p.get_by_role('button', name=re.compile('Bài tiếp theo')).click()
    p.wait_for_load_state('networkidle')
    p.wait_for_timeout(500)
    if L2 not in p.locator('body').inner_text():
        issue('dữ liệu', '"Bài tiếp theo" không chuyển sang bài video')
    hv.shot('hv-bai-video')
    p.get_by_role('button', name='Đánh dấu đã hoàn thành').click()
    expect(p.get_by_text('Đã hoàn thành bài học này')).to_be_visible()


def step6_teacher_answers(gv, hv):
    p = gv.page
    if QUESTION_ASKED[:30] not in gv.bell() and 'câu hỏi' not in gv.bell().lower():
        issue('dữ liệu', 'GV không nhận thông báo khi học viên đặt câu hỏi')
    gv.go(f'/teacher/classes/{ctx["classId"]}?tab=discussions')
    thread = p.locator('div', has_text=QUESTION_ASKED).filter(has=p.get_by_role('button', name='Trả lời')).last
    thread.get_by_role('button', name='Trả lời').click()
    p.get_by_placeholder('Viết câu trả lời...').fill(ANSWER)
    p.get_by_role('button', name='Gửi trả lời').click()
    expect(p.get_by_text(ANSWER[:40])).to_be_visible()
    # Nút hành động trên câu hỏi (khác tab lọc "Đã giải đáp" cùng tên)
    p.locator('button.ui-btn', has_text='Đã giải đáp').first.click()
    expect(p.get_by_text('1 đã giải đáp')).to_be_visible()
    gv.shot('gv-tra-loi-thao-luan')
    if 'trả lời' not in hv.bell().lower():
        issue('dữ liệu', 'HV không nhận thông báo khi giảng viên trả lời câu hỏi')


def step7_student_quiz_and_submit(hv):
    p = hv.page
    # Quiz: đúng câu 1, 2, 4; câu 3 (nhiều đáp án) chỉ chọn "git push" -> thiếu -> sai. Mong đợi 7,5/10
    picks = {QUESTIONS[0][0]: ['git init'], QUESTIONS[1][0]: ['git commit'], QUESTIONS[2][0]: ['git push'], QUESTIONS[3][0]: ['Đúng']}
    hv.go(f'/student/my-courses')
    card_of(hv).get_by_role('button', name='Tiếp tục').click()
    p.wait_for_url(re.compile(r'/learn/'))
    try:
        expect(p.locator('.lesson-item.active')).to_contain_text(L3, timeout=10000)
    except AssertionError:
        issue('dữ liệu', f'"Tiếp tục" không mở bài kế tiếp chưa học (bài quiz), đang ở: {p.locator(".lesson-item.active").all_inner_texts()}')
    p.get_by_role('button', name='Làm bài kiểm tra').click()
    p.wait_for_load_state('networkidle')
    p.get_by_role('button', name=re.compile('Bắt đầu làm bài')).click()
    p.wait_for_selector('.question-card')
    for _ in QUESTIONS:
        content = p.locator('.question-card h2').inner_text().strip()
        for choice in picks.get(content, []):
            p.locator('.question-card label.answer', has=p.locator('b')).filter(has_text=re.compile(rf'^[A-F]{re.escape(choice)}$')).click()
        nxt = p.get_by_role('button', name='Câu tiếp theo →')
        if nxt.count():
            nxt.click()
    hv.shot('hv-lam-quiz')
    p.locator('.quiz-actions').get_by_role('button', name='Nộp bài').click()
    p.get_by_role('button', name='Nộp bài ngay').click()
    p.wait_for_url(re.compile(r'/result/'))
    try:
        expect(p.get_by_text('Số câu đúng')).to_be_visible(timeout=10000)
        expect(p.locator('main, body').first).to_contain_text(re.compile(r'7[.,]5[\s\S]*3/4'))
    except AssertionError:
        issue('dữ liệu', 'Trang kết quả không hiện điểm 7,5 (mong đợi đúng 3/4 câu)')
    hv.shot('hv-ket-qua-quiz')

    # Bài tập: mở từ bài 4
    hv.go('/student/my-courses')
    card_of(hv).get_by_role('button', name='Tiếp tục').click()
    p.wait_for_load_state('networkidle')
    p.get_by_role('button', name='Xem đề & nộp bài').click()
    p.wait_for_url(re.compile(r'/assignments/'))
    pdf = os.path.join(OUT, '_bai-lam.pdf')
    with open(pdf, 'wb') as f:
        f.write(pdf_bytes())
    p.locator('input[type=file]').set_input_files(pdf)
    p.get_by_placeholder('Ghi chú cho giảng viên (tùy chọn)').fill('Em nộp ảnh chụp git log --oneline ạ.')
    p.get_by_role('button', name='Nộp bài').click()
    p.wait_for_timeout(2500)
    p.wait_for_load_state('networkidle')
    hv.shot('hv-nop-bai-tap')
    if not re.search('đã nộp|chờ chấm|nộp lại', p.locator('body').inner_text(), re.I):
        issue('dữ liệu', 'Sau khi nộp bài tập, trang không hiện trạng thái đã nộp')

    hv.go('/student/my-courses')
    text = card_of(hv).inner_text()
    hv.shot('hv-khoa-hoc-cua-toi-sau-khi-lam')
    if '4/4 bài' not in text:
        issue('dữ liệu', f'Sau khi làm quiz và nộp bài, tiến độ không phải 4/4 (thẻ: {text!r})')
    if 'việc' in text:
        issue('dữ liệu', f'Đã làm hết nhưng thẻ vẫn còn việc cần làm (thẻ: {text!r})')


def step8_teacher_grades(gv):
    p = gv.page
    gv.go(f'/teacher/classes/{ctx["classId"]}?tab=assignments')
    p.get_by_role('button', name='Chấm bài').click()
    p.wait_for_load_state('networkidle')
    p.get_by_role('button', name='Chấm', exact=True).first.click()
    modal = p.locator('.modal')
    modal.locator('input[type=number]').fill(str(ASSIGNMENT_GRADE))
    modal.get_by_placeholder('Điểm mạnh, điểm cần cải thiện...').fill('Bài làm đúng yêu cầu, commit message rõ ràng.')
    modal.get_by_role('button', name='Lưu điểm').click()
    expect(p.locator('.modal')).to_have_count(0)
    p.wait_for_timeout(800)
    gv.shot('gv-cham-bai')


def step9_student_sees_grades(hv):
    p = hv.page
    if 'chấm' not in hv.bell().lower():
        issue('dữ liệu', 'HV không nhận thông báo khi bài tập được chấm')
    hv.shot('hv-chuong-thong-bao')
    hv.go('/student/grades')
    p.wait_for_timeout(1000)
    section = p.locator('.portal-card', has_text=STAMP).first
    text = section.inner_text() if section.count() else p.locator('body').inner_text()
    hv.shot('hv-diem-so')
    if not re.search(r'\b8([.,]0+)?\s*/10', text) or EXPECTED_RANK not in text:
        issue('dữ liệu', f'Điểm tổng kết không phải {EXPECTED_FINAL} – {EXPECTED_RANK} (đoạn hiển thị: {text[:200]!r})')
    status, body = api('GET', f'/classes/{ctx["classId"]}/my-grades', api_login(STUDENT, PASS))
    me = (body.get('data') or {}).get('me') or {}
    ctx['finalScore'], ctx['ranking'] = me.get('finalScore'), me.get('ranking')
    if status != 200 or float(me.get('finalScore') or -1) != EXPECTED_FINAL:
        issue('dữ liệu', f'API my-grades trả điểm {me.get("finalScore")} {me.get("ranking")} (mong đợi {EXPECTED_FINAL} {EXPECTED_RANK})')


def step10_manager_reports(ql):
    p = ql.page
    ql.go('/manager/reports')
    p.wait_for_timeout(1500)
    ql.shot('ql-bao-cao')
    if STAMP not in p.locator('body').inner_text():
        issue('dữ liệu', 'Lớp thử không có trong trang Báo cáo của Quản lý')
    ql.go(f'/manager/classes/{ctx["classId"]}?tab=gradebook')
    ql.shot('ql-bang-diem-lop')
    with p.expect_download() as info:
        p.get_by_role('button', name='Xuất Excel').click()
    xlsx = os.path.join(OUT, '_bang-diem.xlsx')
    info.value.save_as(xlsx)
    script = ("import ExcelJS from 'exceljs'; const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(process.argv[1]);"
              "const out = {}; wb.eachSheet(s => { out[s.name] = []; s.eachRow(r => out[s.name].push(r.values.slice(1).map(v => v && v.result !== undefined ? v.result : v))); });"
              "console.log(JSON.stringify(out));")
    res = subprocess.run(['node', '--input-type=module', '-e', script, xlsx], cwd=os.path.join(ROOT, 'backend'),
                         capture_output=True, text=True, encoding='utf-8')
    sheets = json.loads(res.stdout or '{}')
    ctx['excelSheets'] = list(sheets)
    if len(sheets) != 4:
        issue('dữ liệu', f'File Excel có {len(sheets)} sheet (mong đợi 4): {list(sheets)}')
    rows = next(iter(sheets.values()), [])
    row = next((r for r in rows if any(isinstance(c, str) and 'Nguyễn Văn Học' in c for c in r)), None)
    if not row or not any(isinstance(c, (int, float)) and abs(c - EXPECTED_FINAL) < 0.01 for c in row) or EXPECTED_RANK not in row:
        issue('dữ liệu', f'Dòng của học viên trong Excel không có điểm {EXPECTED_FINAL} – {EXPECTED_RANK}: {row}')


# ======================================================================
def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))
    admin = api_login('admin@eduverse.com', SEED_PASS)
    make_user(admin, TEACHER, 'teacher', 'ThS. Trần Minh Git (thử)')
    make_user(admin, STUDENT, 'student', 'Nguyễn Văn Học (thử)')
    log(f'Tài khoản thử: {TEACHER}, {STUDENT}')

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        gv = Actor(browser, 'GV', TEACHER, PASS)
        gv.login()
        ql = Actor(browser, 'QL', MANAGER, SEED_PASS)
        ql.login()
        with step('1. GV tạo khóa học, soạn bài, quiz, bài tập, gửi duyệt'):
            step1_teacher_creates_course(gv)
        if 'courseId' in ctx:
            with step('2. QL nhận thông báo, xem nội dung và duyệt khóa học'):
                step2_manager_approves(ql, gv)
            with step('3. GV mở lớp, giao bài tập, đặt lịch quiz'):
                step3_teacher_opens_class(gv)
        if 'classCode' in ctx:
            hv = Actor(browser, 'HV', STUDENT, PASS)
            hv.login()
            with step('4. HV nhập mã lớp, xem Khóa học của tôi, bắt đầu học'):
                step4_student_enrolls(hv)
            with step('5. HV học bài, đánh dấu hoàn thành, đặt câu hỏi thảo luận'):
                step5_student_learns_and_asks(hv)
            with step('6. GV nhận thông báo, trả lời thảo luận; HV nhận thông báo'):
                step6_teacher_answers(gv, hv)
            with step('7. HV làm quiz và nộp bài tập'):
                step7_student_quiz_and_submit(hv)
            with step('8. GV chấm bài tập'):
                step8_teacher_grades(gv)
            with step('9. HV nhận thông báo, xem điểm tổng kết'):
                step9_student_sees_grades(hv)
            with step('10. QL xem báo cáo, xuất Excel bảng điểm'):
                step10_manager_reports(ql)
        browser.close()


if __name__ == '__main__':
    try:
        main()
    finally:
        if not KEEP:
            subprocess.run(['node', 'src/scripts/secTestCleanup.js'], cwd=os.path.join(ROOT, 'backend'))
        report = {'runAt': datetime.now().isoformat(), 'issues': issues, 'context': ctx}
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, 'ket-qua.json'), 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2, default=str)
        log(f'\nTổng cộng {len(issues)} vấn đề. Ảnh và kết quả: {OUT}')
