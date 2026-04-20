# Tài liệu kỹ thuật hệ thống KPI (QLDD) - Phân rã theo module

## 1. Mục tiêu và phạm vi
Tài liệu này được xây dựng từ đặc tả `ĐẶC_TẢ_CHỨC_NĂNG_QLDD_v2.0.docx` (04/2026), tập trung vào các module mà hệ thống KPI cần triển khai:
- Quản trị hệ thống: User, Roles & Permissions, Quản lý đơn vị, Catalog kỳ báo cáo.
- Quản lý biểu mẫu: Danh sách biểu mẫu, thêm/sửa/xóa biểu mẫu, cấu trúc biểu mẫu.
- Quản lý báo cáo: Danh sách báo cáo, thêm/sửa/xóa theo vòng đời nghiệp vụ báo cáo.

Nguyên tắc lõi: **Báo cáo là instance của biểu mẫu** theo từng đơn vị và kỳ báo cáo.

## 2. Khái niệm nghiệp vụ cốt lõi

## 2.1 Thực thể chính
- `FormTemplate` (Biểu mẫu): định nghĩa cấu trúc dữ liệu, danh sách chỉ tiêu, thuộc tính, chu kỳ báo cáo.
- `ReportPeriod` (Kỳ báo cáo): tuần/tháng/quý/năm, phạm vi ngày và trạng thái.
- `OrganizationUnit` (Đơn vị): cây tổ chức cha-con, phục vụ phân quyền dữ liệu và giao báo cáo.
- `ReportAssignment` (Giao báo cáo): ánh xạ biểu mẫu + kỳ + đơn vị + hạn nộp.
- `ReportInstance` (Báo cáo): bản ghi dữ liệu thực tế của 1 đơn vị cho 1 biểu mẫu trong 1 kỳ.
- `ReportValue`: dữ liệu chi tiết theo từng chỉ tiêu/thuộc tính trong một báo cáo.

## 2.2 Định danh nghiệp vụ của báo cáo
Một báo cáo duy nhất theo khóa nghiệp vụ:
- `form_template_id + report_period_id + organization_unit_id`

Ràng buộc:
- Không giao trùng báo cáo theo bộ khóa trên.
- ReportInstance được sinh khi giao báo cáo hoặc khi người dùng mở nhập liệu lần đầu (tùy thiết kế kỹ thuật).

## 2.3 Trạng thái báo cáo
Đề xuất chuẩn hóa trạng thái theo đặc tả:
- `NOT_STARTED`: đã giao, chưa nhập.
- `DRAFT`: đang nhập/lưu nháp.
- `PENDING`: đã gửi duyệt.
- `APPROVED`: đã phê duyệt.
- `REJECTED`: bị trả lại/từ chối.
- `OVERDUE`: quá hạn nộp (trạng thái tính toán theo hạn nộp).

## 3. Kiến trúc chức năng tổng thể

## 3.1 Tầng chức năng
- Presentation Layer: Web responsive cho desktop/tablet/mobile.
- Business Layer: API + nghiệp vụ phân quyền, workflow báo cáo.
- Data Layer: CSDL quan hệ + lưu file đính kèm + audit log.

## 3.2 Nguyên tắc phân quyền
- Feature-level: `view/create/update/delete/export/approve/assign`.
- Data-level: `all_units`, `own_unit`, `child_units`.
- Người dùng có thể thuộc nhiều role; quyền hiệu lực là hợp nhất theo cấu hình RBAC.

## 4. Module A - Quản trị hệ thống

## 4.1 Quản lý User
### Chức năng
- Xem danh sách, tìm kiếm theo mã/tên/email/đơn vị.
- Thêm mới user, tự sinh mật khẩu tạm và gửi email.
- Cập nhật thông tin user, đổi trạng thái active/inactive.
- Reset mật khẩu bởi admin.
- Import user hàng loạt qua Excel.
- Xóa mềm user (soft delete), lưu đầy đủ lịch sử.

### Quy tắc nghiệp vụ
- `email`, `username`, `user_code` không trùng toàn hệ thống.
- Không xóa user còn báo cáo chưa hoàn thành.
- Khi inactive: không cho đăng nhập.
- Import phải có báo cáo lỗi theo từng dòng.

### Dữ liệu chính
- Bảng: `users`, `user_profiles`, `user_status_history`, `user_import_jobs`.

## 4.2 Roles & Permissions (RBAC)
### Chức năng
- Quản lý nhóm quyền: tạo/sửa/xóa nhóm quyền.
- Gán quyền chức năng và phạm vi dữ liệu.
- Gán user vào nhiều nhóm quyền.

### Quy tắc nghiệp vụ
- 4 nhóm mặc định không được xóa: `System Admin`, `Data Manager`, `Data Entry`, `Approver`.
- Chỉ xóa role khi không còn user gán vào role đó.
- Mọi thay đổi phân quyền phải ghi audit log.

### Dữ liệu chính
- Bảng: `roles`, `permissions`, `role_permissions`, `user_roles`, `scope_policies`.

