import { FileText, CheckCircle2, Clock, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import dashboardBackground from './backgrounds/giaoan.lik-trong-dong.png'
import { HubLayout } from './components/hub-layout'

export function Dashboard() {
  return (
    <>
      {/* ===== Main ===== */}
      <Main fixed className='relative overflow-hidden p-0'>
        <div
          className='pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: `url(${dashboardBackground})` }}
        />
        <div className='pointer-events-none absolute inset-0 bg-background/[0.85]' />

        <div className='relative z-10 flex h-full flex-col px-6 py-[10px] sm:px-8 sm:py-[10px]'>
          {/* Page Header */}
          <div className='mb-3 text-center'>
            <h2 className='mb-1.5 text-xl font-extrabold tracking-tight text-primary sm:text-2xl'>
              QUẢN LÝ DỮ LIỆU ĐIỀU HÀNH NỘI BỘ XÃ TUY PHƯỚC
            </h2>
          </div>

          <div className='flex flex-1 flex-col overflow-hidden'>
            {/* Radial Hub Section */}
            <div className='mt-4 flex min-h-0 flex-1 items-center justify-center'>
              <HubLayout />
            </div>

            {/* Quick Metrics Footer */}
            <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-4'>
              <Card className='flex flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary'>
                  <FileText size={16} />
                </div>
                <div className='flex min-w-0 flex-col'>
                  <p className='mb-0.5 truncate text-[9px] font-bold tracking-tight text-muted-foreground uppercase'>
                    Biểu mẫu
                  </p>
                  <p className='text-lg leading-none font-black text-primary'>
                    128
                  </p>
                </div>
              </Card>
              <Card className='flex flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/5 text-green-600'>
                  <CheckCircle2 size={16} />
                </div>
                <div className='flex min-w-0 flex-col'>
                  <p className='mb-0.5 truncate text-[9px] font-bold tracking-tight text-muted-foreground uppercase'>
                    Hoàn thành
                  </p>
                  <p className='text-lg leading-none font-black text-green-600'>
                    94%
                  </p>
                </div>
              </Card>
              <Card className='flex flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/5 text-orange-600'>
                  <Clock size={16} />
                </div>
                <div className='flex min-w-0 flex-col'>
                  <p className='mb-0.5 truncate text-[9px] font-bold tracking-tight text-muted-foreground uppercase'>
                    Chờ duyệt
                  </p>
                  <p className='text-lg leading-none font-black text-orange-600'>
                    15
                  </p>
                </div>
              </Card>
              <Card className='flex flex-row items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm'>
                <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/5 text-blue-600'>
                  <RefreshCcw size={16} />
                </div>
                <div className='flex min-w-0 flex-col'>
                  <p className='mb-0.5 truncate text-[9px] font-bold tracking-tight text-muted-foreground uppercase'>
                    Đang xử lý
                  </p>
                  <p className='text-lg leading-none font-black text-blue-600'>
                    42
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
