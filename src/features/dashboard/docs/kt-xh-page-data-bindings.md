# KT-XH Dashboard — Mapping Page / Card / Biến

Tài liệu tham chiếu khi chỉnh sửa gắn dữ liệu API (`cells`) lên UI dashboard KT-XH.

**Cập nhật:** theo codebase `fe-kpi-system` (GRDP, Agriculture, Trade-Service đã gắn API).

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
| Lâm nghiệp, Thủy sản | `/forestry-fishery` | `use-forestry-fishery-display-values.ts` | `pages/kt-xh/forestry-fishery.tsx` |
| Thương mại - Dịch vụ | `/trade-service` | `use-trade-service-display-values.ts` | `pages/kt-xh/trade-service.tsx` |
| Chăn nuôi, Lâm nghiệp, Thủy sản | `/livestock-forestry-fishery` | `use-livestock-display-values.ts` + `use-forestry-fishery-display-values.ts` | `pages/kt-xh/livestock.tsx` |

### Mã lĩnh vực Hub (BE)

| Route | `fieldCategory.code` |
|-------|----------------------|
| `/grdp` | `kinh_te` |
| `/agriculture` | `nong_nghiep` |
| `/livestock` | `chan_nuoi` |
| `/forestry-fishery` | `lam_nghiep_thuy_san` |
| `/tree-planting-other` | `trong_trot_khac` |
| `/trade-service` | `thuong_mai_dich_vu` |

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
| Số chính | `section1Area.value` | CSTT74 | Thực hiên |
| So với kỳ trước (%) | `section1Area.yoy` | CSTT74 | YoY % |

#### Card 2 — Sản lượng

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| SẢN LƯỢNG (tấn) | — | — | Nhãn tĩnh |
| Số chính | `section1Output.value` | CSTT77 | Thực hiên |
| So với kỳ trước (%) | `section1Output.yoy` | CSTT77 | YoY % |

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
| Diện tích (ha) | `dongXuanArea` | CSTT79 |
| Sản lượng (tấn) | `dongXuanOutput` | CSTT82 |
| Năng suất (tạ/ha) | `dongXuanYield` | CSTT81 |

#### Card 5 — LÚA VỤ HÈ THU

| Nhãn UI | Biến | Mã CSTT |
|---------|------|---------|
| LÚA VỤ HÈ THU | — | — |
| Diện tích (ha) | `heThuArea` | CSTT84 |
| Sản lượng (tấn) | `heThuOutput` | CSTT87 |
| Năng suất (tạ/ha) | `heThuYield` | CSTT86 |

#### Card 6 — LÚA VỤ MÙA

| Nhãn UI | Biến | Mã CSTT |
|---------|------|---------|
| LÚA VỤ MÙA | — | — |
| Diện tích (ha) | `muaArea` | CSTT89 |
| Sản lượng (tấn) | `muaOutput` | CSTT91 |
| Năng suất (tạ/ha) | `muaYield` | CSTT91 |

**Tổng Agriculture:** 12 mã CSTT × 2 (value + yoy) = **24 ô số**.

---

## `/livestock` — CHĂN NUÔI

- **Tiêu đề header:** `CHĂN NUÔI`
- **Trạng thái API:** Đã gắn

### Section 1 — SỐ LƯỢNG GIA SÚC, GIA CẦM TRONG CHĂN NUÔI

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 1 | TỔNG ĐÀN BÒ | `herdCattle.value` | CSTT117 | Thực hiên |
| 1 | So với cùng kỳ (%) | `herdCattle.yoy` | CSTT117 | YoY % |
| 2 | TỔNG ĐÀN LỢN | `herdPig.value` | CSTT116 | Thực hiên |
| 2 | So với cùng kỳ (%) | `herdPig.yoy` | CSTT116 | YoY % |
| 3 | TỔNG ĐÀN GIA CẦM | `herdPoultry.value` | CSTT118 | Thực hiên |
| 3 | So với cùng kỳ (%) | `herdPoultry.yoy` | CSTT118 | YoY % |

