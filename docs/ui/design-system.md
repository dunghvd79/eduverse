---
name: EduVerse Enterprise UI
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#414752'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727783'
  outline-variant: '#c1c6d4'
  surface-tint: '#005fb0'
  primary: '#005096'
  on-primary: '#ffffff'
  primary-container: '#1168bd'
  on-primary-container: '#dce8ff'
  inverse-primary: '#a6c8ff'
  secondary: '#44617e'
  on-secondary: '#ffffff'
  secondary-container: '#c0ddff'
  on-secondary-container: '#45617f'
  tertiary: '#00557a'
  on-tertiary: '#ffffff'
  tertiary-container: '#006e9e'
  on-tertiary-container: '#d2eaff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a6c8ff'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#004787'
  secondary-fixed: '#cfe4ff'
  secondary-fixed-dim: '#acc9eb'
  on-secondary-fixed: '#001d34'
  on-secondary-fixed-variant: '#2c4965'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  tabular-number:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

# 🎨 Design System & UI Specification — EduVerse Enterprise UI

> **Phiên bản:** 1.0  
> **Cập nhật lần cuối:** 26/09/2026  
> **Áp dụng cho:** Toàn bộ giao diện React SPA (Frontend EduVerse)  
> **Mục tiêu:** Cung cấp bộ quy chuẩn thiết kế (Design Tokens) và hướng dẫn cấu hình chi tiết cho Tailwind CSS nhằm đảm bảo tính thẩm mỹ, nhất quán và chuẩn mực Corporate SaaS.

---

## 1. Brand & Style Philosophy

Hệ thống thiết kế nhắm đến các tác vụ quản lý đào tạo và vận hành giáo dục phức tạp ở quy mô doanh nghiệp / trường đại học. Trọng tâm thiết kế hướng tới:
- **Tối đa hóa sự rõ ràng về mặt thị giác:** Tối ưu tỉ lệ dữ liệu / mực hiển thị (data-to-ink ratio), giúp người dùng đọc và nắm bắt khối lượng thông tin lớn mà không mỏi mắt.
- **Tính dự đoán cao về mặt cấu trúc:** Các luồng nghiệp vụ sâu (quản lý học tập, đề cương bài giảng, sổ điểm ma trận, chấm bài tập) tuân thủ nhịp điệu không gian và phân cấp thị giác nhất quán.
- **Phong cách Corporate SaaS uy quyền và chuẩn mực:** Tương tự các nền tảng giáo dục và quản trị hàng đầu thế giới (Coursera, Atlassian, Canvas LMS). Mọi component đều được thiết kế để giảm thiểu ma sát thao tác cho Quản trị viên, Giảng viên và Học viên.

---

## 2. Bảng Màu & Hệ Thống Phân Cấp (Colors)

Hệ thống màu thiết lập trật tự thị giác rõ ràng cho mô hình quản trị doanh nghiệp:

### 2.1. Màu Thương hiệu & Hành động Chính (Brand Palette)
- **Primary (`#1168bd` / `#005096`):** Điểm nhấn tương tác trung tâm, nút hành động chính (Primary CTA), viền focus của form nhập liệu, highlight menu điều hướng đang kích hoạt.
- **Secondary (`#0c2d48` / `#44617e`):** Xanh navy đậm cấu trúc, sử dụng cho khung sườn hệ thống (Sidebar cố định), thanh tiêu đề phân cấp cao và nhận diện thương hiệu tổ chức.
- **Tertiary (`#0ea5e9` / `#006e9e`):** Xanh cyan điểm nhấn, dành cho thanh tiến độ học tập (Progress Bar), callout thông tin quan trọng và các huy hiệu ngữ cảnh.

### 2.2. Bề Mặt & Màu Trung Tính (Neutrals & Surfaces)
- **Base Canvas:** `#f8fafc` (Slate 50) hoặc `#f8f9ff` (Muted Indigo Canvas).
- **Primary Surface / Cards:** `#ffffff` (Pure White).
- **Secondary Surface:** `#f1f5f9` (Slate 100) cho header bảng dữ liệu, thanh tiến trình chưa hoàn thành, và sub-panels.
- **Borders & Dividers:** `#e2e8f0` (Slate 200) và viền ngoài `#cbd5e1` (Slate 300).
- **Text Neutral Muted:** `#64748b` (Slate 500) cho chú thích, nhãn phụ, placeholder.
- **Text Neutral Body:** `#334155` (Slate 700) cho văn bản nội dung thông thường.
- **Text Neutral Heading:** `#0f172a` (Slate 900) cho tiêu đề khối, tên khóa học, thống kê chính.

