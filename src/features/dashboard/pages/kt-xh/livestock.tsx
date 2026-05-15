import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { KtXhHeader } from '../../components/kt-xh-header'
import { 
  TrendingUp, 
  Bird,
  Circle,
  Beef,
  Egg,
  Droplet,
  ShoppingCart
} from 'lucide-react'

export function LivestockPage() {

  return (
    <Main fluid>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top App Bar */}
        <KtXhHeader title="CHĂN NUÔI" />

        {/* Section 1: Tổng đàn vật nuôi */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
            <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">SỐ LƯỢNG GIA SÚC, GIA CẦM TRONG CHĂN NUÔI</h2>
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Tổng đàn Bò */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-orange-600 uppercase mb-4">TỔNG ĐÀN BÒ</p>
                <div className="flex items-end justify-between">
                  <Beef className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      0 
                      <span className="text-gray-400">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): 0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tổng đàn Lợn */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-orange-600 uppercase mb-4">TỔNG ĐÀN LỢN</p>
                <div className="flex items-end justify-between">
                  <Circle className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      0 
                      <span className="text-gray-400">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): 0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tổng đàn Gia cầm */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-orange-600 uppercase mb-4">TỔNG ĐÀN GIA CẤM</p>
                <div className="flex items-end justify-between">
                  <Bird className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      0,0 
                      <span className="text-gray-400">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">nghìn con</p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): 0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </section>

        {/* Section 2: Sản lượng chăn nuôi */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
            <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">SẢN LƯỢNG CHĂN NUÔI</h2>
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Thịt lợn hơi */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-end justify-between">
                  <Circle className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      35.065
                      <span className="text-green-600">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">tấn</p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): <span className="font-bold">+107,70</span></p>
                  </div>
                </div>
                <p className="text-xs font-bold text-orange-600 uppercase mt-4">Thịt lợn hơi</p>
              </CardContent>
            </Card>

            {/* Thịt trâu hơi */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-end justify-between">
                  <ShoppingCart className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      382
                      <span className="text-red-600">
                        <TrendingUp size={16} className="transform rotate-180" />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">tấn</p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): <span className="font-bold">91,00</span></p>
                  </div>
                </div>
                <p className="text-xs font-bold text-orange-600 uppercase mt-4">Thịt trâu hơi</p>
              </CardContent>
            </Card>

            {/* Thịt bò hơi */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-end justify-between">
                  <Beef className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      10.602
                      <span className="text-gray-400">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">tấn</p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): <span className="font-bold">0,00</span></p>
                  </div>
                </div>
                <p className="text-xs font-bold text-orange-600 uppercase mt-4">Thịt bò hơi</p>
              </CardContent>
            </Card>
            </div>
          </section>


          
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
            <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">SỐ TRANG TRẠI QUY MÔ VỪA, QUY MÔ LỚN</h2>
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Thịt gia cầm */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-end justify-between">
                  <Bird className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      7.797
                      <span className="text-green-600">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">tấn</p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): <span className="font-bold">+106,80</span></p>
                  </div>
                </div>
                <p className="text-xs font-bold text-orange-600 uppercase mt-4">Thịt gia cầm</p>
              </CardContent>
            </Card>

            {/* Trứng */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-end justify-between">
                  <Egg className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      144.579,5
                      <span className="text-green-600">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">nghìn quả</p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): <span className="font-bold">+106,80</span></p>
                  </div>
                </div>
                <p className="text-xs font-bold text-orange-600 uppercase mt-4">Trứng</p>
              </CardContent>
            </Card>

            {/* Sữa */}
            <Card data-slot="card" className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <div className="flex items-end justify-between">
                  <Droplet className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      3.164,4
                      <span className="text-green-600">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">tấn</p>
                    <p className="text-xs text-orange-600">So với cùng kỳ (%): <span className="font-bold">+106,80</span></p>
                  </div>
                </div>
                <p className="text-xs font-bold text-orange-600 uppercase mt-4">Sữa</p>
              </CardContent>
            </Card>
          </div>
        </section>

      </div>
    </Main>
  )
}