### Section 2 — SẢN LƯỢNG CHĂN NUÔI

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 4 | Thịt bò hơi | `beefMeat.value` | CSTT121 | Thực hiên |
| 4 | So với cùng kỳ (%) | `beefMeat.yoy` | CSTT121 | YoY % |
| 5 | Thịt lợn hơi | `porkMeat.value` | CSTT120 | Thực hiên |
| 5 | So với cùng kỳ (%) | `porkMeat.yoy` | CSTT120 | YoY % |
| 6 | Gia cầm | `poultryMeat.value` | CSTT122 | Thực hiên |
| 6 | So với cùng kỳ (%) | `poultryMeat.yoy` | CSTT122 | YoY % |

### Section 3 — SỐ TRANG TRẠI QUY MÔ VỪA, QUY MÔ LỚN

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 7 | Trang trại lợn | `pigFarm.value` | CSTT124 | Thực hiên |
| 7 | So với cùng kỳ (%) | `pigFarm.yoy` | CSTT124 | YoY % |
| 8 | Trang trại bò | `cattleFarm.value` | CSTT125 | Thực hiên |
| 8 | So với cùng kỳ (%) | `cattleFarm.yoy` | CSTT125 | YoY % |
| 9 | Trang trại gia cầm | `poultryFarm.value` | CSTT126 | Thực hiên |
| 9 | So với cùng kỳ (%) | `poultryFarm.yoy` | CSTT126 | YoY % |

**Tổng Livestock:** 9 mã CSTT × 2 = **18 ô số**.

---

## `/tree-planting-other` — Các loại cây trồng khác

- **Tiêu đề header:** `NÔNG NGHIỆP: CÁC LOẠI CÂY TRỒNG KHÁC`
- **Trạng thái API:** Đã gắn
- **Biểu đồ:** `GrdpColumnLineChart` — cột = Thực hiên, đường = % so kỳ (8 loại cây / chart)

### Section 1 — TỔNG DIỆN TÍCH, SẢN LƯỢNG VÀ NĂNG SUẤT CÂY TRỒNG KHÁC

Thứ tự cột: Ngô → Lạc → Rau các loại → Đậu các loại.

#### Card 1 — Diện tích gieo trồng (ha) — `display.areaChart`

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Ngô | `areaChart[0]` | CSTT95 | Thực hiên (cột) + YoY % (đường) |
| Lạc | `areaChart[1]` | CSTT105 | Thực hiên + YoY % |
| Rau các loại | `areaChart[6]` | CSTT110 | Thực hiên + YoY % |
| Đậu các loại | `areaChart[7]` | CSTT100 | Thực hiên + YoY % |

#### Card 2 — Sản lượng (tấn) — `display.outputChart`

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Ngô | `outputChart[0]` | CSTT98 | Thực hiên (cột) + YoY % (đường) |
| Lạc | `outputChart[1]` | CSTT108 | Thực hiên + YoY % |
| Rau các loại | `outputChart[6]` | CSTT113 | Thực hiên + YoY % |
| Đậu các loại | `outputChart[7]` | CSTT103 | Thực hiên + YoY % |

#### Card 3 — Năng suất (tạ/ha) — `display.yieldChart`

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Ngô | `yieldChart[0]` | CSTT97 | Thực hiên (cột) + YoY % (đường) |
| Lạc | `yieldChart[1]` | CSTT107 | Thực hiên + YoY % |
| Rau các loại | `yieldChart[6]` | CSTT112 | Thực hiên + YoY % |
| Đậu các loại | `yieldChart[7]` | CSTT102 | Thực hiên + YoY % |

### Section 2 — CHUYỂN ĐỔI CƠ CẤU CÂY TRỒNG

| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 4 | Trên đất lúa | `landRice.value` |  | Thực hiên |
| 4 | So với kỳ trước (%) | `landRice.yoy` |  | YoY % |
| 5 | Trên đất mía | `landSugarcane.value` |  | Thực hiên |
| 5 | So với kỳ trước (%) | `landSugarcane.yoy` |  | YoY % |
| 6 | Trên đất sắn | `landCassava.value` |  | Thực hiên |
| 6 | So với kỳ trước (%) | `landCassava.yoy` |  | YoY % |

**Tổng Tree planting:** 24 mã CSTT chart (8×3) + 3 mã CSTT section 2 × 2 = **30 ô số**.

---

## `/forestry-fishery` — Lâm nghiệp, Thủy sản

- **Trạng thái API:** Đã gắn