## 4.3 Quản lý đơn vị
### Chức năng
- Danh sách đơn vị dạng cây: mã, tên, cấp bậc, trưởng đơn vị, trạng thái.
- Thêm đơn vị mới, khai báo đơn vị cha.
- Sửa thông tin, khóa/mở khóa đơn vị.
- Xóa đơn vị khi thỏa điều kiện.

### Quy tắc nghiệp vụ
- `unit_code` duy nhất.
- Cấu trúc phân cấp: Cơ quan -> Phòng ban -> Bộ phận -> Nhóm.
- Chỉ xóa đơn vị khi không còn thành viên và không có biểu mẫu/báo cáo đang thực hiện.
- Đơn vị bị khóa: không nhận giao mới; user thuộc đơn vị không đăng nhập.

### Dữ liệu chính
- Bảng: `organization_units`, `organization_tree`, `unit_leaders`, `unit_status_history`.

## 4.4 Catalog kỳ báo cáo
### Chức năng
- Quản lý kỳ báo cáo tuần/tháng/quý/năm.
- Tìm kiếm/lọc theo kiểu kỳ, thời gian, trạng thái.
- Thêm/sửa/xóa kỳ báo cáo.

### Quy tắc nghiệp vụ
- `end_date > start_date`.
- Không trùng kỳ cùng loại theo cùng khoảng thời gian.
- Không cho xóa kỳ đã được dùng để giao báo cáo.

### Dữ liệu chính
- Bảng: `report_periods`.

## 5. Module B - Quản lý biểu mẫu

## 5.1 Danh sách biểu mẫu
### Chức năng
- Hiển thị danh sách: mã biểu mẫu, tên, lĩnh vực, chu kỳ, trạng thái.
- Tìm kiếm/lọc theo lĩnh vực, chu kỳ, trạng thái.
- Xem chi tiết, preview biểu mẫu nhập liệu.
- Xem thống kê đơn vị đã giao và tỷ lệ hoàn thành theo kỳ.

### Quy tắc nghiệp vụ
- Chỉ biểu mẫu active mới cho phép giao mới.
- Biểu mẫu inactive vẫn giữ nguyên dữ liệu lịch sử.

## 5.2 Thêm/Sửa/Xóa biểu mẫu
### Chức năng
- Tạo mới biểu mẫu, cho phép sao chép cấu trúc từ biểu mẫu khác.
- Cập nhật metadata biểu mẫu (tên, mô tả, lĩnh vực, chu kỳ).
- Upload file mẫu tham chiếu (Excel/PDF).
- Xóa cứng hoặc vô hiệu hóa tùy trạng thái sử dụng.

### Quy tắc nghiệp vụ
- Tên biểu mẫu không trùng trong cùng lĩnh vực.
- Tối đa 255 ký tự cho tên biểu mẫu.
- Chỉ xóa cứng khi chưa có dữ liệu report instance phát sinh.
- Nếu đã có dữ liệu, chỉ cho phép `inactive`.

## 5.3 Thuộc tính và chỉ tiêu biểu mẫu
### Chức năng
- Quản lý thuộc tính chỉ tiêu (kiểu dữ liệu, bắt buộc, hiển thị, thứ tự).
- Quản lý danh sách chỉ tiêu (mã, tên, đơn vị tính, loại, nhóm, công thức).
- Import thuộc tính/chỉ tiêu hàng loạt qua Excel.

### Quy tắc nghiệp vụ
- `indicator_code` duy nhất trong một biểu mẫu.
- Không xóa chỉ tiêu đã có dữ liệu trong báo cáo.
- Thuộc tính mặc định hệ thống không cho phép xóa.
- Hỗ trợ chỉ tiêu tính toán tự động dựa trên công thức.

### Dữ liệu chính
- Bảng: `form_templates`, `form_template_versions`, `template_fields`, `template_indicators`, `template_files`.

## 6. Module C - Quản lý báo cáo (Report Instance)

## 6.1 Danh sách báo cáo
### Chức năng
- Data Manager xem danh sách biểu mẫu cần giao báo cáo.
- Đơn vị nhập liệu xem danh sách báo cáo được giao: tên biểu mẫu, kỳ, hạn nộp, trạng thái, % hoàn thành.
- Approver/theo dõi xem danh sách báo cáo chờ duyệt hoặc toàn cục theo bộ lọc.

### Quy tắc nghiệp vụ
- Lọc theo trạng thái: chưa nhập, draft, pending, approved, rejected, overdue.
- Ưu tiên hiển thị báo cáo gần đến hạn/quá hạn.

## 6.2 Thêm báo cáo (khởi tạo instance qua giao báo cáo)
### Chức năng
- Chọn biểu mẫu, kỳ báo cáo, một hoặc nhiều đơn vị nhận báo cáo.
- Thiết lập hạn nhập liệu; hỗ trợ mặc định từ ngày hiện tại đến +30 ngày.
- Lưu giao báo cáo và gửi thông báo tự động.
- Tùy chọn tự động giao kỳ sau dựa trên kỳ hiện tại.

### Quy tắc nghiệp vụ
- Không tạo/giao trùng `form + kỳ + đơn vị`.
- Chỉ hủy giao khi đơn vị chưa bắt đầu nhập liệu.
- Hủy giao phải bắt buộc ghi lý do vào audit log.

