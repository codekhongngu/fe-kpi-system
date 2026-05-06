import { Main } from '@/components/layout/main'
import { ReportListPage } from './report-list-page'

export function ReportManagementPage() {
  return (
      <Main className='flex flex-1 flex-col gap-5 sm:gap-6'>
        <ReportListPage />
      </Main>
  )
}
