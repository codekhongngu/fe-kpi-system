import { ChartColumnBig, ClipboardList, FileCheck2, SendToBack } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportAnalyticsTab } from './components/report-analytics-tab'
import { ReportAssignmentTab } from './components/report-assignment-tab'
import { ReportEditingTab } from './components/report-editing-tab'
import { ReportsListTab } from './components/reports-list-tab'

export function ReportManagement() {
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
            <CardTitle className='text-2xl'>Module C - Quản lý báo cáo</CardTitle>
          </CardHeader>
          <CardContent className='text-muted-foreground'>
            Quản lý vòng đời report instance từ giao báo cáo, nhập liệu, duyệt/từ chối tới tổng
            hợp và tra cứu. Dữ liệu hiện tại chạy bằng mock API để phục vụ phát triển UI/logic
            nghiệp vụ.
          </CardContent>
        </Card>

        <Tabs defaultValue='list' className='space-y-4'>
          <div className='w-full overflow-x-auto'>
            <TabsList>
              <TabsTrigger value='list'>
                <ClipboardList />
                Danh sách
              </TabsTrigger>
              <TabsTrigger value='assignment'>
                <SendToBack />
                Giao báo cáo
              </TabsTrigger>
              <TabsTrigger value='editing'>
                <FileCheck2 />
                Nhập liệu & Duyệt
              </TabsTrigger>
              <TabsTrigger value='analytics'>
                <ChartColumnBig />
                Tổng hợp & Tra cứu
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='list'>
            <ReportsListTab />
          </TabsContent>
          <TabsContent value='assignment'>
            <ReportAssignmentTab />
          </TabsContent>
          <TabsContent value='editing'>
            <ReportEditingTab />
          </TabsContent>
          <TabsContent value='analytics'>
            <ReportAnalyticsTab />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
