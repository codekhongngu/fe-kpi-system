# KT-XH Dashboard — Mapping Page / Card / Biến

Tài liệu tham chiếu khi chỉnh sửa gắn dữ liệu API (`cells`) lên UI dashboard KT-XH.

**Cập nhật:** theo codebase `fe-kpi-system` (GRDP + Agriculture đã gắn API).

---

## Quy ước chung

| Mục | Giá trị |
|-----|---------|
| API | `GET /dashboard/field-categories/{fieldCategoryId}/reports?templateId=...&periodCode=...&periodType=...` |
| Attribute thực hiện | `Thực hiên` (`DASHBOARD_ATTR_CURRENT` trong `dashboard-cell-lookup.ts`) |
| Attribute cùng kỳ | `Cùng kỳ năm trước` (`DASHBOARD_ATTR_PRIOR_YEAR`) |
| % so kỳ | `(Thực hiên / Cùng kỳ năm trước) × 100` — `formatDashboardYoYPercent` |
| Tra cứu ô | `code` + `attributeName` — `buildDashboardCellLookup` / `getDashboardCellValue` |
| Search URL | `fieldCategoryId`, `templateId`, `periodCode`, `periodType` |
| Hub → route | `legacy-field-routes.ts` + `dashboard-field-route.ts` |

### File code liên quan

| Page | Route | Hook display | Page component |
|------|-------|--------------|----------------|
| GRDP | `/grdp` | `use-grdp-display-values.ts` | `pages/kt-xh/grdp.tsx` |
| Nông nghiệp | `/agriculture` | `use-agriculture-display-values.ts` | `pages/kt-xh/agriculture.tsx` |
| Chăn nuôi | `/livestock` | *(chưa có)* | `pages/kt-xh/livestock.tsx` |
| Trồng trọt khác | `/tree-planting-other` | *(chưa có)* | `pages/kt-xh/tree-planting-other.tsx` |
| Lâm nghiệp, Thủy sản | `/forestry-fishery` | *(chưa có)* | `pages/kt-xh/forestry-fishery.tsx` |

### Mã lĩnh vực Hub (BE)

| Route | `fieldCategory.code` |
|-------|----------------------|
| `/grdp` | `kinh_te` |
| `/agriculture` | `nong_nghiep` |
| `/livestock` | `chan_nuoi` |
| `/forestry-fishery` | `lam_nghiep_thuy_san` |
| `/tree-planting-other` | `trong_trot_khac` |

---

## `/grdp` — GRDP

- **Tiêu đề header:** `GRDP`
- **Trạng thái API:** Đã gắn
- **Biểu đồ:** `GrdpColumnLineChart` — cột = Thực hiên, đường = % so kỳ

### Card 1 — Tổng sản phẩm theo giá so sánh

| Nhãn UI | Biến (`display.*`) | Mã CSTT | Attribute / Ghi chú |
|---------|-------------------|---------|---------------------|
| *(số lớn, Triệu đồng)* | `card1Total` | CSTT11 | Thực hiên |
| So với cùng kỳ | `card1YoY` | CSTT11 | Thực hiên vs Cùng kỳ năm trước → % |
| Tổng giá trị tăng thêm | `card1ValueAdded` | CSTT12 | Thực hiên |
| % dưới GTTT | `card1ValueAddedYoY` | CSTT12 | YoY % |
| Thuế SP trừ trợ cấp | `card1TaxNet` | CSTT18 | Thực hiên |
| % dưới Thuế SP | `card1TaxNetYoY` | CSTT18 | YoY % |

**Biểu đồ mini (`card1Chart`):**

| Cột chart | Nhãn trục | Mã | Cột (value) | Đường (yoyPercent) |
|-----------|-----------|-----|-------------|-------------------|
| 1 | KV III | CSTT13 | Thực hiên | YoY % |
| 2 | KV II | CSTT14 | Thực hiên | YoY % |
| 3 | KV I | CSTT17 | Thực hiên | YoY % |

