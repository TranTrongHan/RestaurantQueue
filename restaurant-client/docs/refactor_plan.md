# Kế hoạch Refactor Hệ thống UI và Architecture

Đây là tài liệu kế hoạch refactor toàn diện (major refactor) cho dự án `restaurant-client` nhằm nâng cao trải nghiệm người dùng (UX), cải thiện hiệu năng và chuẩn hoá kiến trúc theo các "best practices" mới nhất.

## User Review Required

> [!IMPORTANT]
> - **State Management**: Kế hoạch đề xuất sử dụng **Zustand** làm thư viện quản lý state. Nó nhẹ, dễ học, và không có quá nhiều boilerplate như Redux. Bạn có đồng ý với Zustand không, hay bạn muốn dùng Redux Toolkit? đồng ý
> - **Tailwind CSS**: Kế hoạch sẽ gỡ bỏ hoàn toàn `bootstrap` và `react-bootstrap`. Quá trình này sẽ yêu cầu viết lại toàn bộ class cho các component hiện tại (như Layout, Button, Form).  đồng ý
> - **Nginx**: Cấu hình Nginx sẽ phục vụ static files và xử lý Client-side routing cho (React Router). đồng ý, đây là nginx.conf mẫu
user  nginx;
worker_processes  2;
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
  worker_connections  2048;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                  '$status $body_bytes_sent "$http_referer" '
                  '"$http_user_agent" "$http_x_forwarded_for"';
  access_log /var/log/nginx/access.log main;
  sendfile on;
  keepalive_timeout 65;
  server {
    listen 80;
    server_name localhost;

    location / {
      root /app;
      index index.html;
      try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
      root /usr/share/nginx/html;
    }
  }
}

## Proposed Changes

---

### Quản lý Dependencies (Package.json)
Thay đổi các thư viện phục vụ cho dự án để chuẩn hoá UI và State.
#### [MODIFY] [package.json](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/package.json)
- **Xóa**: `bootstrap`, `react-bootstrap`.
- **Thêm mới**: `tailwindcss`, `postcss`, `autoprefixer` (phục vụ Tailwind).
- **Thêm mới**: `zustand` (Quản lý state).

---

### Khởi tạo & Cấu hình Tailwind CSS
Tạo các tệp cấu hình cần thiết để Tailwind có thể hoạt động song song với Vite.
#### [NEW] [tailwind.config.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/tailwind.config.js)
- Cấu hình template paths (scan files trong `src/**/*.{js,jsx}`).
#### [NEW] [postcss.config.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/postcss.config.js)
- Tích hợp tailwindcss và autoprefixer vào Vite workflow.
#### [MODIFY] [index.css](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/index.css)
- Xóa các CSS cũ xung đột.
- Thêm `@tailwind base`, `@tailwind components`, `@tailwind utilities`.

---

### Quản lý State (Zustand)
Xây dựng một Global Store thay thế cho việc quản lý state thủ công.
#### [NEW] [store.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/src/store/index.js)
- Khởi tạo `useStore` cơ bản phục vụ cho các logic ví dụ như: Quản lý Auth, Quản lý Giỏ hàng/Queue, hoặc Quản lý Toast Notification.

---

### Setup Nginx Runtime và Docker
Sử dụng Multi-stage build để tối ưu dung lượng của Docker Image.
#### [MODIFY] [Dockerfile](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/Dockerfile)
- **Stage 1 (Builder)**: Dùng `node:20-alpine` (hoặc tương đương) để cài đặt dependency và chạy lệnh `npm run build`.
- **Stage 2 (Runtime)**: Dùng `nginx:alpine` để copy thư mục `dist/` vào `/usr/share/nginx/html`.
#### [NEW] [nginx.conf](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/restaurant-client/nginx.conf)
- Cấu hình Nginx rule `try_files $uri /index.html;` nhằm hỗ trợ React Router tránh lỗi 404 khi người dùng f5 (reload) trang.