### LÂM NGHIỆP
| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 1 | Diện tích trồng rừng và cây phân tán | `forestArea.value` | CSTT130 | Thực hiên + YoY % |
| 2 | Sản lượng gỗ khai thác (Rừng trồng)  | `timberOutput.value` | CSTT131 | Thực hiên + YoY % |


### THỦY SẢN
| Card | Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|------|---------|------|---------|---------------------|
| 1 | Sản lượng thủy sản nuôi trồng | `aquacultureOutput.value` | CSTT133 | Thực hiên + YoY % |
| 2 | Sản lượng thủy sản khai thác | `fisheryCatch.value` | CSTT134 | Thực hiên + YoY % |

---

## `/trade-service` — THƯƠNG MẠI - DỊCH VỤ

- **Tiêu đề header:** `THƯƠNG MẠI - DỊCH VỤ`
- **Route:** `/trade-service`
- **Lĩnh vực Hub:** `thuong_mai_dich_vu` (`legacy-field-routes.ts`)
- **Trạng thái API:** Đã gắn (fallback mock khi chưa có data / thiếu So CK)
- **Hook:** `use-trade-service-display-values.ts`
- **Page:** `trade-service.tsx`

### Cấu trúc layout (3 tầng)

| Tầng | Khối UI | Component |
|------|---------|-----------|
| 1 | 2 KPI vĩ mô (50% - 50%) | `CompactKpiCard` |
| 2 | Hero tổng giá trị (full width) | `HeroTotalSection` |
| 3 | Chi tiết từng ngành (trái) + Tỷ trọng ngành (phải) | `SectorLedgerRow` + `SectorDonutChart` |

### Chỉ mục hiển thị (theo nghiệp vụ)

| Chỉ mục | Khối |
|---------|------|
| 1 | Kim ngạch xuất khẩu |
| 2 | Thương mại dịch vụ (tổng giá trị) |
| 2.1 | Bán buôn và bán lẻ; sửa chữa ô tô, mô tô, xe máy |
| 2.2 | Vận tải kho bãi |
| 2.3 | Dịch vụ lưu trú và ăn uống |
| 2.4 | Dịch vụ khác |
| 3 | Doanh thu bán lẻ hàng hóa và dịch vụ |

---

### Tầng 1 — KPI vĩ mô

#### Card 1 — Kim ngạch xuất khẩu (`CompactKpiCard`, chỉ mục `1`)

| Nhãn UI | Biến (`display.*`) | Mã CSTT | Attribute / Ghi chú |
|---------|-------------------|---------|---------------------|
| Giá trị thực hiện | `exportRevenue.value` | CSTT36 | Thực hiên |
| So CK | `exportRevenue.yoy` | CSTT36 | Thực hiên vs Cùng kỳ năm trước → % |
| Đơn vị (UI) | — | — | `USD` (hardcode trên page) |

#### Card 3 — Doanh thu bán lẻ hàng hóa và dịch vụ (`CompactKpiCard`, chỉ mục `3`)

| Nhãn UI | Biến (`display.*`) | Mã CSTT | Attribute / Ghi chú |
|---------|-------------------|---------|---------------------|
| Giá trị thực hiện | `retailRevenue.value` | CSTT42 | Thực hiên |
| So CK | `retailRevenue.yoy` | CSTT42 | YoY % |
| Đơn vị (UI) | — | — | `Tỷ đồng` (hardcode trên page) |

---

### Tầng 2 — Thương mại dịch vụ (Hero, chỉ mục `2`)

| Nhãn UI | Biến (`display.*`) | Mã CSTT | Attribute / Ghi chú |
|---------|-------------------|---------|---------------------|
| Tổng giá trị (Triệu đồng) | `totalValue.value` | — | **Tính toán:** tổng `sectors[].metric.value` (CSTT38–41) |
| So CK (badge) | `totalValue.yoy` | CSTT37 | YoY % |
| % so với kỳ trước (badge) | `totalValue.yoy` | CSTT37 | Hiển thị cùng biến So CK |
| Số ngành con đóng góp (badge) | `stats.sectorCount` | — | `sectors.length` (mặc định 4) |
| Ngành tỷ trọng lớn nhất (badge) | `topSectorName` | — | Ngành có `metric.value` cao nhất |

---

### Tầng 3 — Chi tiết từng ngành (cột trái)

