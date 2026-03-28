# Initialize Admin Client React Application

This plan outlines the steps to create a new React application for the admin dashboard, mirroring the infrastructure and dependencies of the existing `restaurant-client` without copying its source code.

## User Review Required

> [!IMPORTANT]
> Please review the files that will be copied. The plan assumes copying standard build and deployment configurations but excludes any actual application logic.

## Proposed Changes

We will create the `admin-client` folder (if it doesn't exist) and populate it with the core configuration files from `restaurant-client`.

### Admin Client Configuration Files

The following files will be copied/created in the `admin-client` directory:

#### [NEW] [admin-client/package.json](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/package.json)
Copied from `restaurant-client` but with the `"name"` field updated to `"admin-client"`. This ensures all dependencies (React, Vite, Tailwind, Zustand, etc.) match exactly.

#### [NEW] [admin-client/nginx.conf](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/nginx.conf)
Copied directly from `restaurant-client`.

#### [NEW] [admin-client/Dockerfile](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/Dockerfile)
Copied directly from `restaurant-client`.

#### [NEW] [admin-client/tailwind.config.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/tailwind.config.js)
Copied directly from `restaurant-client` to maintain the design system.

#### [NEW] [admin-client/postcss.config.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/postcss.config.js)
Copied directly from `restaurant-client`.

#### [NEW] [admin-client/vite.config.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/vite.config.js)
Copied directly from `restaurant-client`.

#### [NEW] [admin-client/eslint.config.js](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/eslint.config.js)
Copied directly from `restaurant-client`.

#### [NEW] [admin-client/.gitignore](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/.gitignore)
Copied directly from `restaurant-client`.

#### [NEW] [admin-client/index.html](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/index.html)
Base HTML file, modified to have the title "Admin Dashboard".

### Minimal Source Code

We will initialize a clean `src` and `public` directory so the project can build and run immediately.

#### [NEW] [admin-client/src/main.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/main.jsx)
Minimal React entry point.

#### [NEW] [admin-client/src/App.jsx](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/App.jsx)
A basic initial component for the admin panel.

#### [NEW] [admin-client/src/index.css](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/admin-client/src/index.css)
Base Tailwind CSS imports.

## Open Questions

> [!NOTE]
> Are there any specific environment variables (`.env`) from `restaurant-client` that should also be copied over, or will we configure those later?
yes, copy .env from restaurant-client to admin-client
## Verification Plan

### Automated Tests
- Run `npm install` in `admin-client` to ensure all packages resolve correctly.
- Run `npm run build` to verify the Vite/Tailwind build pipeline works out of the box.

### Manual Verification
- We can optionally run `npm run dev` and verify that the base UI renders correctly on a local port.