---

### Thêm React Best Practice Skills
Tận dụng hệ thống skill được yêu cầu.
#### Lệnh thực thi:
- Chạy `npx skills add vercel-labs/agent-skills` để mang các kinh nghiệm triển khai tối ưu UI vào dự án.

## Open Questions

> [!WARNING]
> 1. Hiện tại backend API của dự án đang chạy ở port nào? Mình có cần cấu hình Nginx **proxy_pass** để forward những request từ `/api` tới Backend không?
backend đang ở port 8080 với url local như sau: http://localhost:8080/restaurantserver/api
> 2. Có thiết kế mẫu (Figma) nào để dựa vào xây dựng các component Tailwind không, hay mình sẽ tự do sáng tạo theo phong cách Modern/Glassmorphism/Minimalist?
mình không có thiết kế mẫu, nhưng mình có các config UI style từ một dự án Vue khác, bạn hãy dựa trên config này để xây dựng UI Style cho dự án react
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Override Gray colors với màu custom
        gray: {
          50: '#FAFAFA',
          100: '#F9F9F9',
          200: '#F1F1F4',
          300: '#DBDFE9',
          400: '#C4CADA',
          500: '#99A1B7',
          600: '#78829D',
          700: '#4B5675',
          800: '#252F4A',
          900: '#071437',
          950: '#030A1E',
        },
        // Custom semantic colors
        primary: {
          DEFAULT: '#1B84FF',
          active: '#056EE9',
          light: '#EFF6FF',
          clarity: 'rgba(27, 132, 255, 0.20)',
          inverse: '#ffffff',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#1B84FF',
          600: '#056EE9',
          700: '#0369D1',
          800: '#075985',
          900: '#0C4A6E',
        },
        success: {
          DEFAULT: '#17C653',
          active: '#04B440',
          light: '#EAFFF1',
          clarity: 'rgba(23, 198, 83, 0.20)',
          inverse: '#ffffff',
        },
        warning: {
          DEFAULT: '#F6B100',
          active: '#DFA000',
          light: '#FFF8DD',
          clarity: 'rgba(246, 177, 0, 0.20)',
          inverse: '#ffffff',
        },
        danger: {
          DEFAULT: '#F8285A',
          active: '#D81A48',
          light: '#FFEEF3',
          clarity: 'rgba(248, 40, 90, 0.20)',
          inverse: '#ffffff',
        },
        info: {
          DEFAULT: '#7239EA',
          active: '#5014D0',
          light: '#F8F5FF',
          clarity: 'rgba(114, 57, 234, 0.20)',
          inverse: '#ffffff',
        },
        brand: {
          DEFAULT: '#FF6F1E',
          active: '#F15700',
          light: '#FFF5EF',
          clarity: 'rgba(255, 111, 30, 0.20)',
          inverse: '#ffffff',
        },
      },
      boxShadow: {
        card: '0px 3px 4px 0px rgba(0, 0, 0, 0.03)',
        primary: '0px 4px 12px 0px rgba(40, 132, 239, 0.35)',
        success: '0px 4px 12px 0px rgba(53, 189, 100, 0.35)',
        danger: '0px 4px 12px 0px rgba(241, 65, 108, 0.35)',
        info: '0px 4px 12px 0px rgba(114, 57, 234, 0.35)',
        warning: '0px 4px 12px 0px rgba(246, 192, 0, 0.35)',
      },
    },
  },
  plugins: [],
}


## Verification Plan

### Automated Tests
- Kiểm tra Docker build: `docker build -t restaurant-client .`
- Xác minh linter: `npm run lint`

### Manual Verification
- Chạy hệ thống trên localhost: `npm run dev` để kiểm tra việc tích hợp Tailwind CSS đã hoạt động hay chưa.
- Chạy hệ thống bằng Docker container: `docker run -p 8080:80 restaurant-client` để đối chứng Nginx web server đã phục vụ chính xác production build chưa.