Danh sách `display.sectorDetails` — thứ tự cố định theo chỉ mục 2.1 → 2.4; `rank` (#1, #2…) tính theo giá trị giảm dần.

Mỗi dòng (`SectorLedgerRow`): `.metric.value` = Thực hiện, `.metric.yoy` = So CK, `.sharePercent` = % đóng góp trong tổng ngành.

#### Card 2.1 — Bán buôn và bán lẻ; sửa chữa ô tô, mô tô, xe máy

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Chỉ mục | `sectorDetails[].index` | — | `2.1` (cố định) |
| Tên ngành | `sectorDetails[].label` | — | Từ `SECTOR_DEFINITIONS` |
| Giá trị thực hiện | `sectorDetails[].metric.value` | CSTT38 | Thực hiên |
| So CK | `sectorDetails[].metric.yoy` | CSTT38 | YoY % |
| % đóng góp (donut / nội bộ) | `sectorDetails[].sharePercent` | — | Tính từ tổng 4 ngành |
| Xếp hạng (#) | `sectorDetails[].rank` | — | Theo giá trị |

#### Card 2.2 — Vận tải kho bãi

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Chỉ mục | `sectorDetails[].index` | — | `2.2` |
| Giá trị thực hiện | `sectorDetails[].metric.value` | CSTT39 | Thực hiên |
| So CK | `sectorDetails[].metric.yoy` | CSTT39 | YoY % |

#### Card 2.3 — Dịch vụ lưu trú và ăn uống

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Chỉ mục | `sectorDetails[].index` | — | `2.3` |
| Giá trị thực hiện | `sectorDetails[].metric.value` | CSTT40 | Thực hiên |
| So CK | `sectorDetails[].metric.yoy` | CSTT40 | YoY % |

#### Card 2.4 — Dịch vụ khác

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Chỉ mục | `sectorDetails[].index` | — | `2.4` |
| Giá trị thực hiện | `sectorDetails[].metric.value` | CSTT41 | Thực hiên |
| So CK | `sectorDetails[].metric.yoy` | CSTT41 | YoY % |

---

### Tầng 3 — Tỷ trọng ngành (cột phải)

**Biểu đồ:** `SectorDonutChart` (Recharts `PieChart` donut).

| Nhãn UI | Biến | Mã CSTT | Attribute / Ghi chú |
|---------|------|---------|---------------------|
| Tên ngành (legend) | `sectorDetails[].label` | CSTT38–41 | — |
| Giá trị (cột donut) | `sectorDetails[].metric.value` | CSTT38–41 | Thực hiên |
| % tỷ trọng (legend) | `sectorDetails[].sharePercent` | — | Tính toán |

---

### Công thức So CK (áp dụng mọi khối có `.yoy`)

| Bước | Nguồn | Ghi chú |
|------|-------|---------|
| Giá trị thực hiện | `Thực hiện` (`DASHBOARD_ATTR_CURRENT`) | Cùng mã CSTT với số hiển thị |
| Cùng kỳ năm trước | `Cùng kỳ năm trước` (`DASHBOARD_ATTR_PRIOR_YEAR`) | Cùng mã CSTT |
| So CK hiển thị | `(Thực hiện / Cùng kỳ năm trước) × 100` | `formatYoY` → `formatDashboardYoYPercent` trong `use-trade-service-display-values.ts` |

Ví dụ: Thực hiện = 110, Cùng kỳ = 100 → So CK = `110,0%` (hiển thị dạng % theo chuẩn dashboard KT-XH).

Nếu thiếu `Cùng kỳ năm trước` hoặc prior = 0 → hook trả fallback (xem bảng mock bên dưới).

### Mock / fallback So CK (`MOCK_YOY_BY_CODE`)

**Chỉ dùng khi API chưa có `Cùng kỳ năm trước`** (`withMockYoY` gán % mẫu thay cho So CK tính toán):

| Mã CSTT | So CK fallback (dev) |
|---------|----------------------|
| CSTT36 | +12,5% |
| CSTT42 | +8,2% |
| CSTT37 | +5,8% |
| CSTT38 | +15,3% |
| CSTT39 | +6,8% |
| CSTT40 | -2,1% |
| CSTT41 | +4,2% |

**Tổng Trade-Service:** 7 mã CSTT có binding trực tiếp (CSTT36, CSTT37, CSTT42, CSTT38–41) × 2 (value + yoy) = **14 ô số**; tổng khối 2 value tính từ 4 ngành.

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