### Card 2 — Tổng sản phẩm theo giá hiện hành

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| *(số lớn)* | `card2Total` | CSTT19 | Thực hiên |
| So với cùng kỳ | `card2YoY` | CSTT19 | YoY % |
| Tổng giá trị tăng thêm | `card2ValueAdded` | CSTT20 | Thực hiên |
| % | `card2ValueAddedYoY` | CSTT20 | YoY % |
| Thuế SP trừ trợ cấp | `card2TaxNet` | CSTT26 | Thực hiên |
| % | `card2TaxNetYoY` | CSTT26 | YoY % |

**Biểu đồ (`card2Chart`):** CSTT21 (KV III), CSTT22 (KV II), CSTT25 (KV I) — cột + đường như Card 1.

### Card 3 — Tốc độ tăng GRDP

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Tổng giá trị tăng thêm | `card3ValueAddedRate` | CSTT04 | Thực hiên (format %) |
| Thuế SP trừ trợ cấp | `card3TaxNetRate` | CSTT10 | Thực hiên (format %) |

**Biểu đồ (`card3Chart`):** CSTT05 (KV III), CSTT06 (KV II), CSTT09 (KV I) — cột + đường.

### Card 4 — Cơ cấu GRDP

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| KV III (Dịch vụ) | `card4ShareKv3` | CSTT33 | Thực hiên (%) |
| KV II (Công nghiệp) | `card4ShareKv2` | CSTT30 | Thực hiên (%) |
| KV I (Nông, Lâm) | `card4ShareKv1` | CSTT29 | Thực hiên (%) |
| Thuế sản phẩm | `card4ShareTax` | CSTT34 | Thực hiên (%) |
| Donut gradient | `card4DonutGradient` | — | Tính từ 4 giá trị trên |

---

## `/agriculture` — NÔNG NGHIỆP: TRỒNG TRỐT

- **Tiêu đề header:** `NÔNG NGHIỆP: TRỒNG TRỐT`
- **Trạng thái API:** Đã gắn
- **Fallback khi chưa có data:** xem `EMPTY` trong `use-agriculture-display-values.ts`

### Section 1 — TỔNG DIỆN TÍCH GIEO TRỒNG VÀ SẢN LƯỢNG CÂY LÚA

#### Card 1 — Tổng diện tích

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| TỔNG DIỆN TÍCH GIEO TRỒNG (ha) | — | — | Nhãn tĩnh |
| Số chính | `section1Area.value` | CSTT73 | Thực hiên |
| So với kỳ trước (%) | `section1Area.yoy` | CSTT73 | YoY % |

#### Card 2 — Sản lượng

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| SẢN LƯỢNG (tấn) | — | — | Nhãn tĩnh |
| Số chính | `section1Output.value` | CSTT75 | Thực hiên |
| So với kỳ trước (%) | `section1Output.yoy` | CSTT75 | YoY % |

#### Card 3 — Năng suất

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| NĂNG SUẤT (tạ/ha) | — | — | Nhãn tĩnh |
| Số chính | `section1Yield.value` | CSTT76 | Thực hiên |
| So với kỳ trước (%) | `section1Yield.yoy` | CSTT76 | YoY % |

### Section 2 — CHỈ TIÊU TRỒNG TRỐT

Mỗi hàng: `.value` = Thực hiên, `.yoy` = % so kỳ (cùng mã CSTT).

#### Card 4 — LÚA VỤ ĐÔNG XUÂN

| Nhãn UI | Biến | Mã CSTT |
|---------|------|---------|
| LÚA VỤ ĐÔNG XUÂN | — | — |
| Diện tích (ha) | `dongXuanArea` | CSTT78 |
| Sản lượng (tấn) | `dongXuanOutput` | CSTT80 |
| Năng suất (tạ/ha) | `dongXuanYield` | CSTT81 |

#### Card 5 — LÚA VỤ HÈ THU

| Nhãn UI | Biến | Mã CSTT |
|---------|------|---------|
| LÚA VỤ HÈ THU | — | — |
| Diện tích (ha) | `heThuArea` | CSTT83 |
| Sản lượng (tấn) | `heThuOutput` | CSTT85 |
| Năng suất (tạ/ha) | `heThuYield` | CSTT86 |

#### Card 6 — LÚA VỤ MÙA

| Nhãn UI | Biến | Mã CSTT |
|---------|------|---------|
| LÚA VỤ MÙA | — | — |
| Diện tích (ha) | `muaArea` | CSTT88 |
| Sản lượng (tấn) | `muaOutput` | CSTT90 |
| Năng suất (tạ/ha) | `muaYield` | CSTT91 |

