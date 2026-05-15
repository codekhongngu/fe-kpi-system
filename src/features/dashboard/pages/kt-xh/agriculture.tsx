import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Main } from '@/components/layout/main'
import { KtXhHeader } from '../../components/kt-xh-header';
import { 
  Sprout, 
  Trees, 
  Leaf, 
  TrendingUp
} from 'lucide-react'

export function AgriculturePage() {

  return (
    <Main fluid>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Top App Bar */}
        <KtXhHeader title="NÔNG NGHIỆP: TRỒNG TRỐT" />

        {/* Section 1: Aggregate Metrics */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
            <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">TỔNG DIỆN TÍCH GIEO TRỒNG VÀ SẢN LƯỢNG CÂY LÚA</h2>
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric Card 1 */}
            <Card className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-orange-600 uppercase mb-4">TỔNG DIỆN TÍCH GIEO TRỒNG (ha)</p>
                <div className="flex items-end justify-between">
                  <Sprout className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      0,0 
                      <span className="text-green-600">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">So với kỳ trước (%): 0,0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metric Card 2 */}
            <Card className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-orange-600 uppercase mb-4">SẢN LƯỢNG (tấn)</p>
                <div className="flex items-end justify-between">
                  <Trees className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      0,0 
                      <span className="text-green-600">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">So với kỳ trước (%): 0,0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metric Card 3 */}
            <Card className="border-orange-200/50 hover:border-green-300/30 transition-all">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-orange-600 uppercase mb-4">NĂNG SUẤT (tạ/ha)</p>
                <div className="flex items-end justify-between">
                  <Leaf className="text-yellow-600 text-5xl opacity-40" />
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700 flex items-center justify-end gap-2">
                      0,0 
                      <span className="text-green-600">
                        <TrendingUp size={16} />
                      </span>
                    </p>
                    <p className="text-xs text-orange-600">So với kỳ trước (%): 0,0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Detailed Seasonal Metrics */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
            <h2 className="text-xl font-bold text-green-700 uppercase tracking-wider px-4">CHỈ TIÊU TRỒNG TRỐT</h2>
            <div className="h-[2px] flex-1 bg-orange-200/50"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Seasonal Card 1 */}
            <Card className="border-l-4 border-l-green-600 border-orange-200/50 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-lg font-bold text-green-700 sm:text-xl mb-3">LÚA VỤ ĐÔNG XUÂN</h3>
                <div className="flex flex-row gap-3 sm:gap-4 items-start">
                  <img
                    className="h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28"
                    alt="Lúa vụ đông xuân"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQ8RdB4PkkHnt_3lsbGq8eAigRwT3gSw1Y-EUUJQODFa55hbHAbDM9FkQjuwzvVldkzIP81FgLDML0_8_4l0juSHwb9yjO2ENA4uWeit56ssGHtT2G4F0wOMJnWkIuu8pHNfyNDNBm4bXIXJWkDNl9gN-BR01Fc_KpQqH04JqNLv4Qi2qxyfr0DDWUGkJQdgARFuz2g8hvjRcIvPQQv3mgDu2MQ9jgQliRRNh3FA1gPRMTOpRqbe77CwgmYKmZHhyAO4oUCkqELQ"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5 text-right">
                    <div className="flex flex-wrap items-end justify-end gap-2 border-b border-orange-200/20 pb-1.5">
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">46.788,0</span>
                        <span className="text-[11px] text-green-600 sm:text-xs">+99,8%</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Diện tích (ha)</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-orange-200/20 pb-1.5">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Sản lượng (tấn)</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0,0</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Năng suất (tạ/ha)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seasonal Card 2 */}
            <Card className="border-l-4 border-l-yellow-600 border-orange-200/50 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-lg font-bold text-green-700 sm:text-xl mb-3">LÚA VỤ HÈ THU</h3>
                <div className="flex flex-row gap-3 sm:gap-4 items-start">
                  <img
                    className="h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28"
                    alt="Lúa vụ hè thu"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwCpIKPnDIu8RykiA-DDe9GdBrz7mwFVaTNK4Me9pCq7nFbUZc_YlzufN1Ym5AjaSUHPEF3n8zAXRNWq5rps9rFR8-8zo4MadWes8KN1d3OrJG8TL7-Dz4RW6ZhsX-_cqDYqobw_S6oRydgvUwbf9GfVhmqPKXiGxlM7zsKKeTBRspdVaaHnB-M84dlCLiCZJokgTC9i91O7QnEWaV74fqd0VfyflCGR2kPez-HQ0Ye0_HkHw8V4dVywfCsd9R9oP67O2oEczdjA"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-orange-200/20 pb-1.5">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0,00</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Diện tích (ha)</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-orange-200/20 pb-1.5">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0,00</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Sản lượng (tấn)</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0,00</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Năng suất (tạ/ha)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seasonal Card 3 */}
            <Card className="border-l-4 border-l-orange-600 border-orange-200/50 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <h3 className="text-lg font-bold text-green-700 sm:text-xl mb-3">LÚA VỤ MÙA</h3>
                <div className="flex flex-row gap-3 sm:gap-4 items-start">
                  <img
                    className="h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28"
                    alt="Lúa vụ mùa"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl4uRXrdcvi_UnW48QhcXcZWGxUtAlZkIoo3heaJ39jKLodvPHoYi7Ezzg4dOSdpfENmNnfCzGWWJfAsaYHlc4hMFwRqCi0zqY7JBSO9rVeZwr2BFS8UZ-JrKDK3kouxv_ylqHnro0azeAgA6EbxOyjrit3SffkcVDkzG6CYqyFfDAmcv_G8jSMmrvWZa4H97LbfoeQl-erQOe_w58dr487PGzpewBYB9QKDKyTNLdPFNwEFYOzH2zJ4oA_hqaI-xbe1zaGj0sLQ"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-orange-200/20 pb-1.5">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0,00</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Diện tích (ha)</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-orange-200/20 pb-1.5">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0,00</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Sản lượng (tấn)</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="text-base font-bold tabular-nums text-green-700 sm:text-lg">0,00</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-600" />
                        <span className="text-xs font-bold text-orange-600 sm:text-sm">Năng suất (tạ/ha)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Main>
  )
}
