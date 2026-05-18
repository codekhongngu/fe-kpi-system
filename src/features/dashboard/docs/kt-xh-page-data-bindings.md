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
| Chăn nuôi | `/livestock` | `use-livestock-display-values.ts` | `pages/kt-xh/livestock.tsx` |
| Trồng trọt khác | `/tree-planting-other` | `use-tree-planting-display-values.ts` | `pages/kt-xh/tree-planting-other.tsx` |
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

## `/livestock` — CHĂN NUÔI

- **Tiêu đề header:** `CHĂN NUÔI`
- **Trạng thái API:** Đã gắn

### Section 1 — SỐ LƯỢNG GIA SÚC, GIA CẦM TRONG CHĂN NUÔI

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 1 | TỔNG ĐÀN BÒ | `herdCattle.value` | CSTT127 | Thực hiên |
| 1 | So với cùng kỳ (%) | `herdCattle.yoy` | CSTT127 | YoY % |
| 2 | TỔNG ĐÀN LỢN | `herdPig.value` | CSTT126 | Thực hiên |
| 2 | So với cùng kỳ (%) | `herdPig.yoy` | CSTT126 | YoY % |
| 3 | TỔNG ĐÀN GIA CẦM | `herdPoultry.value` | CSTT128 | Thực hiên |
| 3 | So với cùng kỳ (%) | `herdPoultry.yoy` | CSTT128 | YoY % |

### Section 2 — SẢN LƯỢNG CHĂN NUÔI

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 4 | Thịt bò hơi | `beefMeat.value` | CSTT131 | Thực hiên |
| 4 | So với cùng kỳ (%) | `beefMeat.yoy` | CSTT131 | YoY % |
| 5 | Thịt lợn hơi | `porkMeat.value` | CSTT130 | Thực hiên |
| 5 | So với cùng kỳ (%) | `porkMeat.yoy` | CSTT130 | YoY % |
| 6 | Gia cầm | `poultryMeat.value` | CSTT132 | Thực hiên |
| 6 | So với cùng kỳ (%) | `poultryMeat.yoy` | CSTT132 | YoY % |

### Section 3 — SỐ TRANG TRẠI QUY MÔ VỪA, QUY MÔ LỚN

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 7 | Trang trại lợn | `pigFarm.value` | CSTT134 | Thực hiên |
| 7 | So với cùng kỳ (%) | `pigFarm.yoy` | CSTT134 | YoY % |
| 8 | Trang trại bò | `cattleFarm.value` | CSTT135 | Thực hiên |
| 8 | So với cùng kỳ (%) | `cattleFarm.yoy` | CSTT135 | YoY % |
| 9 | Trang trại gia cầm | `poultryFarm.value` | CSTT136 | Thực hiên |
| 9 | So với cùng kỳ (%) | `poultryFarm.yoy` | CSTT136 | YoY % |

**Tổng Livestock:** 9 mã CSTT × 2 = **18 ô số**.

---

## `/tree-planting-other` — Các loại cây trồng khác

- **Tiêu đề header:** `NÔNG NGHIỆP: CÁC LOẠI CÂY TRỒNG KHÁC`
- **Trạng thái API:** Đã gắn
- **Biểu đồ:** `GrdpColumnLineChart` — cột = Thực hiên, đường = % so kỳ (8 loại cây / chart)

### Section 1 — TỔNG DIỆN TÍCH, SẢN LƯỢNG VÀ NĂNG SUẤT CÂY TRỒNG KHÁC

Thứ tự cột: Ngô → Lạc → Khoai lang → Sắn → Mía → Cây vừng (Mè) → Rau các loại → Đậu các loại.

#### Card 1 — Diện tích gieo trồng (ha) — `display.areaChart`

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Ngô | `areaChart[0]` | CSTT94 | Thực hiên (cột) + YoY % (đường) |
| Lạc | `areaChart[1]` | CSTT95 | Thực hiên + YoY % |
| Khoai lang | `areaChart[2]` | CSTT96 | Thực hiên + YoY % |
| Sắn | `areaChart[3]` | CSTT97 | Thực hiên + YoY % |
| Mía | `areaChart[4]` | CSTT98 | Thực hiên + YoY % |
| Cây vừng (Mè) | `areaChart[5]` | CSTT99 | Thực hiên + YoY % |
| Rau các loại | `areaChart[6]` | CSTT100 | Thực hiên + YoY % |
| Đậu các loại | `areaChart[7]` | CSTT101 | Thực hiên + YoY % |

#### Card 2 — Sản lượng (tấn) — `display.outputChart`

| Nhãn UI | Mã CSTT |
|---------|---------|
| Ngô … Đậu các loại (cùng thứ tự) | CSTT103 … CSTT110 |

#### Card 3 — Năng suất (tạ/ha) — `display.yieldChart`

| Nhãn UI | Mã CSTT |
|---------|---------|
| Ngô … Đậu các loại (cùng thứ tự) | CSTT112 … CSTT119 |

### Section 2 — CHUYỂN ĐỔI CƠ CẤU CÂY TRỒNG

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 4 | Trên đất lúa | `landRice.value` | CSTT121 | Thực hiên |
| 4 | So với kỳ trước (%) | `landRice.yoy` | CSTT121 | YoY % |
| 5 | Trên đất mía | `landSugarcane.value` | CSTT122 | Thực hiên |
| 5 | So với kỳ trước (%) | `landSugarcane.yoy` | CSTT122 | YoY % |
| 6 | Trên đất sắn | `landCassava.value` | CSTT123 | Thực hiên |
| 6 | So với kỳ trước (%) | `landCassava.yoy` | CSTT123 | YoY % |

**Tổng Tree planting:** 24 mã CSTT chart (8×3) + 3 mã CSTT section 2 × 2 = **30 ô số**.

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
