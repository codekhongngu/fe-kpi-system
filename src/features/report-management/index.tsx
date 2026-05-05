import { useLocation } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ReportAnalyticsTab } from './components/report-analytics-tab'
import { ReportAssignmentTab } from './components/report-assignment-tab'
import { ReportEditingTab } from './components/report-editing-tab'
import { ReportsListTab } from './components/reports-list-tab'

export function ReportManagement() {
  const href = useLocation({ select: (location) => location.href })
  const activeTab = useMemo(() => {
    const url = new URL(href, window.location.origin)
    const tab = url.searchParams.get('tab')
    if (tab === 'list' || tab === 'assignment' || tab === 'editing' || tab === 'analytics') {
      return tab
    }
    return 'list'
  }, [href])

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
        {activeTab === 'list' && <ReportsListTab />}
        {activeTab === 'assignment' && <ReportAssignmentTab />}
        {activeTab === 'editing' && <ReportEditingTab />}
        {activeTab === 'analytics' && <ReportAnalyticsTab />}
      </Main>
    </>
  )
}