### 2.3. Màu Ngữ Nghĩa Chức Năng (Semantic Statuses)
- **Success (`#10b981` / `#16a34a`):** Đạt bài kiểm tra, hoàn thành bài học, duyệt khóa học thành công, tài khoản kích hoạt.
- **Warning (`#f59e0b` / `#eab308`):** Sắp đến hạn nộp bài tập, khóa học đang chờ duyệt (`pending_approval`), hàng đợi chấm bài.
- **Destructive / Error (`#ef4444` / `#ba1a1a`):** Không đạt quiz, bài nộp trễ hạn, từ chối phê duyệt khóa học, khóa tài khoản vi phạm.

---

## 3. Quy Chuẩn Kiểu Chữ (Typography)

Toàn bộ hệ thống giao diện sử dụng đồng nhất phông chữ **`Inter`** để đạt độ trung tính cao nhất và khả năng đọc tuyệt vời ở các tỷ lệ hiển thị nhỏ:

- **Tabular Figures (`tabular-nums`):** Tất cả dashboard thống kê, bảng điểm số, bảng học viên, đồng hồ thi trắc nghiệm đếm ngược và phần trăm tiến độ **bắt buộc kích hoạt OpenType tabular figures**:
  ```css
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  ```
- **Tracking & Hierarchy:**
  - Tiêu đề cấp cao (Display, Headline-lg) sử dụng khoảng cách chữ co nhẹ (`letterSpacing: -0.025em` đến `-0.015em`) để giao diện trông chắc chắn và hiện đại.
  - Bảng dữ liệu dày đặc và nhãn meta-tags sử dụng font-weight `600` (Semibold) ở kích cỡ nhỏ (`12px` và `14px`) để giữ nét sắc sảo trên nền viền.

---

## 4. Bố Cục & Nhịp Điệu Không Gian (Layout & Spacing)

### 4.1. Khung Vỏ Ứng Dụng (Application Shell)
- **Sidebar:** Độ rộng cố định `260px`, có thể thu gọn (collapse) thành thanh rail biểu tượng `64px` trên màn hình vừa hoặc Drawer trên mobile.
- **Header:** Chiều cao cố định `64px` (`4rem`) với đường viền dưới mỏng 1px (`#e2e8f0`).
- **Viewport Canvas:** Khung layout linh hoạt với độ rộng tối đa nội dung `1600px` trên màn hình độ phân giải siêu cao (Ultra-wide), đảm bảo các bảng dữ liệu rộng và dòng đọc bài giảng không bị kéo dài quá mức.

### 4.2. Lưới & Nhịp Điệu Padding
- **Hệ thống Lưới 12 Cột:** Khoảng cách giữa các cột (gutters) là `1.5rem` (`24px`) trên Desktop (`≥ 1024px`), co về 1 cột trên Mobile (`< 768px`).
- **Quy tắc Base-4 Spacing:** Mọi padding và margin tuân thủ bội số của 4: `4px (space-xs)`, `8px (space-sm)`, `16px (space-md)`, `24px (space-lg)`, `32px (space-xl)`.
  - Ô trong bảng dữ liệu: padding dọc `8px` hoặc `12px`.
  - Thẻ Card nội dung: padding từ `16px` đến `24px`.

---

## 5. Độ Nổi & Chiều Sâu Thị Giác (Elevation & Depth)

Sự phân tách trực quan ưu tiên sử dụng **đường viền nét mảnh (hairline borders 1px)** thay vì hiệu ứng đổ bóng mờ nặng nề:

- **Hairline Borders:** Các bề mặt phẳng sử dụng viền vi mô `1px solid #e2e8f0`. Độ sâu phân lớp thể hiện qua sự tương phản nền: Canvas nền `#f8fafc` nằm dưới Cards `#ffffff`, kết hợp sub-headers `#f1f5f9`.
- **Hệ thống Đổ bóng Nhẹ (Ambient Shadow System):**
  - **Flat Layer (Cards, Metric Tiles):** `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0`.
  - **Dropdowns & Popovers:** `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0`.
  - **Modals & Slide-over Drawers:** `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`.

---

## 6. Hình Khối & Độ Bo Góc (Shapes & Radii)

Quy chuẩn hình khối duy trì phong cách **Soft Geometry** sắc nét:
- Nút bấm, ô input, bảng dữ liệu, card bao ngoài: `rounded: 0.25rem (4px)` hoặc `rounded-md: 0.375rem (6px)` để giữ tính kỹ thuật và nghiêm túc.
- Huy hiệu trạng thái (Status Chips / Badges): Dùng `rounded-full (9999px)` dạng viên thuốc hoặc `rounded-sm (2px)` để phân biệt rõ rệt với nút bấm tương tác.

---

## 7. Quy Chuẩn Chi Tiết Từng Component (Component Specifications)

