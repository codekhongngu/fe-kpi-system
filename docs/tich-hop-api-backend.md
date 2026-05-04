# Tích hợp API Backend (be-kpi-system) cho Frontend (fe-kpi-system)

## 1) Tổng quan

Frontend hiện đang gọi API thông qua wrapper Axios tại `src/lib/api-client.ts`.

- Base URL mặc định: `http://localhost:5000/api/v1`
- Có cơ chế tự gắn `Authorization: Bearer <token>`
- Có cơ chế refresh token khi gặp `401`
- Có cơ chế unwrap response envelope `{ data, meta?, error }` thành `data`

## 2) Cấu hình môi trường

Thiết lập `.env` (hoặc `.env.local`) trong FE:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 3) Quy ước gọi API

### 3.1 Response envelope

Backend có thể trả theo 2 dạng:

1) Envelope:
```json
{ "data": {}, "meta": {}, "error": null }
```

2) Raw object:
```json
{ "id": "...", "name": "..." }
```

FE đã xử lý tự unwrap nếu response có `data` + `error`.

### 3.2 Auth header

Không cần tự gắn header nếu dùng `apiClient`:

```ts
import { apiClient } from '@/lib/api-client'

const { data } = await apiClient.get('/forms')
```

## 4) Mapping module “Quản lý biểu mẫu” (Form Designer)

### 4.1 Data model FE nên dùng

#### FormIndicator (chỉ tiêu)

- `id: string`
- `parentId: string | null`
- `sortOrder: number` (dùng để sắp xếp trong UI)
- `displayIndex: string | null` (chỉ dùng để HIỂN THỊ dạng 2, 2.1, 2.3…)
- `code: string`
- `name: string`

#### FormAttribute (thuộc tính/cột)

- `id: string`
- `parentId: string | null`
- `sortOrder: number` (dùng để sắp xếp trong UI)
- `name: string`

### 4.2 Quy tắc sắp xếp & hiển thị trên FE

- Dựng cây theo `parentId`:
  - `parentId = null` là node root
  - `parentId = <id>` là con của node có id tương ứng
- Trong mỗi nhóm “cùng parent”, sắp xếp tăng dần theo `sortOrder`
- Với chỉ tiêu, khi render label nên ưu tiên hiển thị:
  - `displayIndex` (nếu có) → `code` → `name`

### 4.3 Reorder (kéo thả) — payload FE gửi lên

FE gửi danh sách `items` theo thứ tự mong muốn sau khi kéo thả.

#### Reorder Indicators

`POST /forms/:formId/indicators/reorder`

Body:
```json
{
  "items": [
    { "id": "uuid-1", "parentId": null },
    { "id": "uuid-2", "parentId": "parent-uuid" },
    { "id": "uuid-3" }
  ]
}
```

- Nếu không gửi `parentId`: giữ nguyên parent hiện tại (chỉ đổi thứ tự)
- Nếu gửi `parentId: null`: đưa về root
- Nếu gửi `parentId: "<uuid>"`: đưa sang parent mới

Backend sẽ:
- Chuẩn hoá `sortOrder` theo từng nhóm `parentId` (0..n-1 trong mỗi group bị ảnh hưởng)
- Chặn trùng `id` trong payload
- Validate `parentId` phải thuộc cùng form
- Chặn tự tham chiếu và vòng lặp

#### Reorder Attributes

`POST /forms/:formId/attributes/reorder`

Body tương tự như indicators.

### 4.4 Gợi ý triển khai UI drag & drop

- Khi kéo item trong cùng 1 parent:
  - FE có thể gửi payload chỉ gồm các item trong parent đó theo thứ tự mới
- Khi kéo item sang parent khác hoặc về root:
  - FE nên gửi payload gồm:
    - item bị di chuyển (kèm `parentId` mới)
    - danh sách item của parent đích theo thứ tự mới (nếu UI đang reorder tại parent đích)
    - danh sách item của parent nguồn theo thứ tự mới (nếu UI đang reorder tại parent nguồn)

