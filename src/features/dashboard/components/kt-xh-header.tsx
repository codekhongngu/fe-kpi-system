import { useState } from "react"
import { useNavigate } from '@tanstack/react-router'
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Bookmark
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface KtXhHeaderProps {
  title: string
}

export function KtXhHeader({ title }: KtXhHeaderProps) {
  const navigate = useNavigate()

  const ktXhPages = [
    { name: 'GRDP', path: '/grdp', description: 'Tổng sản phẩm nội địa' },
    { name: 'Nông nghiệp: Trồng trọt', path: '/agriculture', description: 'Trồng trọt và cây cối' },
    { name: 'Nông nghiệp: Các loại cây trồng khác', path: '/tree-planting-other', description: 'Các loại cây trồng khác' },
    { name: 'Chăn nuôi', path: '/livestock', description: 'Chăn nuôi gia súc, gia cầm' },
    { name: 'Lâm nghiệp, Thủy sản', path: '/forestry-fishery', description: 'Lâm nghiệp và khai thác thủy sản' },
  ]

  const currentPageIndex = ktXhPages.findIndex(page => window.location.pathname === page.path)
  const previousPage = currentPageIndex > 0 ? ktXhPages[currentPageIndex - 1] : null
  const nextPage = currentPageIndex < ktXhPages.length - 1 ? ktXhPages[currentPageIndex + 1] : null

  const navigateToPrevious = () => {
    if (previousPage) {
      navigate({ to: previousPage.path })
    }
  }

  const navigateToNext = () => {
    if (nextPage) {
      navigate({ to: nextPage.path })
    }
  }

  const [selectedPeriod, setSelectedPeriod] = useState('06')
  const [selectedYear, setSelectedYear] = useState('2024')

  return (
    <header className="sticky top-0 z-30 h-[60px] bg-orange-50 border-b border-orange-200/50 flex flex-col justify-center px-6">
      <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-orange-700 hover:bg-orange-100"
            onClick={navigateToPrevious}
            disabled={!previousPage}
          >
            <ChevronLeft size={20} />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-orange-700 hover:bg-orange-100">
                <MoreVertical size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {ktXhPages.map((page) => (
                <DropdownMenuItem 
                  key={page.path}
                  onClick={() => navigate({ to: page.path })}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{page.name}</span>
                    <span className="text-xs text-muted-foreground">{page.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-orange-700 hover:bg-orange-100"
            onClick={navigateToNext}
            disabled={!nextPage}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-orange-800 uppercase tracking-tight">{title}</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-2 items-center bg-white px-4 py-2 rounded-xl border border-orange-200/30">
            <label className="text-xs font-bold text-orange-600">Kỳ</label>
            <select 
              className="bg-transparent border-none p-0 focus:ring-0 text-green-700 font-bold text-sm"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="06">06</option>
              <option value="07">07</option>
              <option value="08">08</option>
              <option value="09">09</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </div>
          <div className="flex gap-2 items-center bg-white px-4 py-2 rounded-xl border border-orange-200/30">
            <label className="text-xs font-bold text-orange-600">Năm</label>
            <select 
              className="bg-transparent border-none p-0 focus:ring-0 text-green-700 font-bold text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          <Button variant="ghost" size="icon" className="text-orange-700 hover:bg-orange-100">
            <Bookmark size={20} />
          </Button>
        </div>
      </div>
    </header>
  )
}
