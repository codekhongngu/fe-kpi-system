# Hướng dẫn dùng `PageBreadcrumb` (toàn hệ thống)

## 1. Mục tiêu
- Chuẩn hóa phần header cho mọi page nghiệp vụ.
- Thay thế đoạn UI lặp: `title + subtitle + actions`.
- Tách rõ phần điều hướng/thao tác khỏi phần nội dung chính.

## 2. Vị trí component
- `src/components/page-breadcrumb.tsx`

## 3. API
- `title: string`: tiêu đề trang.
- `subtitle?: string`: mô tả ngắn theo ngữ cảnh nghiệp vụ.
- `children?: ReactNode`: nhóm action ở bên phải (`Thêm mới`, `Quay lại`, `Lưu`...).
- `className?: string`: mở rộng style nếu cần.

## 4. Mẫu sử dụng
```tsx
import { Link } from '@tanstack/react-router'
import { PlusCircle } from 'lucide-react'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { Button } from '@/components/ui/button'

export function ExampleListPage() {
  return (
    <PageBreadcrumb
      title='Danh sách biểu mẫu'
      subtitle='Theo dõi biểu mẫu theo lĩnh vực, chu kỳ và trạng thái.'
    >
      <Button asChild>
        <Link to='/form-management/create'>
          <PlusCircle />
          Thêm mới
        </Link>
      </Button>
    </PageBreadcrumb>
  )
}
```

## 5. Quy ước áp dụng
- Trang list: `PageBreadcrumb` + `FilterComponent` + `TableComponent`.
- Trang create/edit/details: luôn có `PageBreadcrumb` với action điều hướng.
- Nội dung hiển thị nghiệp vụ KPI dùng tiếng Việt nhất quán.
