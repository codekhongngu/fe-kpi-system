import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { KtXhHeader } from '../../components/kt-xh-header'

export function GrdpPage() {

  return (
    <Main fluid>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top App Bar */}
        <KtXhHeader title="GRDP" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* Card 1: Tổng sản phẩm trên địa bàn theo giá so sánh */}
                <Card className="h-full w-full min-w-0 border-l-4 border-l-red-600 border-r border-orange-200/50 border-b border-orange-200/50 overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-red-800 mb-4">Tổng sản phẩm trên địa bàn theo giá so sánh</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-orange-200/20 pb-2">
                        <div>
                          <span className="text-2xl font-bold text-red-800">27.696.355,8</span>
                          <span className="text-xs text-gray-500 italic ml-2">(Triệu đồng)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-600 uppercase block">So với cùng kỳ:</span>
                          <span className="text-xl font-bold text-red-800">107,2%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                        <div className="flex min-w-0 flex-col gap-4 justify-center sm:shrink-0 sm:basis-[42%]">
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Tổng giá trị tăng thêm</p>
                            <p className="text-lg font-bold text-red-800">26.518.811</p>
                            <p className="text-xs text-green-600 font-bold">107,3%</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Thuế SP trừ trợ cấp</p>
                            <p className="text-lg font-bold text-red-800">1.177.544,97</p>
                            <p className="text-xs text-green-600 font-bold">105,2%</p>
                          </div>
                        </div>
                        {/* Mini Chart */}
                        <div className="relative h-28 min-h-0 flex-1 bg-gray-50 rounded-lg border border-gray-200/20 sm:min-h-24">
                        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-around">
                          <div className="w-4 bg-red-600 h-[90%] rounded-t-sm"></div>
                          <div className="w-4 bg-red-600 h-[70%] rounded-t-sm"></div>
                          <div className="w-4 bg-red-600 h-[60%] rounded-t-sm"></div>
                        </div>
                        <div className="absolute bottom-0 left-2 right-2 flex justify-around text-[6px] font-bold text-gray-600">
                          <span>KV III</span>
                          <span>KV II</span>
                          <span>KV I</span>
                        </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2: Tổng sản phẩm trên địa bàn theo giá hiện hành */}
                <Card className="h-full w-full min-w-0 border-l-4 border-l-orange-600 border-r border-orange-200/50 border-b border-orange-200/50 overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-orange-800 mb-4">Tổng sản phẩm trên địa bàn theo giá hiện hành</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-orange-200/20 pb-2">
                        <div>
                          <span className="text-2xl font-bold text-orange-800">54.422.794,3</span>
                          <span className="text-xs text-gray-500 italic ml-2">(Triệu đồng)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-600 uppercase block">So với cùng kỳ:</span>
                          <span className="text-xl font-bold text-orange-800">111,5%</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                        <div className="flex min-w-0 flex-col gap-4 justify-center sm:shrink-0 sm:basis-[42%]">
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Tổng giá trị tăng thêm</p>
                            <p className="text-lg font-bold text-orange-800">52.126.319</p>
                            <p className="text-xs text-orange-600 font-bold">111,6%</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Thuế SP trừ trợ cấp</p>
                            <p className="text-lg font-bold text-orange-800">2.296.475,48</p>
                            <p className="text-xs text-orange-600 font-bold">109,2%</p>
                          </div>
                        </div>
                        {/* Mini Chart */}
                        <div className="relative h-28 min-h-0 flex-1 bg-gray-50 rounded-lg border border-gray-200/20 sm:min-h-24">
                        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-around">
                          <div className="w-4 bg-orange-600 h-[95%] rounded-t-sm"></div>
                          <div className="w-4 bg-orange-600 h-[75%] rounded-t-sm"></div>
                          <div className="w-4 bg-orange-600 h-[70%] rounded-t-sm"></div>
                        </div>
                        <div className="absolute bottom-0 left-2 right-2 flex justify-around text-[6px] font-bold text-gray-600">
                          <span>KV III</span>
                          <span>KV II</span>
                          <span>KV I</span>
                        </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Tốc độ tăng GRDP */}
                <Card className="h-full w-full min-w-0 border-l-4 border-l-green-600 border-r border-orange-200/50 border-b border-orange-200/50 overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-green-700 mb-4">Tốc độ tăng GRDP</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                        <div className="flex min-w-0 flex-col gap-4 justify-center sm:shrink-0 sm:basis-[42%]">
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Tổng giá trị tăng thêm</p>
                            <p className="text-2xl font-bold text-green-700">6,54%</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Thuế SP trừ trợ cấp</p>
                            <p className="text-2xl font-bold text-green-700">4,75%</p>
                          </div>
                        </div>
                        {/* Chart */}
                        <div className="relative h-36 min-h-0 flex-1 bg-gray-50 rounded-lg border border-gray-200/20 sm:min-h-32">
                        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-around">
                          <div className="w-6 bg-green-600 h-[95%] rounded-t-sm relative">
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-600">162</span>
                          </div>
                          <div className="w-6 bg-green-600 h-[75%] rounded-t-sm relative">
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-600">129</span>
                          </div>
                          <div className="w-6 bg-green-600 h-[55%] rounded-t-sm relative">
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-600">90</span>
                          </div>
                          <div className="w-6 bg-green-600 h-[70%] rounded-t-sm relative">
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-600">121</span>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-2 right-2 flex justify-around text-[6px] font-bold text-gray-600 text-center">
                          <span className="w-6">KV III</span>
                          <span className="w-6">KV II</span>
                          <span className="w-6">KV I</span>
                          <span className="w-6">Thuế SP</span>
                        </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 4: Cơ cấu GRDP */}
                <Card className="h-full w-full min-w-0 border-l-4 border-l-blue-700 border-r border-orange-200/50 border-b border-orange-200/50 overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-blue-800 mb-4">Cơ cấu GRDP</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col lg:flex-row items-center justify-around gap-6">
                        <div className="relative w-40 h-40 flex-shrink-0">
                          {/* Donut Chart */}
                          <div className="w-full h-full rounded-full border-[20px] border-gray-200" style={{ background: 'conic-gradient(#1D4ED8 0% 39.25%, #795900 39.25% 68.19%, #154212 68.19% 95.78%, #7C3AED 95.78% 100%)' }}>
                            <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center">
                              <span className="text-xs font-bold text-center">Tỷ trọng</span>
                              <span className="text-xs font-bold text-center">(%)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                          <div className="flex items-center justify-between border-b border-orange-200/20 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                              <span className="text-sm font-bold text-gray-700">KV III (Dịch vụ)</span>
                            </div>
                            <span className="text-sm font-bold text-blue-800">39,25%</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-orange-200/20 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                              <span className="text-sm font-bold text-gray-700">KV II (Công nghiệp)</span>
                            </div>
                            <span className="text-sm font-bold text-orange-800">28,94%</span>
                          </div>
                          <div className="flex items-center justify-between border-b border-orange-200/20 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                              <span className="text-sm font-bold text-gray-700">KV I (Nông, Lâm)</span>
                            </div>
                            <span className="text-sm font-bold text-green-800">27,59%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                              <span className="text-sm font-bold text-gray-700">Thuế sản phẩm</span>
                            </div>
                            <span className="text-sm font-bold text-purple-800">4,22%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
        </div>
      </div>
    </Main>
  )
}
