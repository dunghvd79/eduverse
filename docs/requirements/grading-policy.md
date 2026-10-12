# Quy Tắc Tính Điểm Tổng Kết — EduVerse

> **Trạng thái:** ✅ Đã chốt ngày 12/10/2026 (dunghvd79, đại diện nhóm)  
> **Áp dụng cho:** Xuất bảng điểm lớp `GET /api/v1/classes/:id/grades/export-excel` ([`api-classes.md`](../api/api-classes.md) mục 2.13, `UC-GRADE-003`), trang Sổ điểm của Giảng viên, trang Điểm số của Học viên.  
> **Tài liệu liên quan:** [`business-rules.md`](business-rules.md) (BR-034 → BR-038), [`api-quizzes.md`](../api/api-quizzes.md), [`api-assignments.md`](../api/api-assignments.md), [`schema.md`](../database/schema.md)

---

## 1. Các quyết định đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Tỷ trọng các thành phần | **Bài kiểm tra (Quiz) 40% · Bài tập (Assignment) 50% · Tiến độ học 10%** |
| 2 | Một bài kiểm tra làm nhiều lần thì lấy điểm nào? | **Điểm cao nhất** trong các lần làm |
| 3 | Ngưỡng xếp loại | **Giỏi ≥ 8 · Khá ≥ 6.5 · Trung bình ≥ 5 · Chưa đạt < 5** |
| 4 | Bài kiểm tra chưa làm / bài tập chưa nộp | **Tính 0 điểm** (vẫn có trong mẫu số khi tính trung bình) |
| 5 | Lớp không có bài kiểm tra hoặc không có bài tập nào | **Bỏ thành phần đó, chia lại tỷ trọng theo tỷ lệ** (mục 6 - E1) |
| 6 | Bài tập đã nộp nhưng GV chưa chấm | **Tạm tính 0**, file Excel ghi "Chưa chấm" (mục 6 - E2) |
| 7 | Bài tập bị yêu cầu nộp lại | **Dùng điểm lần chấm gần nhất**, chưa từng chấm thì 0 (mục 6 - E3) |

---

## 2. Công thức

Mọi điểm thành phần đều ở **thang 10**.

$$\text{Điểm tổng kết} = \text{ROUND}\big(0.4 \times Q + 0.5 \times A + 0.1 \times P,\; 2\big)$$

| Ký hiệu | Thành phần | Cách tính |
|:---:|---|---|
| $Q$ | **Điểm TB Bài kiểm tra** | Trung bình cộng (không trọng số) điểm của **tất cả bài kiểm tra đã công khai** trong khóa học của lớp. Mỗi bài lấy **điểm cao nhất** của học viên trong lớp đó; chưa làm lần nào = **0** |
| $A$ | **Điểm TB Bài tập** | Trung bình cộng điểm của **tất cả bài tập** được giao cho lớp. Mỗi bài lấy điểm GV chấm (`assignment_submissions.grade`, thang 10); chưa nộp = **0** |
| $P$ | **Điểm Tiến độ** | $\dfrac{\text{Số bài học đã hoàn thành}}{\text{Tổng số bài học của khóa}} \times 10$ (cùng số liệu với báo cáo tiến độ `GET /classes/:id/progress`) |

- Điểm thành phần và điểm tổng kết **làm tròn 2 chữ số thập phân** (VD: 8.333 → 8.33).
- Lượt làm bài kiểm tra bị hết giờ (`timed_out`) có điểm 0 và vẫn được xét khi lấy điểm cao nhất.

---

## 3. Xếp loại

| Xếp loại | Điều kiện (điểm tổng kết) |
|---|---|
| **Giỏi** | ≥ 8.00 |
| **Khá** | ≥ 6.50 và < 8.00 |
| **Trung bình** | ≥ 5.00 và < 6.50 |
| **Chưa đạt** | < 5.00 |

---

## 4. Ví dụ minh họa

Lớp có **3 bài kiểm tra**, **2 bài tập**, khóa học có **20 bài học**. Học viên A:

| Thành phần | Dữ liệu | Điểm |
|---|---|---|
| Bài kiểm tra 1 | Làm 2 lần: 6.0 và 8.5 → lấy cao nhất | 8.5 |
| Bài kiểm tra 2 | Làm 1 lần | 7.0 |
| Bài kiểm tra 3 | **Chưa làm** | 0 |
| → $Q$ | (8.5 + 7.0 + 0) / 3 | **5.17** |
| Bài tập 1 | GV chấm | 9.0 |
| Bài tập 2 | GV chấm | 7.0 |
| → $A$ | (9.0 + 7.0) / 2 | **8.00** |
| → $P$ | Hoàn thành 16/20 bài học → 16/20 × 10 | **8.00** |

$$\text{Tổng kết} = 0.4 \times 5.17 + 0.5 \times 8.00 + 0.1 \times 8.00 = 2.068 + 4.00 + 0.80 = 6.87 \;\Rightarrow\; \textbf{Khá}$$

---

## 5. Phạm vi dữ liệu

- **Học viên:** chỉ học viên đang `active` trong lớp tại thời điểm xuất bảng điểm (học viên đã bị xóa khỏi lớp — `dropped` — không xuất hiện).
- **Bài kiểm tra:** chỉ đề **đã công khai** (`is_published = true`, chưa xóa) thuộc khóa học của lớp. Đề đang bị tạm khóa cho lớp (`class_quizzes.is_active = false`) **vẫn được tính**.
- **Bài tập:** các bài tập đã được giao cho lớp (có bản ghi `class_assignments`).
- **Thời điểm:** bảng điểm là ảnh chụp tại lúc xuất file. Bài kiểm tra/bài tập còn hạn mà học viên chưa làm/nộp vẫn tính 0 tại thời điểm đó.

---

## 6. Trường hợp đặc biệt — ✅ đã chốt 12/10/2026

| # | Trường hợp | Quy tắc |
|---|---|---|
| E1 | Lớp **không có bài kiểm tra** hoặc **không có bài tập** nào | Bỏ thành phần đó khỏi công thức và **chia lại tỷ trọng theo tỷ lệ** các phần còn lại. VD không có bài tập: Tổng kết = (0.4·Q + 0.1·P) / 0.5 = 0.8·Q + 0.2·P. Không có cả hai: Tổng kết = P |
| E2 | Bài tập **đã nộp nhưng GV chưa chấm** | Tạm tính **0** và ghi chú "Chưa chấm" trong file Excel để GV biết cần chấm trước khi chốt điểm |
| E3 | Bài tập GV yêu cầu **nộp lại** (`resubmission_requested`) | Dùng điểm của lần chấm gần nhất nếu có, không có thì tính 0 |

---

_Cập nhật lần cuối: 12/10/2026_