**Tổng Agriculture:** 12 mã CSTT × 2 (value + yoy) = **24 ô số**.

---

## `/livestock` — Chăn nuôi

- **Tiêu đề header:** *(chưa có KtXhHeader + API)*
- **Trạng thái API:** Chưa gắn — số hardcode trong `livestock.tsx`
- **Cần bổ sung:** mapping CSTT + `use-livestock-display-values.ts`

### Section — SỐ LƯỢNG GIA SÚC, GIA CẦM

| Card | Nhãn | Giá trị mock (hiện tại) | Biến / CSTT |
|------|------|-------------------------|-------------|
| 1 | TỔNG ĐÀN BÒ | `0,0` | *chưa map* |
| 2 | TỔNG ĐÀN LỢN | `0,0` | *chưa map* |
| 3 | TỔNG ĐÀN GIA CẦM | `0,0` | *chưa map* |

### Section — SẢN LƯỢNG CHĂN NUÔI

| Card | Nhãn phụ | Giá trị mock | % mock | Biến / CSTT |
|------|----------|--------------|--------|-------------|
| 1 | Thịt lợn hơi | *(số lớn)* | `+107,70` | *chưa map* |
| 2 | Thịt trâu hơi | *(số lớn)* | `91,00` | *chưa map* |
| 3 | Thịt bò hơi | *(số lớn)* | `0,00` | *chưa map* |

### Section — SỐ TRANG TRẠI (và các section tiếp theo trong file)

| Card | Nhãn phụ | % mock (ví dụ) | Biến / CSTT |
|------|----------|----------------|-------------|
| — | Thịt gia cầm | `+106,80` | *chưa map* |

> Mở `livestock.tsx` để liệt kê đầy đủ các card còn lại khi gắn API.

---

## `/tree-planting-other` — Các loại cây trồng khác

- **Trạng thái API:** Chưa gắn
- **Section 1:** 3 card (Diện tích / Sản lượng / Năng suất) — biểu đồ cột theo cây (Lạc, Sắn, Rau, Ngô, …) hardcode
- **Section 2:** Card tổng hợp — `0,0` / `So với kỳ trước (%): 0,0`

| Cần bổ sung khi gắn API |
|-------------------------|
| Bảng CSTT cho từng cột cây trồng và từng metric |
| `use-tree-planting-display-values.ts` |

---

## `/forestry-fishery` — Lâm nghiệp, Thủy sản

- **Trạng thái API:** Chưa gắn

### LÂM NGHIỆP

| Card | Nhãn | Giá trị mock | % mock | Biến / CSTT |
|------|------|--------------|--------|-------------|
| 1 | Diện tích trồng rừng và cây phân tán | *(số lớn)* | `+105,20` | *chưa map* |
| 2 | Sản lượng gỗ khai thác (Rừng trồng) | *(số lớn)* | `+98,50` | *chưa map* |

### THỦY SẢN

| Card | Nhãn | % mock | Biến / CSTT |
|------|------|--------|-------------|
| 1 | Sản lượng thủy sản nuôi trồng | `+112,30` | *chưa map* |
| 2 | Sản lượng thủy sản khai thác | `+95,80` | *chưa map* |

---

## Checklist khi thêm / sửa binding

1. Cập nhật hook `use-*-display-values.ts` (mã CSTT + attribute).
2. Thay hardcode trong `pages/kt-xh/*.tsx` bằng `display.*`.
3. Nếu page mới: thêm `validateSearch` trên route + entry trong `legacy-field-routes.ts`.
4. Kiểm tra log `cells` (`DashboardReportsDebugPanel` hoặc `buildCellsLogPayload`).
5. Cập nhật **file tài liệu này**.

---

## Ghi chú attribute từ API

Nếu BE trả `attributeName` khác (ví dụ `KH NĂM NAY`, `Ghi chú`), cần:

- Bổ sung alias trong `dashboard-cell-lookup.ts` (`dashboardAttributesMatch`), hoặc
- Đổi `DASHBOARD_ATTR_CURRENT` / `DASHBOARD_ATTR_PRIOR_YEAR` cho đúng tên cột thực tế.
