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
          </div>
        </div>
      </Main>
    </>
  )
}