Backend hỗ trợ payload “một phần”: các item không nằm trong payload sẽ được giữ tương đối và nối phía sau trong group bị ảnh hưởng.

## 5) Tài liệu tham chiếu (source of truth)

- Postman collection: `be-kpi-system/postman.json`
- API contracts: `be-kpi-system/docs/QLDL_CLUSTER_02_API_CONTRACTS.md`
- Data model: `be-kpi-system/docs/QLDL_CLUSTER_03_DATA_MODEL.md`
- Data dictionary: `be-kpi-system/docs/DATA_DICTIONARY.md`
## 6) Auth & phiên đăng nhập

### 6.1 Endpoint (relative với `VITE_API_BASE_URL`)

- `POST /auth/login`
  - Body (Postman hiện tại):
    ```json
    { "usernameOrEmail": "admin@localhost.local", "password": "Admin@123" }
    ```
- `POST /auth/refresh-token`
  - Body:
    ```json
    { "refreshToken": "<refreshToken>" }
    ```
- `GET /auth/me`
- `POST /auth/logout`
  - Body:
    ```json
    { "refreshToken": "<refreshToken>" }
    ```
- `POST /auth/change-password`
  - Body:
    ```json
    { "oldPassword": "Password@123", "newPassword": "NewPass@123" }
    ```
- `POST /auth/forgot-password`
  - Body:
    ```json
    { "email": "user@example.com" }
    ```
- `POST /auth/reset-password`
  - Body:
    ```json
    { "token": "reset-token-from-email", "newPassword": "NewPass@123" }
    ```

Ghi chú: Trong `be-kpi-system/docs/QLDL_CLUSTER_02_API_CONTRACTS.md` có naming hơi khác (`identifier`, `/auth/refresh`). Khi implement FE, ưu tiên theo Postman collection nếu môi trường BE bạn chạy đúng theo collection.

### 6.2 Flow FE khuyến nghị

- Login → lưu `accessToken` (+ `refreshToken` nếu được trả về)
- Gọi `GET /auth/me` để lấy profile/role/org
- Khi API trả `401`:
  - gọi `POST /auth/refresh-token`
  - retry request cũ 1 lần
  - nếu refresh fail → xoá token + điều hướng về màn đăng nhập

## 7) RBAC (Role/Permission)

- `GET /permissions`
- `GET /role-groups`
- `POST /role-groups`
- `PATCH /role-groups/:roleGroupId`
- `DELETE /role-groups/:roleGroupId`

Ngoài ra theo Postman có các endpoint theo user:
- `GET /users/:userId/permissions`
- `GET /users/:userId/roles`

## 8) Users (Quản trị người dùng)

### 8.1 Endpoint

- `GET /users`
  - Query (Postman): `page,limit,q,search,status,isActive,orgId,roleGroupId,roleId,departmentId,sort`
  - Ví dụ:
    `/users?page=1&limit=10&q=&status=&isActive=&orgId=&roleGroupId=&roleId=&departmentId=&sort=createdAt,desc`
- `POST /users`
- `GET /users/:userId`
- `PATCH /users/:userId`
- `DELETE /users/:userId`
- `PATCH /users/:userId/activate`
- `PATCH /users/:userId/deactivate`
- `POST /users/:userId/reset-password`
- `PATCH /users/:userId/status`
- Import:
  - `POST /users/import`
  - `GET /users/import/:importJobId`
- Theo phòng ban:
  - `GET /users/departments/:departmentId`

### 8.2 Payload tạo user (Postman)

```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "Password@123",
  "fullName": "Test User",
  "phone": "0123456789",
  "code": "USR-TEST",
  "orgId": "<orgId>",
  "roleGroupIds": [],
  "roleIds": [],
  "departmentId": "<departmentId>",
  "status": "active"
}
```

## 9) Organizations (Cơ cấu tổ chức)

