# ☁️ Đặc Tả API: Module Upload Đa Phương Tiện & AWS S3 Storage — api-uploads.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md), [`seq-assign-001.md`](../sequences/seq-assign-001.md), [`actor-student.md`](../use-cases/actor-student.md#uc-doc-001), [`actor-teacher.md`](../use-cases/actor-teacher.md#uc-doc-002)  
> **Base Path:** `/api/v1/uploads`, `/api/v1/lessons/:lessonId/materials`  
> **Mục đích:** Đặc tả chi tiết toàn bộ các endpoint phục vụ cấp phép tải tệp trực tiếp lên cloud AWS S3 bằng cơ chế **Presigned PUT URL** (chống nghẽn băng thông và I/O server Express.js), phân loại rành mạch tài nguyên Công khai (Public Assets: Avatar, Thumbnail khóa học) và tài nguyên Bảo mật (Private Assets: Tài liệu học tập, Video bài giảng trực tuyến), quản lý danh mục tài liệu đính kèm bài học (`course_materials`), cấp phát link stream/download an toàn có thời hạn và chính sách dọn dẹp file rác tự động.

---

## 1. Danh Sách Endpoint Tổng Quan

### 1.1. Phân hệ Cấp phép Tải lên trực tiếp AWS S3 (Presigned Upload Service)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/uploads/presigned-url` | `[Authenticated]` | Sinh AWS S3 Presigned PUT URL có chữ ký tạm thời (TTL 15 phút) dựa trên mục đích (`purpose`: avatar, thumbnail, material, video) |

### 1.2. Phân hệ Quản lý Tài liệu đính kèm Bài học (Lesson Materials Management)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/lessons/:lessonId/materials` | `[Authenticated]` | Lấy danh sách tài liệu đính kèm của một bài học |
| `POST` | `/api/v1/lessons/:lessonId/materials` | `[Roles: teacher, admin]` | Gắn tài liệu mới vào bài học sau khi Client upload S3 thành công |
| `PATCH` | `/api/v1/lessons/:lessonId/materials/:materialId` | `[Roles: teacher, admin]` | Cập nhật tiêu đề hiển thị của tài liệu mà không cần tải lại file |
| `DELETE` | `/api/v1/lessons/:lessonId/materials/:materialId` | `[Roles: teacher, admin]` | Xóa tài liệu khỏi bài học và xóa tệp tương ứng trên AWS S3 |
| `GET` | `/api/v1/lessons/:lessonId/materials/:materialId/download-url` | `[Authenticated]` | Sinh S3 Presigned GET URL tải file an toàn có thời hạn (kiểm tra quyền học viên/GV) |

### 1.3. Phân hệ Phát luồng Video Bài giảng trực tuyến (Lesson Video Streaming)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/lessons/:lessonId/video-stream-url` | `[Authenticated]` | Sinh link xem video bài giảng (Presigned GET URL với video S3 hoặc URL nhúng YouTube/Vimeo) |

---

## 2. Ràng Buộc Kỹ Thuật Theo Mục Đích Tải Tệp (`UploadPurpose`)

Hệ thống phân định rõ ràng 4 mục đích sử dụng tệp với các ràng buộc nghiêm ngặt:

| `purpose` | Phân loại | Định dạng cho phép (Extensions / MIME) | Dung lượng tối đa | Quy tắc cấu trúc đường dẫn S3 Key |
|---|:---:|---|:---:|---|
| `avatar` | **Public** | `.jpg, .jpeg, .png, .webp`<br>*(image/jpeg, image/png, image/webp)* | $\le 2\text{ MB}$ | `public/avatars/{userId}_{timestamp}.webp` |
| `course_thumbnail` | **Public** | `.jpg, .jpeg, .png, .webp`<br>*(image/jpeg, image/png, image/webp)* | $\le 5\text{ MB}$ | `public/thumbnails/{courseId}_{timestamp}.webp` |
| `lesson_material` | **Private** | `.pdf, .docx, .pptx, .zip, .rar`<br>*(application/pdf, application/vnd.openxmlformats-..., application/zip)* | $\le 50\text{ MB}$ | `private/materials/{courseId}/{lessonId}/{uuid}_{fileName}` |
| `lesson_video` | **Private** | `.mp4, .webm`<br>*(video/mp4, video/webm)* | $\le 500\text{ MB}$ | `private/videos/{courseId}/{lessonId}/{uuid}_{fileName}` |

