import { FilePenLine, ListFilter, SlidersHorizontal } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TemplateStructureTab } from './components/template-structure-tab'
import { TemplatesLifecycleTab } from './components/templates-lifecycle-tab'
import { TemplatesListTab } from './components/templates-list-tab'

export function FormManagement() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>Module B - Quản lí biểu mẫu</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground'>
            Tập trung quản lý danh sách biểu mẫu, vòng đời thêm/sửa/xóa và cấu trúc
            thuộc tính/chỉ tiêu. Dữ liệu hiện tại chạy bằng mock API để phục vụ phát triển
            UI/logic nghiệp vụ.
          </CardContent>
        </Card>

        <Tabs defaultValue='list' className='space-y-4'>
          <div className='w-full overflow-x-auto'>
            <TabsList>
              <TabsTrigger value='list'>
                <ListFilter />
                Danh sách biểu mẫu
              </TabsTrigger>
              <TabsTrigger value='lifecycle'>
                <FilePenLine />
                Thêm/Sửa/Xóa
              </TabsTrigger>
              <TabsTrigger value='structure'>
                <SlidersHorizontal />
                Thuộc tính & chỉ tiêu
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='list'>
            <TemplatesListTab />
          </TabsContent>
          <TabsContent value='lifecycle'>
            <TemplatesLifecycleTab />
          </TabsContent>
          <TabsContent value='structure'>
            <TemplateStructureTab />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
