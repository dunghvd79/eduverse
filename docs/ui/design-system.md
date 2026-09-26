---
name: EduVerse Enterprise UI
colors:
  # App Canvas & Surface Hierarchy (Single Source of Truth)
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
  
  # Primary Brand Palette (C4 Standard Blue)
  primary: '#1168bd'
  primary-hover: '#0e5aa5'
  primary-active: '#0b4782'
  primary-dark: '#005096'
  on-primary: '#ffffff'
  primary-container: '#1168bd'
  on-primary-container: '#dce8ff'
  inverse-primary: '#a6c8ff'

  # Secondary Brand Palette (Deep Navy Architecture)
  secondary: '#0c2d48'
  secondary-light: '#44617e'
  on-secondary: '#ffffff'
  secondary-container: '#c0ddff'
  on-secondary-container: '#45617f'

  # Tertiary Brand Palette (Cyan Accents & Progress)
  tertiary: '#0ea5e9'
  tertiary-dark: '#00557a'
  tertiary-container: '#006e9e'
  on-tertiary: '#ffffff'
  on-tertiary-container: '#d2eaff'

  # Semantic Statuses
  error: '#ba1a1a'
  error-hover: '#93000a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  success: '#10b981'
  success-container: '#d1fae5'
  on-success: '#065f46'
  warning: '#f59e0b'
  warning-container: '#fef3c7'
  on-warning: '#92400e'

  # Fixed Variants
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
zIndex:
  base: 0
  sticky: 20
  dropdown: 40
  popover: 50
  modal: 60
  drawer: 70
  toast: 80
breakpoints:
  tablet: 768px
  desktop: 1024px
  wide: 1280px
  max: 1600px
---

# 🎨 Design System & UI Specification — EduVerse Enterprise UI

> **Phiên bản:** 1.0 (Final Enterprise Standard)  
> **Cập nhật lần cuối:** 26/09/2026  
> **Áp dụng cho:** Toàn bộ giao diện Web React SPA (Frontend EduVerse)  
> **Mục tiêu:** Cung cấp bộ quy chuẩn thiết kế (Design Tokens) và hướng dẫn cấu hình chi tiết cho Tailwind CSS nhằm đảm bảo tính thẩm mỹ, nhất quán và chuẩn mực Corporate SaaS.

---

> [!IMPORTANT]
> ### 📌 NGUYÊN TẮC VÀNG: SINGLE SOURCE OF TRUTH
> **Design Tokens trong tài liệu này là Nguồn Chân Lý Duy Nhất (Single Source of Truth).**  
> Mọi giá trị màu sắc, typography, spacing, radius, shadow, z-index và component state trong toàn bộ mã nguồn Frontend phải trực tiếp tham chiếu Design Tokens này thông qua Tailwind utilities; **tuyệt đối không tự ý hardcode mã màu hex ngẫu nhiên** hoặc tạo giá trị thay thế nếu token tương ứng đã tồn tại.

---

## 1. Brand & Style Philosophy

Hệ thống thiết kế nhắm đến các tác vụ quản lý đào tạo và vận hành giáo dục phức tạp ở quy mô doanh nghiệp / trường đại học. Trọng tâm thiết kế hướng tới:
- **Tối đa hóa sự rõ ràng về mặt thị giác:** Tối ưu tỉ lệ dữ liệu / mực hiển thị (data-to-ink ratio), giúp người dùng đọc và nắm bắt khối lượng thông tin lớn mà không mỏi mắt.
- **Tính dự đoán cao về mặt cấu trúc:** Các luồng nghiệp vụ sâu (quản lý học tập, đề cương bài giảng, sổ điểm ma trận, chấm bài tập) tuân thủ nhịp điệu không gian và phân cấp thị giác nhất quán.
- **Phong cách Corporate SaaS uy quyền và chuẩn mực:** Tương tự các nền tảng giáo dục và quản trị hàng đầu thế giới (Coursera, Atlassian, Canvas LMS). Mọi component đều được thiết kế để giảm thiểu ma sát thao tác cho Quản trị viên, Giảng viên và Học viên.

---

## 2. Bảng Màu Thống Nhất & Phân Cấp Semantic (Colors)

Hệ thống màu loại bỏ hoàn toàn sự nhập nhằng và thiết lập tên gọi semantic rõ ràng:

### 2.1. Màu Thương hiệu & Hành động Chính (Brand Palette)
- **Primary Base (`#1168bd`):** Màu thương hiệu cốt lõi C4, nút hành động chính (Primary CTA), viền focus active, liên kết điều hướng đang chọn.
  - Hover: `#0e5aa5`
  - Active: `#0b4782`
  - Dark: `#005096`
  - On Primary (Text): `#ffffff`
