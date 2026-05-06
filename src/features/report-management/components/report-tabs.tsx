import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ReportTab } from '../api/types'
import { reportTabs } from '../api/types'

type ReportTabsProps = {
  value: ReportTab
  visibleTabs: ReportTab[]
  onValueChange: (tab: ReportTab) => void
}

export function ReportTabs({ value, visibleTabs, onValueChange }: ReportTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onValueChange(next as ReportTab)}>
      <TabsList className='h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1'>
        {reportTabs
          .filter((tab) => visibleTabs.includes(tab.value))
          .map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className='data-[state=active]:bg-background'
            >
              {tab.label}
            </TabsTrigger>
          ))}
      </TabsList>
    </Tabs>
  )
}
