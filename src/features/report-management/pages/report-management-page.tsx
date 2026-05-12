import { Main } from '@/components/layout/main'
import { ReportListPage } from './report-list-page'

export function ReportManagementPage() {
  return (
    <Main fixed>
      <div className='flex w-full flex-1 overflow-y-auto'>
        <ReportListPage />
      </div>
    </Main>
  )
}