- **Secondary Base (`#0c2d48`):** Xanh navy sâu, sử dụng làm cấu trúc khung sườn (Persistent Sidebar), thanh điều hướng cấp cao và tiêu đề lớn.
  - Secondary Light: `#44617e`
  - On Secondary (Text): `#ffffff`
- **Tertiary Base (`#0ea5e9`):** Xanh cyan điểm nhấn, dành cho thanh tiến độ học tập (Progress Bar), callout thông tin quan trọng.
  - Tertiary Dark: `#00557a`
  - Tertiary Container: `#006e9e`
  - On Tertiary (Text): `#ffffff`

### 2.2. Bề Mặt & Màu Nền (Surfaces — Đồng bộ Canvas)
- **App Canvas (Màu nền toàn ứng dụng):** `#f8f9ff` (Soft Blue/Indigo Canvas — Thống nhất 100% với `frontend-blueprint.md`).
- **Cards & Primary Surface:** `#ffffff` (Pure White).
- **Secondary Surface (Sub-panels, Table Header):** `#eff4ff` (`surface-container-low`) và `#e5eeff` (`surface-container`).
- **Borders & Dividers:** `#c1c6d4` (`outline-variant`) cho viền mỏng hairline và `#727783` (`outline`) cho đường viền có tương phản cao.
- **Text Hierarchy:**
  - Text Heading: `#0b1c30` (`on-surface`)
  - Text Body: `#0b1c30` / `#414752` (`on-surface-variant`)
  - Text Muted / Placeholder: `#727783` (`outline`)

### 2.3. Màu Ngữ Nghĩa Chức Năng (Semantic Statuses)
- **Success (`#10b981`):** Nền `#d1fae5`, Chữ `#065f46` — Đạt bài kiểm tra, hoàn thành bài học, duyệt khóa học thành công, tài khoản kích hoạt.
- **Warning (`#f59e0b`):** Nền `#fef3c7`, Chữ `#92400e` — Sắp đến hạn nộp bài tập, khóa học đang chờ duyệt (`pending_approval`), hàng đợi chấm bài.
- **Error / Destructive (`#ba1a1a` / `#93000a`):** Nền `#ffdad6`, Chữ `#93000a` — Không đạt quiz, bài nộp trễ hạn, từ chối phê duyệt khóa học, khóa tài khoản vi phạm.

---

## 3. Quy Chuẩn Kiểu Chữ (Typography)

Toàn bộ hệ thống giao diện sử dụng đồng nhất phông chữ **`Inter`** để đạt độ trung tính cao nhất và khả năng đọc tuyệt vời ở các tỷ lệ hiển thị nhỏ:

- **Tabular Figures (`tabular-nums`):** Tất cả dashboard thống kê, bảng điểm số, bảng học viên, đồng hồ thi trắc nghiệm đếm ngược và phần trăm tiến độ **bắt buộc kích hoạt OpenType tabular figures**:
  ```css
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
  ```
- **Hệ Thống Phông Chữ Semantic (Typography Scale):**
  - `display`: `2.25rem` (36px), leading `2.75rem`, bold `700`, tracking `-0.025em` (Trang chủ Hero).
  - `headline-lg`: `1.75rem` (28px), leading `2.25rem`, semibold `600`, tracking `-0.02em` (Tiêu đề trang Dashboard).
  - `headline-md`: `1.25rem` (20px), leading `1.75rem`, semibold `600`, tracking `-0.015em` (Tiêu đề nhóm thẻ Card).
  - `headline-sm`: `1.125rem` (18px), leading `1.5rem`, semibold `600`, tracking `-0.01em` (Tiêu đề Modal/Section).
  - `body-lg`: `1rem` (16px), leading `1.5rem`, regular `400` (Nội dung bài học Markdown).
  - `body-md`: `0.875rem` (14px), leading `1.25rem`, regular `400` (Văn bản bảng biểu, form label tiêu chuẩn).
  - `body-sm`: `0.75rem` (12px), leading `1rem`, regular `400` (Mô tả phụ, timestamp).
  - `label-md`: `0.875rem` (14px), leading `1.25rem`, medium `500` (Nút bấm, tabs).
  - `label-sm`: `0.75rem` (12px), leading `1rem`, semibold `600` (Badges, Chips).

---

## 4. Bố Cục, Không Gian & Thang Z-Index (Layout, Spacing & Z-Index)