> ⚠️ **Lưu ý bảo mật chữ ký AWS S3:**  
> - Backend **bắt buộc** ràng buộc `ContentType` và `ContentLength` ngay trong lệnh `@aws-sdk/client-s3` (`PutObjectCommand`).
> - Phía Frontend khi gửi lệnh HTTP `PUT` tải nhị phân lên S3 theo `uploadUrl`, header `Content-Type` **phải khớp chính xác 100%** với thông tin đã đăng ký, nếu không S3 sẽ từ chối với lỗi `403 SignatureDoesNotMatch`.

---

## 3. Đặc Tả Chi Tiết Từng Endpoint

### 3.1. Sinh AWS S3 Presigned URL để tải file trực tiếp

#### `POST /api/v1/uploads/presigned-url`
* **Mô tả chức năng:** Client gửi yêu cầu cấp đường dẫn tải tệp lên AWS S3 kèm chữ ký xác thực tạm thời (**S3 Presigned PUT URL**, hạn dùng 15 phút). Trình duyệt Frontend sẽ tải dữ liệu nhị phân trực tiếp lên cloud mà không đi qua Express.js server, ngăn chặn hoàn toàn việc làm nghẽn CPU và băng thông máy chủ.
* **Quyền hạn:** `[Authenticated]`
  * `avatar`: Mọi người dùng đã đăng nhập đều có thể xin URL upload avatar cho chính mình.
  * `course_thumbnail`: Chỉ Giảng viên sở hữu khóa học hoặc Quản trị viên (Admin).
  * `lesson_material`, `lesson_video`: Chỉ Giảng viên phụ trách khóa học hoặc Quản trị viên (Admin).
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`GetUploadPresignedUrlDto`):
```json
{
  "purpose": "lesson_material",
  "fileName": "Slide_Chuong_1_Tong_Quan_ExpressJS.pdf",
  "fileSize": 18450000,
  "contentType": "application/pdf",
  "contextId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```
