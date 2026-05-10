import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { KtXhHeader } from '../../components/kt-xh-header'
import { 
  TrendingUp,
  Trees,
  Package,
  Fish,
  Ship
} from 'lucide-react'

export function ForestryFisheryPage() {

  return (
    <Main fluid>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top App Bar */}
        <KtXhHeader title="LÂM NGHIỆP - THỦY SẢN" />

        {/* Combined Section: Lâm nghiệp và Thủy sản */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: LÂM NGHIỆP */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[2px] flex-1 bg-orange-200/50"></div>
                <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">LÂM NGHIỆP</h2>
                <div className="h-[2px] flex-1 bg-orange-200/50"></div>
              </div>
              {/* Diện tích trồng rừng và cây phân tán */}
              <Card data-slot="card" className="border-green-700/30 hover:border-green-600/50 transition-all">
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-green-700 uppercase mb-4">Diện tích trồng rừng và cây phân tán</p>
                  <div className="flex items-end justify-between">
                    <Trees className="text-green-700 text-5xl opacity-40" />
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-800 flex items-center justify-end gap-2">
                        1.250
                        <span className="text-green-600">
                          <TrendingUp size={16} />
                        </span>
                      </p>
                      <p className="text-xs text-green-700">ha</p>
                      <p className="text-xs text-green-700">So với cùng kỳ (%): <span className="font-bold">+105,20</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sản lượng gỗ khai thác */}
              <Card data-slot="card" className="border-green-700/30 hover:border-green-600/50 transition-all">
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-green-700 uppercase mb-4">Sản lượng gỗ khai thác (Rừng trồng)</p>
                  <div className="flex items-end justify-between">
                    <Package className="text-green-700 text-5xl opacity-40" />
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-800 flex items-center justify-end gap-2">
                        85.750
                        <span className="text-green-600">
                          <TrendingUp size={16} />
                        </span>
                      </p>
                      <p className="text-xs text-green-700">m³</p>
                      <p className="text-xs text-green-700">So với cùng kỳ (%): <span className="font-bold">+98,50</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: THỦY SẢN */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[2px] flex-1 bg-orange-200/50"></div>
                <h2 className="text-xl font-bold text-blue-700 uppercase tracking-wider px-4">THỦY SẢN</h2>
                <div className="h-[2px] flex-1 bg-orange-200/50"></div>
              </div>
              {/* Thủy sản nuôi trồng */}
              <Card data-slot="card" className="border-blue-600/30 hover:border-blue-500/50 transition-all">
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-4">Sản lượng thủy sản nuôi trồng</p>
                  <div className="flex items-end justify-between">
                    <Fish className="text-blue-700 text-5xl opacity-40" />
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-800 flex items-center justify-end gap-2">
                        2.450
                        <span className="text-blue-600">
                          <TrendingUp size={16} />
                        </span>
                      </p>
                      <p className="text-xs text-blue-700">tấn</p>
                      <p className="text-xs text-blue-700">So với cùng kỳ (%): <span className="font-bold">+112,30</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Thủy sản khai thác */}
              <Card data-slot="card" className="border-blue-600/30 hover:border-blue-500/50 transition-all">
                <CardContent className="p-6">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-4">Sản lượng thủy sản khai thác</p>
                  <div className="flex items-end justify-between">
                    <Ship className="text-blue-700 text-5xl opacity-40" />
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-800 flex items-center justify-end gap-2">
                        3.820
                        <span className="text-blue-600">
                          <TrendingUp size={16} />
                        </span>
                      </p>
                      <p className="text-xs text-blue-700">tấn</p>
                      <p className="text-xs text-blue-700">So với cùng kỳ (%): <span className="font-bold">+95,80</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

      </div>
    </Main>
  )
}