### 4.1. Khung Vỏ Ứng Dụng Web (Application Shell)
- **Sidebar:** Độ rộng cố định `260px`, có thể thu gọn (collapse) thành thanh rail biểu tượng `64px` trên màn hình tablet ngang.
- **Header:** Chiều cao cố định `64px` (`4rem`) với đường viền dưới mỏng 1px (`#c1c6d4`).
- **Viewport Canvas:** Khung layout linh hoạt với độ rộng tối đa nội dung `1600px` trên màn hình Desktop lớn, đảm bảo các bảng dữ liệu rộng và dòng đọc bài giảng không bị kéo dài quá mức.

### 4.2. Hệ Thống Thang Z-Index Chuẩn
Nhằm tránh tình trạng các component tự sinh `z-[9999]` xung đột nhau, toàn bộ hệ thống tuân thủ thang z-index duy nhất:
```yaml
zIndex:
  base: 0        # Nội dung thông thường
  sticky: 20     # Header sticky, sticky table column
  dropdown: 40   # Select menu, action dropdown
  popover: 50    # Popover, tooltip
  modal: 60      # Dialog, confirm modal
  drawer: 70     # Slide-over sidebar
  toast: 80      # Thông báo toast góc màn hình
```

### 4.3. Quy Tắc Base-4 Spacing
- `space-xs`: `0.25rem` (4px)
- `space-sm`: `0.5rem` (8px)
- `space-md`: `1rem` (16px)
- `space-lg`: `1.5rem` (24px)
- `space-xl`: `2rem` (32px)
- `gutter`: `1.5rem` (24px khoảng cách giữa các cột)

---

## 5. Ma Trận Trạng Thái Component (Component State Matrix)

Mọi component tương tác bắt buộc phải khai báo đầy đủ các trạng thái để không bị sinh mã tùy tiện:

### 5.1. Nút Bấm (Buttons)
| Trạng thái | Primary Button | Secondary Button | Destructive Button |
|---|---|---|---|
| **Default** | `bg-primary text-white` | `bg-white border border-outline-variant text-on-surface` | `bg-error text-white` |
| **Hover** | `bg-primary-hover` | `bg-surface-container-low border-outline` | `bg-error-hover` |
| **Active** | `bg-primary-active` | `bg-surface-container` | `bg-error-hover` |
| **Focus Visible** | `ring-2 ring-primary ring-offset-2 outline-none` | `ring-2 ring-primary ring-offset-2 outline-none` | `ring-2 ring-error ring-offset-2 outline-none` |
| **Disabled** | `bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-60` | `bg-surface-container text-outline border-outline-variant cursor-not-allowed` | `bg-outline-variant text-on-surface-variant cursor-not-allowed opacity-60` |
| **Loading** | Hiển thị `<Loader2 className="animate-spin mr-2" />` và tự động set `disabled` | Tương tự | Tương tự |

### 5.2. Ô Nhập Liệu (Inputs & Selects)
| Trạng thái | Giao diện hiển thị |
|---|---|
| **Default** | Chiều cao 40px (hoặc 32px compact), `bg-white border border-outline-variant text-sm text-on-surface` |
| **Hover** | `border-outline` |
| **Focus** | `outline-none border-primary ring-2 ring-primary/20` |
| **Error** | `border-error ring-2 ring-error/20`, câu thông báo lỗi đỏ `text-xs text-error mt-1` |
| **Disabled** | `bg-surface-container text-outline border-outline-variant cursor-not-allowed` |
| **Read-only** | `bg-surface-container-low border-outline-variant text-on-surface-variant cursor-default` |

### 5.3. Bảng Dữ Liệu Web (Data Tables)
- **Desktop (≥ 1024px):** Hiển thị đầy đủ bảng dữ liệu với header `#eff4ff`, hàng xen kẽ hover mềm `#f8f9ff`.
- **Tablet / Màn hình nhỏ (768px – 1023px):** Bọc trong container `overflow-x-auto`. Riêng **Sổ điểm Gradebook** bắt buộc cố định cột đầu tiên:
  ```css
  /* Cột 1 cố định khi cuộn ngang */
  th:first-child, td:first-child {
    position: sticky;
    left: 0;
    z-index: 10;
    background-color: #ffffff;
  }
  ```

### 5.4. Hiệu Ứng Skeleton Loading (Chốt Shimmer Gradient)
Toàn bộ Skeleton trong ứng dụng sử dụng hiệu ứng **Shimmer Gradient** mượt mà (không dùng pulse opacity đơn giản):
```css
/* Shimmer Animation Keyframe */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
.skeleton-shimmer {
  position: relative;
  overflow: hidden;
  background-color: #e5eeff;
}
.skeleton-shimmer::after {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
  content: '';
}
```

---

## 6. Quy Tắc Trợ Năng Bàn Phím Toàn Hệ Thống (Accessibility Focus Rules)