## 6.3 Sửa báo cáo
### Chức năng
- Sửa dữ liệu nhập liệu dạng lưới theo chỉ tiêu/thuộc tính.
- Auto-save mỗi 30 giây khi có thay đổi.
- Import dữ liệu từ Excel, sao chép dữ liệu kỳ trước.
- Gửi duyệt kèm ghi chú.
- Approver cập nhật nội dung từ chối trong 24h sau thao tác.

### Quy tắc nghiệp vụ
- Chỉ cho gửi duyệt khi đủ các ô bắt buộc.
- Validate realtime: kiểu dữ liệu, min/max, bắt buộc, cảnh báo lệch >50% kỳ trước.
- Khi bị từ chối, đơn vị được sửa và gửi lại; lưu lịch sử từng lần gửi.

## 6.4 Xóa báo cáo
### Chức năng
- Xóa logic theo 2 ngữ cảnh:
- Hủy giao báo cáo (trước khi bắt đầu nhập).
- Soft delete báo cáo do nghiệp vụ quản trị đặc biệt (nếu được mở quyền).

### Quy tắc nghiệp vụ
- Không xóa cứng report instance đã đi qua phê duyệt hoặc đã phát sinh lịch sử.
- Bắt buộc lưu vết audit với actor, thời gian, lý do, before/after.

## 6.5 Tổng hợp, phê duyệt, tra cứu
### Chức năng
- Tổng hợp số liệu từ các đơn vị đã nộp.
- Trình lãnh đạo và duyệt/từ chối báo cáo tổng hợp.
- Theo dõi tiến độ thực hiện theo đơn vị/biểu mẫu/kỳ.
- Tra cứu chi tiết theo đơn vị hoặc theo báo cáo tổng hợp đa tiêu chí.
- Xuất Excel/PDF.

### Quy tắc nghiệp vụ
- Tổng hợp cho phép chạy lại khi có đơn vị nộp muộn.
- Luôn lưu lịch sử phê duyệt/từ chối và thông báo cho bên liên quan.

## 7. Quy trình vòng đời báo cáo (End-to-End)
1. Admin/Data Manager tạo biểu mẫu và cấu hình kỳ báo cáo.
2. Data Manager giao biểu mẫu cho đơn vị theo kỳ và hạn nộp.
3. Hệ thống tạo report instance tương ứng cho từng đơn vị.
4. Data Entry nhập dữ liệu, auto-save, kiểm tra hợp lệ, gửi duyệt.
5. Approver phê duyệt hoặc từ chối.
6. Nếu từ chối, Data Entry chỉnh sửa và gửi lại.
7. Data Manager/Tổng hợp chạy tổng hợp dữ liệu và trình lãnh đạo.
8. Kết thúc kỳ: khóa dữ liệu, xuất báo cáo, lưu trữ audit.

## 8. Thiết kế API mức khuyến nghị
- `POST /api/forms`, `GET /api/forms`, `PATCH /api/forms/{id}`, `DELETE /api/forms/{id}`
- `POST /api/report-periods`, `GET /api/report-periods`, `PATCH /api/report-periods/{id}`, `DELETE /api/report-periods/{id}`
- `POST /api/assignments`, `POST /api/assignments/{id}/cancel`
- `GET /api/reports`, `GET /api/reports/{id}`, `PATCH /api/reports/{id}`
- `POST /api/reports/{id}/submit`, `POST /api/reports/{id}/approve`, `POST /api/reports/{id}/reject`
- `POST /api/reports/{id}/import-excel`, `GET /api/reports/{id}/export`
- `POST /api/reports/aggregate`, `GET /api/reports/monitoring`

## 9. Kiểm soát dữ liệu, bảo mật, audit
- Áp dụng RBAC + data scope ở mọi API nghiệp vụ.
- Mật khẩu hash `bcrypt` cost >= 12; hỗ trợ 2FA.
- Khóa tạm tài khoản sau 5 lần đăng nhập sai liên tiếp trong 15 phút.
- Session timeout mặc định 30 phút không hoạt động.
- Audit bắt buộc cho: giao/hủy giao, submit, approve/reject, thay đổi quyền, import dữ liệu, xóa mềm.
- Nhật ký thay đổi dữ liệu chi tiết tới mức ô nhập (old/new value).

## 10. Danh sách chức năng đối chiếu đặc tả
- Hệ thống chung: `SYS-01-A/B/C`, `SYS-02`, `SYS-03`.
- Quản trị hệ thống: `ORG-01-A/B/C`, `RPT-PRD-01-A/B`, `USR-01-A/B/C/D/E`, `USR-03`, `USR-04`.
- Quản lý biểu mẫu: `FM-01-A/B/C/D`, `FM-02`, `FM-03`.
- Quản lý báo cáo: `ASGN-01-A/B/C/D`, `DM-01-A/B/C/D/E/F`, `SUBM-01-A/B`, `SUM-01-A/B/C`, `APPR-01-A/B/C/D/E`, `MON-01`, `QRY-01`, `QRY-02`.