### 7.1. Nút Bấm (Buttons)
- **Primary Button:** Nền `#1168bd`, chữ `#ffffff`, hover `#0e5aa5`, active `#0b4782`. Focus ring: `2px solid #1168bd` với offset 2px.
- **Secondary Button:** Nền `#ffffff`, viền `1px solid #cbd5e1`, chữ `#334155`. Hover: nền `#f8fafc`, viền `#94a3b8`.
- **Destructive Button:** Nền `#ef4444`, chữ `#ffffff`. Phiên bản Outline: nền trắng, viền `#fca5a5`, chữ `#b91c1c`.

### 7.2. Ô Nhập Liệu & Form Controls (Inputs & Selects)
- Chiều cao chuẩn `40px` (Default) hoặc `32px` (Compact trong bảng dữ liệu).
- Nền `#ffffff`, viền `1px solid #cbd5e1`, phông chữ `0.875rem` (`text-sm`).
- **Focus State:** `focus:outline-none focus:border-[#1168bd] focus:ring-2 focus:ring-[#1168bd]/20`.
- **Error State:** Viền chuyển sang `#ef4444` và focus ring `#ef4444/20`, hiển thị câu báo lỗi màu đỏ ngay dưới input.

### 7.3. Bảng Dữ Liệu Doanh Nghiệp (Data Tables)
- **Header:** Nền `#f1f5f9`, chữ `#475569`, in hoa nhẹ `0.75rem`, letter-spacing `0.05em`, viền dưới `1px solid #e2e8f0`.
- **Hàng (Rows):** Hiệu ứng hover mềm `#f8fafc`, phân cách bằng đường viền dưới `1px solid #f1f5f9`. Chiều cao hàng compact: `36px` (sổ điểm/thống kê), hàng tiêu chuẩn: `48px` (danh sách học viên/khóa học).

### 7.4. Thẻ Đo Lường & Chỉ Số (Metric Cards & Trend Badges)
- Nền `#ffffff`, viền `1px solid #e2e8f0`, padding `16px` đến `20px`.
- Chỉ số hiển thị số lớn `1.75rem` định dạng font `tabular-nums` semibold.
- Huy hiệu tăng trưởng (Trend badge): Kèm icon mũi tên, nền xanh `#ecfdf5` chữ `#065f46` (tăng) hoặc nền đỏ `#fef2f2` chữ `#991b1b` (giảm).

### 7.5. Huy Hiệu Trạng Thái (Status Chips)
- Kích thước chữ `0.75rem`, font-weight `600`:
  - **Completed / Passed:** Nền `#d1fae5`, chữ `#065f46`.
  - **In Progress:** Nền `#e0f2fe`, chữ `#0369a1`.
  - **Pending / At Risk:** Nền `#fef3c7`, chữ `#92400e`.
  - **Overdue / Failed:** Nền `#fee2e2`, chữ `#991b1b`.

### 7.6. Phản Hồi, Toast & Skeleton
- **Toast Notifications:** Cố định góc dưới bên phải màn hình (độ rộng `360px`), nền trắng, đổ bóng popover và có vạch màu trạng thái 4px ở mép trái.
- **Skeleton Loading:** Nền `#e2e8f0` nhấp nháy chuyển động (`animate-pulse`) sang `#f1f5f9` có hiệu ứng bóng sáng shimmer.
- **Empty States:** Khung căn giữa với biểu tượng màu nhạt trong vòng tròn xám `#f1f5f9`, tiêu đề in đậm, mô tả ngắn và một nút bấm hành động chính.

---

## 8. File Mẫu Cấu Hình Tailwind CSS (`tailwind.config.js`)

> [!TIP]
> Hãy sao chép file cấu hình dưới đây vào thư mục `frontend/tailwind.config.js` để tích hợp toàn bộ Design Tokens vào dự án:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand Colors
        primary: {
          DEFAULT: '#1168bd',
          dark: '#005096',
          container: '#1168bd',
          on: '#ffffff',
          'on-container': '#dce8ff',
        },
        secondary: {
          DEFAULT: '#0c2d48',
          light: '#44617e',
          container: '#c0ddff',
          on: '#ffffff',
        },
        tertiary: {
          DEFAULT: '#0ea5e9',
          dark: '#00557a',
          container: '#006e9e',
          on: '#ffffff',
        },
        // Surfaces & Backgrounds
        surface: {
          DEFAULT: '#f8f9ff',
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          container: '#e5eeff',
          'container-low': '#eff4ff',
          'container-lowest': '#ffffff',
          'container-high': '#dce9ff',
          'on': '#0b1c30',
          'on-variant': '#414752',
        },
        // System Semantics
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          on: '#ffffff',
        },
        success: {
          DEFAULT: '#10b981',
          container: '#d1fae5',
          text: '#065f46',
        },
        warning: {
          DEFAULT: '#f59e0b',
          container: '#fef3c7',
          text: '#92400e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        flat: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        popover: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        drawer: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}
```

---

_Tài liệu Design System EduVerse Enterprise UI là tiêu chuẩn hình ảnh bắt buộc khi xây dựng giao diện người dùng cho dự án._