Mọi phần tử có thể tương tác (Buttons, Links, Inputs, Tabs, Checkboxes) bắt buộc phải có visual keyboard focus rõ ràng:
- **Nguyên tắc:** Tuyệt đối cấm viết `outline: none` mà không có `focus-visible:ring-*` thay thế.
- **Tiêu chuẩn áp dụng:**
  ```html
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
  ```

---

## 7. Định Hướng Responsive Web Breakpoints

Hệ thống nhắm trọng tâm vào trải nghiệm duyệt Web trên máy tính và máy tính bảng:

| Môi trường | Kích thước | Hành vi Layout |
|---|---|---|
| **Desktop / Laptop** (Trọng tâm chính) | `≥ 1024px` | Sidebar mở rộng 260px đầy đủ, hiển thị toàn bộ 12 cột grid và bảng dữ liệu lớn. |
| **Tablet màn hình ngang** | `768px – 1023px` | Sidebar tự động thu gọn thành thanh rail biểu tượng 64px (Icon-only rail), bảng dữ liệu cuộn ngang tự nhiên (`overflow-x-auto`). |
| **Màn hình nhỏ** | `< 768px` | Sidebar chuyển thành Drawer trượt từ cạnh trái, các bảng dữ liệu cuộn ngang mượt mà. |

---

## 8. Cấu Hình Hoàn Chỉnh `tailwind.config.js` (Ready-to-Use)

Dưới đây là cấu hình hoàn chỉnh tích hợp 100% tokens từ tài liệu này vào Tailwind CSS:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      maxWidth: {
        app: '1600px',
      },
      colors: {
        primary: {
          DEFAULT: '#1168bd',
          hover: '#0e5aa5',
          active: '#0b4782',
          dark: '#005096',
          container: '#1168bd',
          'on-container': '#dce8ff',
          fixed: '#d5e3ff',
          'fixed-dim': '#a6c8ff',
          on: '#ffffff',
          'on-fixed': '#001c3b',
          'on-fixed-variant': '#004787',
          inverse: '#a6c8ff',
        },
        secondary: {
          DEFAULT: '#0c2d48',
          light: '#44617e',
          container: '#c0ddff',
          'on-container': '#45617f',
          fixed: '#cfe4ff',
          'fixed-dim': '#acc9eb',
          on: '#ffffff',
          'on-fixed': '#001d34',
          'on-fixed-variant': '#2c4965',
        },
        tertiary: {
          DEFAULT: '#0ea5e9',
          dark: '#00557a',
          container: '#006e9e',
          'on-container': '#d2eaff',
          fixed: '#c9e6ff',
          'fixed-dim': '#89ceff',
          on: '#ffffff',
          'on-fixed': '#001e2f',
          'on-fixed-variant': '#004c6e',
        },
        surface: {
          DEFAULT: '#f8f9ff', // Base App Canvas
          dim: '#cbdbf5',
          bright: '#f8f9ff',
          card: '#ffffff',
          container: '#e5eeff',
          'container-low': '#eff4ff',
          'container-lowest': '#ffffff',
          'container-high': '#dce9ff',
          'container-highest': '#d3e4fe',
          variant: '#d3e4fe',
          on: '#0b1c30',
          'on-variant': '#414752',
          inverse: '#213145',
          'inverse-on': '#eaf1ff',
          tint: '#005fb0',
        },
        background: '#f8f9ff',
        'on-background': '#0b1c30',
        outline: {
          DEFAULT: '#727783',
          variant: '#c1c6d4',
        },
        error: {
          DEFAULT: '#ba1a1a',
          hover: '#93000a',
          container: '#ffdad6',
          'on-container': '#93000a',
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
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.025em', fontWeight: '700' }],
        'headline-lg': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-sm': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0em', fontWeight: '400' }],
        'label-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-sm': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '600' }],
        'tabular-number': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em', fontWeight: '500' }],
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        gutter: '1.5rem',
        margin: '1.5rem',
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      zIndex: {
        base: '0',
        sticky: '20',
        dropdown: '40',
        popover: '50',
        modal: '60',
        drawer: '70',
        toast: '80',
      },
      boxShadow: {
        flat: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        popover: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        drawer: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [
    // Utility class .tabular-number kích hoạt font-variant-numeric: tabular-nums cho toàn bộ bảng điểm, đồng hồ thi
    function({ addUtilities }) {
      addUtilities({
        '.tabular-number': {
          'font-variant-numeric': 'tabular-nums',
          'font-feature-settings': '"tnum"',
        },
      });
    },
  ],
}
```

---

_Tài liệu Design System EduVerse Enterprise UI là tiêu chuẩn hình ảnh bắt buộc khi xây dựng giao diện người dùng cho dự án._
