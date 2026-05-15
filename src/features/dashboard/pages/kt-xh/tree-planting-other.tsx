import {
  Sprout,
  Trees,
  Leaf,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { KtXhHeader } from '../../components/kt-xh-header'

export function TreePlantingOtherPage() {
  return (
    <Main fluid>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <KtXhHeader title="NÔNG NGHIỆP: CÁC LOẠI CÂY TRỒNG KHÁC" />

        {/* Section 2: Column charts */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
            <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">
              TỔNG DIỆN TÍCH, SẢN LƯỢNG VÀ NĂNG SUẤT CÂY TRỒNG KHÁC
            </h2>
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-orange-600 border-orange-200/50 overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-orange-800 mb-4">Diện tích gieo trồng (ha)</h3>
                <div className="space-y-4">
                  <div className="h-64 relative">
                    <div className="absolute inset-0 flex items-end justify-between px-2 pb-8">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-orange-500 rounded-t" style={{ height: '85%' }}></div>
                        <p className="text-xs text-orange-700 font-bold mt-2">Lạc</p>
                        <p className="text-xs text-gray-600">8.521</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-orange-400 rounded-t" style={{ height: '80%' }}></div>
                        <p className="text-xs text-orange-700 font-bold mt-2">Sắn</p>
                        <p className="text-xs text-gray-600">8.062</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-orange-300 rounded-t" style={{ height: '57%' }}></div>
                        <p className="text-xs text-orange-700 font-bold mt-2">Rau</p>
                        <p className="text-xs text-gray-600">5.697</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-orange-200 rounded-t" style={{ height: '23%' }}></div>
                        <p className="text-xs text-orange-700 font-bold mt-2">Ngô</p>
                        <p className="text-xs text-gray-600">2.319</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-orange-200 rounded-t" style={{ height: '11%' }} />
                        <p className="text-xs text-orange-700 font-bold mt-2">Đậu</p>
                        <p className="text-xs text-gray-600">1.150</p>
                      </div>
                    </div>
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                      <span>10.000</span>
                      <span>7.500</span>
                      <span>5.000</span>
                      <span>2.500</span>
                      <span>0</span>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-between">
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-600 border-orange-200/50 overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-yellow-800 mb-4">Sản lượng (tấn)</h3>
                <div className="space-y-4">
                  <div className="h-64 relative">
                    <div className="absolute inset-0 flex items-end justify-between px-2 pb-8">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-yellow-500 rounded-t" style={{ height: '100%' }}></div>
                        <p className="text-xs text-yellow-700 font-bold mt-2">Sắn</p>
                        <p className="text-xs text-gray-600">225.443</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-yellow-400 rounded-t" style={{ height: '49%' }} />
                        <p className="text-xs text-yellow-700 font-bold mt-2">Rau</p>
                        <p className="text-xs text-gray-600">111.390</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-yellow-300 rounded-t" style={{ height: '15%' }}></div>
                        <p className="text-xs text-yellow-700 font-bold mt-2">Lạc</p>
                        <p className="text-xs text-gray-600">33.430</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-yellow-200 rounded-t" style={{ height: '3%' }}></div>
                        <p className="text-xs text-yellow-700 font-bold mt-2">Ngô</p>
                        <p className="text-xs text-gray-600">7.695</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-yellow-200 rounded-t" style={{ height: '1%' }}></div>
                        <p className="text-xs text-yellow-700 font-bold mt-2">Mía</p>
                        <p className="text-xs text-gray-600">2.090</p>
                      </div>
                    </div>
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                      <span>250.000</span>
                      <span>187.500</span>
                      <span>125.000</span>
                      <span>62.500</span>
                      <span>0</span>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-between">
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 border-orange-200/50 overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-green-800 mb-4">Năng suất (tạ/ha)</h3>
                <div className="space-y-4">
                  <div className="h-64 relative">
                    <div className="absolute inset-0 flex items-end justify-between px-2 pb-8">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-green-500 rounded-t" style={{ height: '100%' }}></div>
                        <p className="text-xs text-green-700 font-bold mt-2">Mía</p>
                        <p className="text-xs text-gray-600">546</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-green-400 rounded-t" style={{ height: '51%' }} />
                        <p className="text-xs text-green-700 font-bold mt-2">Sắn</p>
                        <p className="text-xs text-gray-600">280</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-green-300 rounded-t" style={{ height: '36%' }} />
                        <p className="text-xs text-green-700 font-bold mt-2">Rau</p>
                        <p className="text-xs text-gray-600">196</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-green-200 rounded-t" style={{ height: '12%' }}></div>
                        <p className="text-xs text-green-700 font-bold mt-2">Ngô</p>
                        <p className="text-xs text-gray-600">66</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full bg-green-200 rounded-t" style={{ height: '12%' }}></div>
                        <p className="text-xs text-green-700 font-bold mt-2">Khoai</p>
                        <p className="text-xs text-gray-600">63</p>
                      </div>
                    </div>
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                      <span>600</span>
                      <span>450</span>
                      <span>300</span>
                      <span>150</span>
                      <span>0</span>
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-between">
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                      <div className="border-b border-gray-200"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 3: Land use conversion */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
            <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">
              CHUYỂN ĐỔI CƠ CẤU CÂY TRỒNG
            </h2>
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Sprout className="text-4xl" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                    Trên đất lúa
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">0,0</p>
                  <p className="mt-1 text-xs text-gray-600">
                    So với kỳ trước (%): <span className="font-bold">0,0</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <Trees className="text-4xl" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                    Trên đất mía
                  </h4>
                  <p className="text-2xl font-bold text-green-600">0,0</p>
                  <p className="mt-1 text-xs text-gray-600">
                    So với kỳ trước (%): <span className="font-bold">0,0</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                  <Leaf className="text-4xl" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                    Trên đất sắn
                  </h4>
                  <p className="text-2xl font-bold text-yellow-600">0,0</p>
                  <p className="mt-1 text-xs text-gray-600">
                    So với kỳ trước (%): <span className="font-bold">0,0</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </Main>
  )
}
