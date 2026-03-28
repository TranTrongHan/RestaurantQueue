# Login Page & Auth State Discussion Plan

This document summarizes the proposed approach for designing the admin login page and managing the authentication state.

## 1. UI/UX Design Strategy

### Layout: Split Screen (50/50)
- **Left Side (The Form)**:
  - Clean white background.
  - **No logo** (as requested).
  - Heading: "Đăng nhập hệ thống" (System Login).
  - Subheading: "Quản trị hệ thống" (System Management).
  - Form Fields:
    - **Username**: Input with a user icon (`lucide-react`).
    - **Password**: Input with a lock icon and a visibility toggle (eye icon).
  - Link: "Quên mật khẩu?" (Forgot password?).
  - Button: Primary blue "Đăng nhập" (Login) with hover/loading states.
  - Footer: Copyright notice.

- **Right Side (Visual)**:
  - Background: Dark textured image (`bg.png`).
  - Content: A floating card with a drop shadow containing `image-1.png`.
  - Centered text below the image: "Chào mừng đến với Hệ thống quản trị".

### Responsiveness
- On mobile devices, the right side will be hidden, and the login form will take up the full screen.

## 2. Technical Stack & Implementation

### State Management (Zustand)
- **Store Path**: `src/store/useAuthStore.js`
- **State Properties**: `user`, `accessToken`, `isAuthenticated`, `isLoading`, `error`.
- **Actions**:
  - `login(credentials)`: Handles the API request and updates state.
  - `logout()`: Clears the state and cookies.
  - `initialize()`: Checks for existing tokens in cookies on app load.

### Persistence
- Use `react-cookie` to store the JWT/Auth token to ensure the session persists after a page refresh.

### Routing (React Router)
- Define `/login` as the entry route.
- Implement a `ProtectedRoute` wrapper to prevent unauthenticated access to the dashboard.

## 3. Open Points for Discussion

> [!IMPORTANT]
> **API Integration**:
> - Do you have the login API endpoint ready (e.g., `POST /auth/login`)?
> - Should we use a mock (simulated) login process for the first draft to focus on UI?
api để login là api dùng bên D:\Study\PTHTWeb\DoAn\RestaurantQueue\restaurant-client\src\components\pages\LoginPage.jsx
bạn hãy tham khảo các cách call api  trong D:\Study\PTHTWeb\DoAn\RestaurantQueue\restaurant-client\src\components\reducers\MyUserReducer.jsx, restaurant-client\src\components\forms\LoginForm.jsx
> [!TIP]
> **Enhancements**:
> - Would you like a "Remember Me" checkbox?
không cần
> - Should we add a simple fade-in animation for the right-side visual to make it feel more premium?
ok

---

Please let me know your thoughts on these points or if you'd like to adjust any part of the plan!
