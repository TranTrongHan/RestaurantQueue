# Implementation Plan - MenuItem Management & DTO Refactoring

This plan details the transition from Thymeleaf-based DTOs to REST-ready DTOs, implementing menu management for Admins, and ensuring correct visibility for Customers.

## User Review Required

> [!IMPORTANT]
> - **DTO Rename**: I will rename `MenuItemForm` to `MenuItemRequest` as it is now used for REST APIs instead of HTML forms.
> - **Visibility Logic**: I will update the customer-facing Menu API to return *only* active items (`isAvailable = true`).
> - **Image Management**: Per your request, if no new image file or URL is provided during an update, the existing image will be strictly preserved.

## Proposed Changes

### `com.tth.RestaurantApplication.dto.request`

#### [RENAME] [MenuItemForm.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/dto/request/MenuItemForm.java) -> [MenuItemRequest.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/dto/request/MenuItemRequest.java)
- Rename the class and add `Boolean isAvailable` field.

---

### `com.tth.RestaurantApplication.repository`

#### [MODIFY] [MenuItemRepository.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/repository/MenuItemRepository.java)
- Add `findByCategory_CategoryIdAndIsAvailableTrue(Integer categoryId)`.
- Ensure all customer-facing native queries include `is_available = true` (this seems mostly done, but I will double-check).

---

### `com.tth.RestaurantApplication.service`

#### [MODIFY] [MenuItemService.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/MenuItemService.java)
- Update `addOrUpdateMenuItem` to use `MenuItemRequest`.
- **Image Logic**: Update to keep the existing image if the `file` is null/empty.
- **Listing Logic**:
    - Update `getListMenuItem` to only return available items.
    - Add `getListMenuItemForAdmin` to return all items.
- **Status Toggle**: Add `toggleMenuItemStatus(Integer id, boolean status)`.

---

### `com.tth.RestaurantApplication.controller`

#### [MODIFY] [MenuItemController.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/controller/MenuItemController.java)
- Update existing `GET` methods to ensure they only show available items.
- Add Admin-only endpoints (protected by `@PreAuthorize("hasRole('ADMIN')")`):
    - `GET /api/menu_items/admin`: Get all items (paginated or simple list).
    - `POST /api/menu_items/admin`: Create new item.
    - `PUT /api/menu_items/admin/{id}`: Update existing item.
    - `PATCH /api/menu_items/admin/{id}/status`: Toggle `is_available`.

#### [MODIFY] [AdminController.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/controller/AdminController.java)
- Update references from `MenuItemForm` to `MenuItemRequest`.

---

### `com.tth.RestaurantApplication.configs`

#### [MODIFY] [SecurityConfig.java](file:///d:/DaiHoc/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/configs/SecurityConfig.java)
- Configure path-based security for `/api/menu_items/admin/**` to require `ADMIN` role.

## Open Questions

- Should I preserve the old Thymeleaf endpoints in `AdminController`, or are they safe to remove since you've moved to React? (I will assume they should be kept for now but updated to use the new DTO).

## Verification Plan

### Automated Tests
- Build verification.
- Verify through logs that `isAvailable` is correctly filtered in SQL queries.

### Manual Verification
- Test creating/updating a menu item without uploading an image; verify the old image stays.
- Test setting a menu item to "inactive" and verify it disappears from the customer menu but remains visible for Admin.
- Generate API documentation in markdown for the Frontend team.