* **Validation Rules:**
  * `purpose`: Bắt buộc, một trong các giá trị enum: `'avatar'`, `'course_thumbnail'`, `'lesson_material'`, `'lesson_video'`.
  * `fileName`: Bắt buộc, chuỗi tên tệp gốc kèm đuôi mở rộng hợp lệ theo cấu hình của `purpose`.
  * `fileSize`: Bắt buộc, số nguyên dương tính bằng byte, không được vượt quá hạn mức tối đa của `purpose`.
  * `contentType`: Bắt buộc, MIME type hợp lệ khớp với danh mục cho phép.
  * `contextId`: Bắt buộc đối với `course_thumbnail` (là `courseId`), `lesson_material` & `lesson_video` (là `lessonId`). Không bắt buộc với `avatar` (mặc định lấy `userId` từ token).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Khởi tạo URL tải tệp lên S3 thành công",
  "data": {
    "uploadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/private/materials/c1/ls1/1727211000_Slide_Chuong_1.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...&X-Amz-Signature=...",
    "fileKey": "private/materials/c1/ls1/1727211000_Slide_Chuong_1.pdf",
    "publicUrl": null,
    "isPublic": false,
    "expiresInSeconds": 900
  },
  "timestamp": "2026-09-24T20:45:00.000Z"
}
```

> **Ghi chú Response:**
> - Nếu `purpose` là `avatar` hoặc `course_thumbnail` (`isPublic = true`), response sẽ trả về thêm trường `publicUrl` (ví dụ: `https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/public/avatars/u1_1727211000.webp` hoặc URL qua CloudFront CDN) để client có thể lưu trực tiếp vào CSDL sau khi upload xong.
> - Nếu `purpose` là `lesson_material` hoặc `lesson_video` (`isPublic = false`), `publicUrl = null`, client bắt buộc sử dụng `fileKey` để liên kết vào bảng CSDL tương ứng.

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Định dạng tệp không được hỗ trợ | Phần mở rộng hoặc MIME type không khớp với cấu hình `purpose` |
| `400` | `Bad Request` | Dung lượng tệp vượt quá giới hạn cho phép | Dung lượng tệp vượt trần quy định của `purpose` |
| `400` | `Bad Request` | Thiếu contextId cho mục đích này | Bỏ trống `contextId` khi upload tài liệu/video bài học |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền tải tài nguyên lên khóa học này | Không phải giảng viên sở hữu khóa học |
| `404` | `Not Found` | Không tìm thấy khóa học hoặc bài học | `contextId` không tồn tại trong CSDL |

---

### 3.2. Lấy danh sách tài liệu đính kèm của bài học

#### `GET /api/v1/lessons/:lessonId/materials`
* **Mô tả chức năng:** Trả về danh sách tất cả các tài liệu đính kèm (Slide PDF, file nén Code, tài liệu Word/PowerPoint) của bài học đó ([`UC-DOC-001`](../use-cases/actor-student.md#uc-doc-001)).
* **Quyền hạn:** `[Authenticated]` (Học viên trong lớp hoặc Giảng viên/Admin).
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `lessonId` *(string UUID, required)*: ID bài học.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách tài liệu bài học thành công",
  "data": {
    "items": [
      {
        "id": "mt1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "title": "Slide Bài Giảng Chương 1 - Tổng quan Node.js & Express.js",
        "fileType": "pdf",
        "fileSize": 18450000,
        "createdAt": "2026-09-24T08:30:00.000Z"
      },
      {
        "id": "mt2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "title": "Mã nguồn mẫu thực hành CRUD Starter Code",
        "fileType": "zip",
        "fileSize": 4200000,
        "createdAt": "2026-09-24T08:35:00.000Z"
      }
    ],
    "total": 2
  },
  "timestamp": "2026-09-24T20:46:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn chưa ghi danh vào lớp học chứa bài học này | Học viên không có quyền truy cập bài học |
| `404` | `Not Found` | Không tìm thấy bài học | `lessonId` không tồn tại |

---

### 3.3. Gắn tài liệu mới vào bài học (Confirm & Link Material)

#### `POST /api/v1/lessons/:lessonId/materials`
* **Mô tả chức năng:** Sau khi Frontend tải file tài liệu thành công lên S3 qua Presigned URL, client gọi API này để hệ thống:
  1. Kiểm tra sự tồn tại của tệp trên S3 (`HeadObjectCommand`).
  2. Tạo bản ghi mới trong bảng `course_materials` ([`schema.md`](../database/schema.md#5-bảng-course_materials-tài-liệu-bài-học)) gắn với `lessonId` tương ứng.
* **Quyền hạn:** `[Roles: teacher, admin]` (Giảng viên sở hữu khóa học hoặc Quản trị viên).
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `lessonId` *(string UUID, required)*: ID bài học cần gắn tài liệu.

#### Request Body (`CreateCourseMaterialDto`):
```json
{
  "title": "Slide Bài Giảng Chương 1 - Tổng quan Node.js & Express.js",
  "fileName": "Slide_Chuong_1_Tong_Quan_ExpressJS.pdf",
  "fileKey": "private/materials/c1/ls1/1727211000_Slide_Chuong_1.pdf",
  "fileType": "pdf",
  "fileSize": 18450000
}
```
* **Validation Rules:**
  * `title`: Bắt buộc, tên hiển thị của tài liệu, độ dài từ 3 đến 255 ký tự.
  * `fileName`: Bắt buộc, tên tệp gốc người dùng tải lên (dùng để đặt tên tệp khi học viên download về máy).
  * `fileKey`: Bắt buộc, chuỗi S3 Object Key bắt đầu bằng `private/materials/`.
  * `fileType`: Bắt buộc, phần mở rộng tệp (`pdf`, `zip`, `docx`, `pptx`, `rar`).
  * `fileSize`: Bắt buộc, số nguyên byte lớn hơn 0 và $\le 52428800$ (50MB).

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Thêm tài liệu bài học thành công",
  "data": {
    "id": "mt1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Slide Bài Giảng Chương 1 - Tổng quan Node.js & Express.js",
    "fileName": "Slide_Chuong_1_Tong_Quan_ExpressJS.pdf",
    "fileType": "pdf",
    "fileSize": 18450000,
    "createdAt": "2026-09-24T20:47:00.000Z"
  },
  "timestamp": "2026-09-24T20:47:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tệp chưa được tải lên máy chủ lưu trữ | S3 chưa tồn tại file với `fileKey` này |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền chỉnh sửa bài học này | Không phải giảng viên phụ trách khóa học |
| `404` | `Not Found` | Không tìm thấy bài học | `lessonId` không tồn tại |

---

### 3.4. Cập nhật tiêu đề tài liệu bài học (Update Material Title)

#### `PATCH /api/v1/lessons/:lessonId/materials/:materialId`
* **Mô tả chức năng:** Giảng viên chỉnh sửa tên hiển thị của tài liệu bài học mà không cần phải xóa đi và tải lại file nặng lên S3.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `lessonId` *(string UUID, required)*: ID bài học.
  * `materialId` *(string UUID, required)*: ID tài liệu cần cập nhật.

#### Request Body (`UpdateCourseMaterialDto`):
```json
{
  "title": "Slide Bài Giảng Chương 1 (Bản cập nhật v2 - 2026)"
}
```
* **Validation Rules:**
  * `title`: Bắt buộc, chuỗi văn bản từ 3 đến 255 ký tự.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật tiêu đề tài liệu thành công",
  "data": {
    "id": "mt1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "lessonId": "ls1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "title": "Slide Bài Giảng Chương 1 (Bản cập nhật v2 - 2026)",
    "fileType": "pdf",
    "fileSize": 18450000,
    "updatedAt": "2026-09-24T20:53:00.000Z"
  },
  "timestamp": "2026-09-24T20:53:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Tiêu đề tài liệu không hợp lệ | Tiêu đề quá ngắn hoặc rỗng |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa tài liệu bài học này | Không phải giảng viên phụ trách khóa học |
| `404` | `Not Found` | Không tìm thấy tài liệu | `materialId` không tồn tại hoặc không thuộc `lessonId` |

---

### 3.5. Xóa tài liệu khỏi bài học (Delete Material & S3 File)

#### `DELETE /api/v1/lessons/:lessonId/materials/:materialId`
* **Mô tả chức năng:** Giảng viên xóa một tài liệu đính kèm. Hệ thống sẽ:
  1. Xóa bản ghi trong bảng `course_materials`.
  2. Tự động kích hoạt lệnh gọi `s3.send(new DeleteObjectCommand({ Bucket, Key: fileKey }))` để xóa vĩnh viễn file trên S3, tránh phát sinh chi phí lưu trữ đám mây.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `lessonId` *(string UUID, required)*: ID bài học.
  * `materialId` *(string UUID, required)*: ID tài liệu cần xóa.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa tài liệu bài học thành công",
  "data": null,
  "timestamp": "2026-09-24T20:48:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xóa tài liệu bài học này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy tài liệu | `materialId` không tồn tại hoặc không thuộc `lessonId` |

---

### 3.6. Sinh Presigned GET URL tải tài liệu bài học

#### `GET /api/v1/lessons/:lessonId/materials/:materialId/download-url`
* **Mô tả chức năng:** Học viên hoặc Giảng viên nhấn nút tải tài liệu học tập. Hệ thống kiểm tra quyền thành viên hợp lệ (học viên đã ghi danh vào lớp chứa bài học này), sau đó sinh một **S3 Presigned GET URL** (hạn dùng 30 phút) để người dùng tải file trực tiếp an toàn từ private bucket ([`UC-DOC-001`](../use-cases/actor-student.md#uc-doc-001)).
* **Kỹ thuật tải đúng tên tệp (ResponseContentDisposition):**
  * Khi backend gọi `@aws-sdk/s3-request-presigner`, hệ thống cấu hình tham số:
    ```javascript
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(material.fileName)}"`
    ```
  * Điều này đảm bảo trình duyệt người dùng luôn tự động bật hộp thoại lưu tệp với đúng tên hiển thị sạch đẹp thay vì lưu theo chuỗi UUID/timestamp ngẫu nhiên của S3 Key.
* **Quyền hạn:** `[Authenticated]` (Học viên thuộc lớp hoặc Giảng viên/Admin).
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `lessonId` *(string UUID, required)*: ID bài học.
  * `materialId` *(string UUID, required)*: ID tài liệu cần tải.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Khởi tạo liên kết tải tài liệu thành công",
  "data": {
    "downloadUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/private/materials/c1/ls1/1727211000_Slide_Chuong_1.pdf?response-content-disposition=attachment%3B%20filename%3D...&X-Amz-Signature=...",
    "fileName": "Slide_Chuong_1_Tong_Quan_ExpressJS.pdf",
    "fileType": "pdf",
    "fileSize": 18450000,
    "expiresInSeconds": 1800
  },
  "timestamp": "2026-09-24T20:49:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn chưa ghi danh vào lớp học chứa tài liệu này | Học viên chưa là thành viên chính thức của lớp |
| `404` | `Not Found` | Không tìm thấy tài liệu | `materialId` không tồn tại |

---

### 3.7. Lấy liên kết phát luồng Video bài giảng (Video Streaming URL)

#### `GET /api/v1/lessons/:lessonId/video-stream-url`
* **Mô tả chức năng:** Học viên mở bài học dạng video (`lessonType = 'video'`). Hệ thống kiểm tra điều kiện truy cập (học viên đã ghi danh vào lớp) và trả về đường dẫn phát video:
  * **Trường hợp 1 (Video lưu trên S3):** Hệ thống sinh **S3 Presigned GET URL** (TTL 4 giờ) có hỗ trợ HTTP Range Requests (`206 Partial Content`) để trình phát HTML5 Video có thể tua mượt mà.
  * **Trường hợp 2 (Video nhúng ngoài - YouTube / Vimeo):** Hệ thống trả về link Embed trực tiếp để Frontend render thẻ `<iframe>`.
* **Quyền hạn:** `[Authenticated]` (Học viên thuộc lớp hoặc Giảng viên/Admin).
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `lessonId` *(string UUID, required)*: ID bài học dạng video.

#### Response Thành Công — Video lưu trên S3 (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy liên kết video bài giảng thành công",
  "data": {
    "sourceType": "s3_direct",
    "streamUrl": "https://eduverse-storage.s3.ap-southeast-1.amazonaws.com/private/videos/c1/ls1/1727211500_video_lecture.mp4?X-Amz-Signature=...",
    "format": "mp4",
    "expiresInSeconds": 14400
  },
  "timestamp": "2026-09-24T20:50:00.000Z"
}
```

