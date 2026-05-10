import { useState } from 'react'
import { Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { AssignmentCard } from '../components/assignment-card'
import { useMyAssignments } from '../hooks/use-my-assignments'

export function MyAssignmentsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const statusParam = activeTab === 'all' ? undefined : activeTab
  const overdueParam = activeTab === 'overdue' ? true : undefined

  const { data: assignments, isLoading } = useMyAssignments({
    status: activeTab === 'overdue' ? undefined : statusParam,
    overdue: overdueParam,
  })

  const filteredAssignments = assignments?.filter(
    (a) =>
      a.form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.form.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <PageBreadcrumb
          title='Danh sách giao việc'
          subtitle='Quản lý và thực hiện các báo cáo được giao'
        />
      </div>

      <Card>
        <CardContent className='space-y-4 p-4'>
          <div className='flex flex-col justify-between gap-4 sm:flex-row'>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full sm:w-auto'
            >
              <TabsList className='grid grid-cols-3 sm:grid-cols-6 lg:w-[600px]'>
                <TabsTrigger value='all'>Tất cả</TabsTrigger>
                <TabsTrigger value='UNOPENED'>Chưa mở</TabsTrigger>
                <TabsTrigger value='DRAFT'>Chưa nộp</TabsTrigger>
                <TabsTrigger value='PENDING'>Chờ duyệt</TabsTrigger>
                <TabsTrigger value='APPROVED'>Đã duyệt</TabsTrigger>
                <TabsTrigger value='overdue'>Quá hạn</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className='relative w-full sm:w-[300px]'>
              <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Tìm kiếm báo cáo...'
                className='pl-8'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className='py-12 text-center text-muted-foreground'>
              Đang tải dữ liệu...
            </div>
          ) : filteredAssignments && filteredAssignments.length > 0 ? (
            <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.assignmentId}
                  assignment={assignment}
                />
              ))}
            </div>
          ) : (
            <div className='py-12 text-center text-muted-foreground'>
              Không có báo cáo nào phù hợp.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
