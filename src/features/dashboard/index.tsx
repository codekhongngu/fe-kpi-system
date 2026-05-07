import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { FileText, CheckCircle2, Clock, RefreshCcw } from 'lucide-react'
import { HubLayout } from './components/hub-layout'
import dashboardBackground from './backgrounds/giaoan.lik-trong-dong.png'

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
            <h2 className='text-xl sm:text-2xl font-extrabold text-primary tracking-tight mb-1.5'>
              QUẢN LÝ DỮ LIỆU ĐIỀU HÀNH NỘI BỘ XÃ TUY PHƯỚC
            </h2>
          </div>

          <div className='flex-1 flex flex-col overflow-hidden'>
            {/* Radial Hub Section */}
            <div className='flex-1 flex items-center justify-center min-h-0 mt-4'>
              <HubLayout />
            </div>

            {/* Quick Metrics Footer */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mt-8'>
              <Card className='bg-card px-3 py-2 rounded-xl shadow-sm border border-border flex flex-row items-center gap-3'>
                <div className='w-8 h-8 bg-primary/5 rounded-full flex items-center justify-center text-primary shrink-0'>
                  <FileText size={16} />
                </div>
                <div className='flex flex-col min-w-0'>
                  <p className='text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5 truncate'>
                    Biểu mẫu
                  </p>
                  <p className='text-lg font-black text-primary leading-none'>128</p>
                </div>
              </Card>
              <Card className='bg-card px-3 py-2 rounded-xl shadow-sm border border-border flex flex-row items-center gap-3'>
                <div className='w-8 h-8 bg-green-500/5 rounded-full flex items-center justify-center text-green-600 shrink-0'>
                  <CheckCircle2 size={16} />
                </div>
                <div className='flex flex-col min-w-0'>
                  <p className='text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5 truncate'>
                    Hoàn thành
                  </p>
                  <p className='text-lg font-black text-green-600 leading-none'>94%</p>
                </div>
              </Card>
              <Card className='bg-card px-3 py-2 rounded-xl shadow-sm border border-border flex flex-row items-center gap-3'>
                <div className='w-8 h-8 bg-orange-500/5 rounded-full flex items-center justify-center text-orange-600 shrink-0'>
                  <Clock size={16} />
                </div>
                <div className='flex flex-col min-w-0'>
                  <p className='text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5 truncate'>
                    Chờ duyệt
                  </p>
                  <p className='text-lg font-black text-orange-600 leading-none'>15</p>
                </div>
              </Card>
              <Card className='bg-card px-3 py-2 rounded-xl shadow-sm border border-border flex flex-row items-center gap-3'>
                <div className='w-8 h-8 bg-blue-500/5 rounded-full flex items-center justify-center text-blue-600 shrink-0'>
                  <RefreshCcw size={16} />
                </div>
                <div className='flex flex-col min-w-0'>
                  <p className='text-[9px] font-bold text-muted-foreground uppercase tracking-tight mb-0.5 truncate'>
                    Đang xử lý
                  </p>
                  <p className='text-lg font-black text-blue-600 leading-none'>42</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