#### Response Thành Công — Video nhúng từ YouTube / Vimeo (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy liên kết video bài giảng thành công",
  "data": {
    "sourceType": "embed_external",
    "streamUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "format": "iframe",
    "expiresInSeconds": null
  },
  "timestamp": "2026-09-24T20:50:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Bài học này không phải là dạng video | `lessonType != 'video'` hoặc chưa thiết lập video |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn chưa ghi danh vào lớp học này | Học viên không có quyền xem video bài giảng |
| `404` | `Not Found` | Không tìm thấy bài học | `lessonId` không tồn tại |

---

## 4. Ghi Chú Kỹ Thuật & Vận Hành AWS S3

- **Phân tách Cấu trúc Thư mục trên S3 Bucket (Directory Layout):**
  ```text
  eduverse-storage/
  ├── public/                      <-- Quyền: Public Read (hoặc qua CDN)
  │   ├── avatars/                 <-- Ảnh đại diện: {userId}_{timestamp}.webp
  │   └── thumbnails/              <-- Ảnh bìa khóa học: {courseId}_{timestamp}.webp
  │
  └── private/                     <-- Quyền: Block All Public Access (Chỉ ký Presigned)
      ├── materials/               <-- Tài liệu bài học: {courseId}/{lessonId}/{uuid}_{fileName}
      ├── videos/                  <-- Video bài giảng: {courseId}/{lessonId}/{uuid}_{fileName}
      └── assignments/             <-- Bài nộp học viên: {classId}/{assignmentId}/{studentId}/...
  ```