- `GET /orgs?q=&isActive=true`
- `GET /orgs?tree=true`
- `POST /orgs`
- `GET /orgs/:orgId`
- `PATCH /orgs/:orgId`
- `DELETE /orgs/:orgId`
- Khoá/mở khoá:
  - `POST /orgs/:orgId/lock`
  - `POST /orgs/:orgId/unlock`

## 10) Report periods (Kỳ báo cáo)

- `GET /report-periods?type=THANG&page=1&limit=20`
- `POST /report-periods`
- `GET /report-periods/:periodId`
- `PATCH /report-periods/:periodId`
- `DELETE /report-periods/:periodId`

## 11) Field categories & Indicator catalog (phục vụ thiết kế biểu mẫu)

### 11.1 Field categories

- `GET /field-categories?isActive=true&page=1&limit=100`
- `POST /field-categories`
- `PATCH /field-categories/:fieldCategoryId`
- `DELETE /field-categories/:fieldCategoryId`

### 11.2 Indicator catalog

- `GET /indicator-catalog?page=1&limit=20` (nếu BE bật)
- `POST /indicator-catalog`
- `PATCH /indicator-catalog/:catalogId`
- `DELETE /indicator-catalog/:catalogId`

## 12) Workflow: Assignments → Submissions → Approvals

### 12.1 Assignments (giao biểu)

- `POST /assignments` (bulk)
  - Body (Postman):
    ```json
    {
      "formId": "<formId>",
      "periodId": "<periodId>",
      "orgIds": ["<orgId>"],
      "deadlineFrom": "2026-04-01",
      "deadlineTo": "2026-04-30"
    }
    ```
- `GET /assignments?page=1&limit=20`
- `GET /my/assignments`

### 12.2 Submissions (nhập & nộp số liệu)

- `POST /submissions`
  - Body:
    ```json
    { "assignmentId": "<assignmentId>" }
    ```
- `GET /submissions/:submissionId`
- `PATCH /submissions/:submissionId/cells` (lưu nháp dữ liệu)
  - Body (Postman):
    ```json
    {
      "clientVersion": 1,
      "changes": [
        {
          "indicatorId": "<indicatorId>",
          "attributeId": "<attributeId>",
          "valueNumeric": "123.45"
        }
      ]
    }
    ```
- `POST /submissions/:submissionId/submit`
  - Body:
    ```json
    { "note": "Nộp từ FE" }
    ```

### 12.3 Approvals (duyệt)

- `GET /approvals/pending?page=1&limit=20`
- `POST /approvals/:submissionId/approve`
  - Body:
    ```json
    { "note": "Duyệt" }
    ```
- `POST /approvals/:submissionId/reject`
  - Body:
    ```json
    { "reason": "Thiếu số liệu" }
    ```

## 13) Monitoring / Query / Notifications / Analytics

### 13.1 Monitoring (theo dõi tiến độ)

- `GET /monitoring/reports?page=1&limit=20`
- `POST /monitoring/reminders`
  - Body:
    ```json
    { "assignmentIds": ["<assignmentId>"], "message": "Nhắc nộp báo cáo" }
    ```

### 13.2 Query (tra cứu)

- `GET /query/reports?page=1&limit=20`

### 13.3 Notifications (hộp thư thông báo)

- `GET /notifications?page=1&limit=20`

### 13.4 Analytics

- `GET /analytics/kpis?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /analytics/charts`
- `POST /analytics/pivot`
  - Body:
    ```json
    { "formId": "<formId>", "periodIds": ["<periodId>"], "orgIds": ["<orgId>"] }
    ```
- `GET /analytics/export?format=excel`

## 14) Quy ước list/query & lỗi

### 14.1 Pagination/sort

- List thường dùng `page`, `limit`
- `sort` dạng: `field,direction` (ví dụ `createdAt,desc`)
- Khi BE trả envelope, `meta` thường có `{ page, limit, total }`

### 14.2 Error envelope (theo API contracts)

```json
{ "data": null, "error": { "code": "STRING", "message": "STRING", "details": {} } }
```