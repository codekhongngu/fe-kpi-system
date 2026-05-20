import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type TemplateField, type TemplateIndicator } from '../../api/types'
import {
  buildTree,
  buildHeaderMatrix,
  collectLeafFieldsInOrder,
  flattenIndicatorTree,
} from '../../utils/tree-utils'

type TemplateMatrixGridProps = {
  indicators: TemplateIndicator[]
  fields: TemplateField[]
  renderCell: (
    indicator: TemplateIndicator,
    field: TemplateField
  ) => React.ReactNode
  emptyMessage?: string
  /** Expand every indicator row on mount (preview/import) */
  defaultExpandAll?: boolean
  /** Hide fullscreen toggle — use inside dialogs */
  compact?: boolean
}

export function TemplateMatrixGrid({
  indicators,
  fields,
  renderCell,
  emptyMessage = 'Không có dữ liệu',
  defaultExpandAll = false,
  compact = false,
}: TemplateMatrixGridProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (defaultExpandAll) {
      return new Set(indicators.map((ind) => ind.id))
    }
    const rootIds = new Set<string>()
    indicators.forEach((ind) => {
      if (!ind.parentId) {
        rootIds.add(ind.id)
      }
    })
    return rootIds
  })

  useEffect(() => {
    if (!defaultExpandAll) return
    setExpandedIds(new Set(indicators.map((ind) => ind.id)))
  }, [defaultExpandAll, indicators])

  // Close fullscreen on escape key
  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedIds(new Set(indicators.map((i) => i.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // 1. Process Fields -> Headers
  const { headerMatrix, leafFields } = useMemo(() => {
    // Separate system fields (always flat, sticky on the left)
    const systemFields = fields.filter((f) => f.isSystemDefault)
    const nameField =
      systemFields.find((f) => f.label === 'Tên chỉ tiêu') ?? systemFields[0]
    const unitField = systemFields.find(
      (f) => f.label === 'Đơn vị tính' && f.id !== nameField?.id
    )
    const stickyFields = [nameField, unitField].filter(
      Boolean
    ) as TemplateField[]

    const extraFields = fields.filter(
      (f) =>
        !f.isSystemDefault || !stickyFields.map((sf) => sf.id).includes(f.id)
    )

    const matrix = buildHeaderMatrix(extraFields)
    const leaves = collectLeafFieldsInOrder(extraFields)

    return {
      headerMatrix: matrix,
      leafFields: leaves,
      stickyFields,
    }
  }, [fields])

  // 2. Process Indicators -> Rows
  const rowNodes = useMemo(() => {
    const tree = buildTree(indicators)
    return flattenIndicatorTree(tree, expandedIds)
  }, [indicators, expandedIds])

  const maxDepth = headerMatrix.length

  const wrapperClass = isFullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-background'
    : 'flex flex-col border rounded-md relative'

  const contentClass = isFullscreen
    ? 'flex-1 overflow-auto p-4'
    : compact
      ? 'overflow-auto max-h-[min(50vh,480px)]'
      : 'overflow-auto max-h-[600px]'

  return (
    <div className={wrapperClass}>
      {/* Toolbar */}
      <div className='flex items-center justify-between border-b bg-muted/20 p-2'>
        <div className='flex gap-2'>
          <Button variant='ghost' size='sm' onClick={expandAll}>
            Mở rộng tất cả
          </Button>
          <Button variant='ghost' size='sm' onClick={collapseAll}>
            Thu gọn tất cả
          </Button>
        </div>
        {!compact ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className='size-4' />
            ) : (
              <Maximize2 className='size-4' />
            )}
          </Button>
        ) : null}
      </div>

      {/* Grid container */}
      <div className={contentClass}>
        {indicators.length === 0 || fields.length === 0 ? (
          <div className='p-8 text-center text-muted-foreground'>
            {emptyMessage}
          </div>
        ) : (
          <table className='w-full border-collapse text-sm'>
            <thead className='sticky top-0 z-20 shadow-sm'>
              {/* Render multi-level headers */}
              {headerMatrix.map((row, rowIndex) => (
                <tr key={`header-row-${rowIndex}`} className='bg-muted/80'>
                  {/* Sticky left headers (only rendered on first row with rowspan = maxDepth) */}
                  {rowIndex === 0 && (
                    <>
                      <th
                        className='sticky left-0 z-30 max-w-[400px] min-w-[280px] border-r border-b bg-muted/80 px-4 py-3 text-left font-semibold'
                        rowSpan={maxDepth}
                      >
                        Tên chỉ tiêu
                      </th>
                      <th
                        className='sticky left-[280px] z-30 min-w-[100px] border-r border-b bg-muted/80 px-4 py-3 text-left font-semibold'
                        rowSpan={maxDepth}
                      >
                        ĐVT
                      </th>
                    </>
                  )}
                  {/* Dynamic headers */}
                  {row.map((node) => (
                    <th
                      key={node.id}
                      className='border-r border-b px-4 py-2 text-center align-middle font-medium'
                      colSpan={node.colSpan}
                      rowSpan={node.rowSpan}
                    >
                      {node.label}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rowNodes.map((rowNode) => (
                <tr
                  key={rowNode.id}
                  className='group align-top hover:bg-muted/10'
                >
                  {/* Sticky Left: Tên chỉ tiêu */}
                  <td className='sticky left-0 z-10 max-w-[400px] min-w-[280px] border-r border-b bg-background px-3 py-2 group-hover:bg-muted/10'>
                    <div
                      className='flex items-start gap-1'
                      style={{
                        paddingLeft: `${((rowNode.level || 1) - 1) * 1.5}rem`,
                      }}
                    >
                      {rowNode.hasChildren ? (
                        <button
                          type='button'
                          className='mt-0.5 shrink-0 rounded-sm p-0.5 hover:bg-muted'
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(rowNode.id)
                          }}
                        >
                          {rowNode.isExpanded ? (
                            <ChevronDown className='size-4 text-muted-foreground' />
                          ) : (
                            <ChevronRight className='size-4 text-muted-foreground' />
                          )}
                        </button>
                      ) : (
                        <div className='w-5 shrink-0' />
                      )}
                      <div>
                        <div className='text-xs text-muted-foreground'>
                          {rowNode.code}
                        </div>
                        <div className='font-medium'>{rowNode.name}</div>
                      </div>
                    </div>
                  </td>
                  {/* Sticky Left: Đơn vị tính */}
                  <td className='sticky left-[280px] z-10 min-w-[100px] border-r border-b bg-background px-3 py-2 text-center align-middle group-hover:bg-muted/10'>
                    <span className='font-medium'>{rowNode.unit || '-'}</span>
                  </td>
                  {/* Dynamic Cells */}
                  {leafFields.map((field) => (
                    <td
                      key={`${rowNode.id}_${field.id}`}
                      className='border-r border-b px-3 py-2 align-top'
                    >
                      {renderCell(rowNode as TemplateIndicator, field)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