- **Ma trận Quy trình 3 bước cho Frontend (Post-Upload Workflow Mapping):**
  | `purpose` | Bước 1: Xin URL | Bước 2: Tải lên S3 | Bước 3: Gọi API Nghiệp vụ để Lưu CSDL |
  |---|---|---|---|
  | `avatar` | `POST /uploads/presigned-url` | `PUT uploadUrl` | `PATCH /api/v1/users/me/profile` gửi `{ avatarUrl: publicUrl }` |
  | `course_thumbnail` | `POST /uploads/presigned-url` | `PUT uploadUrl` | `PATCH /api/v1/courses/:id` gửi `{ thumbnailUrl: publicUrl }` |
  | `lesson_material` | `POST /uploads/presigned-url` | `PUT uploadUrl` | `POST /api/v1/lessons/:id/materials` gửi `{ title, fileName, fileKey, fileType, fileSize }` |
  | `lesson_video` | `POST /uploads/presigned-url` | `PUT uploadUrl` | `PATCH /api/v1/lessons/:id` gửi `{ videoUrl: fileKey }` |

- **Hỗ trợ Tua Video mượt mà (HTTP Range Requests & 206 Partial Content):**
  - AWS S3 mặc định hỗ trợ chuẩn header `Range: bytes=0-1048576`.
  - S3 Presigned GET URL cấp cho video cho phép trình duyệt gửi request Range liên tục khi học viên kéo thanh tua video trên giao diện web player mà không cần tải lại toàn bộ file 500MB từ đầu.
- **Quy trình Cập nhật & Dọn dẹp Rác (Garbage Collection):**
  - Khi học viên/giảng viên cập nhật Avatar mới (`PATCH /users/profile`), backend kiểm tra avatar cũ nếu là đường dẫn S3 thì tự động gọi `s3.send(new DeleteObjectCommand({ Bucket, Key: oldAvatarKey }))`.
  - Khi giảng viên cập nhật Thumbnail mới cho khóa học (`PATCH /courses/:id`), file thumbnail cũ tương tự sẽ được dọn dẹp khỏi S3.
  - Khi một tài liệu bị xóa (`DELETE /materials/:id`) hoặc một bài học bị xóa, toàn bộ file vật lý gắn liền trên S3 sẽ được xóa vĩnh viễn.
- **Chính sách S3 Lifecycle Rules (Dọn dẹp file mồ côi):**
  - Cấu hình AWS S3 Lifecycle Rule tự động xóa các file trong thư mục tạm sau **7 ngày** nếu client xin Presigned URL nhưng không bao giờ gọi API xác nhận tạo bản ghi trong Database.
