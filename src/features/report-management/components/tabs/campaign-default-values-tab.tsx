import { useMemo, useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formManagementApi } from '../../../form-management/api/template-management-api'
import type {
  TemplateField,
  TemplateCellConfig,
  TemplateIndicator,
} from '../../../form-management/api/types'
import { TemplateMatrixGrid } from '../../../form-management/components/shared/template-matrix-grid'
import { reportCampaignApi } from '../../api/report-management-api'
import type { CampaignDefaultValue } from '../../api/types'

type CampaignDefaultValuesTabProps = {
  campaignId: string
  templateId: string
}

function cellKey(indicatorId: string, attributeId: string) {
  return `${indicatorId}__${attributeId}`
}

export function CampaignDefaultValuesTab({
  campaignId,
  templateId,
}: CampaignDefaultValuesTabProps) {
  const queryClient = useQueryClient()
  
  // Local state for edits
  const [editedValues, setEditedValues] = useState<Record<string, { text: string; number: number | null }>>({})

  const campaignQuery = useQuery({
    queryKey: ['report-management', 'campaign', campaignId],
    queryFn: () => reportCampaignApi.getCampaign(campaignId),
    enabled: Boolean(campaignId),
  })

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'preview-matrix'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const effectiveCellConfigsQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'cell-configs', 'effective'],
    queryFn: () => formManagementApi.listEffectiveCellConfigs(templateId),
    enabled: Boolean(templateId),
  })

  const defaultValuesQuery = useQuery({
    queryKey: ['report-management', 'campaign', campaignId, 'default-values'],
    queryFn: () => reportCampaignApi.listDefaultValues(campaignId),
    enabled: Boolean(campaignId),
  })

  const campaign = campaignQuery.data ?? null
  const template = templateQuery.data ?? null
  const canEdit = Boolean(campaign && campaign.status === 'DRAFT')

  const effectiveMap = useMemo(() => {
    const map = new Map<string, TemplateCellConfig>()
    for (const cell of effectiveCellConfigsQuery.data ?? []) {
      map.set(cellKey(cell.indicatorId, cell.attributeId), cell)
    }
    return map
  }, [effectiveCellConfigsQuery.data])

  const initialValuesMap = useMemo(() => {
    const map = new Map<string, CampaignDefaultValue>()
    for (const item of defaultValuesQuery.data ?? []) {
      map.set(cellKey(item.indicatorId, item.attributeId), item)
    }
    return map
  }, [defaultValuesQuery.data])

  // Reset edits when query data changes
  useEffect(() => {
    const nextState: Record<string, { text: string; number: number | null }> = {}
    for (const item of defaultValuesQuery.data ?? []) {
      nextState[cellKey(item.indicatorId, item.attributeId)] = {
        text: item.valueText ?? '',
        number: item.valueNumber,
      }
    }
    setEditedValues(nextState)
  }, [defaultValuesQuery.data])

  const hasChanges = useMemo(() => {
    const initialKeys = Array.from(initialValuesMap.keys())
    const editedKeys = Object.keys(editedValues)
    
    // Check if new items added or removed
    if (initialKeys.length !== editedKeys.length) return true
    
    // Check if any values changed
    for (const key of editedKeys) {
      const initial = initialValuesMap.get(key)
      const edited = editedValues[key]
      if (!initial) return true
      if ((initial.valueText ?? '') !== edited.text) return true
      if (initial.valueNumber !== edited.number) return true
    }
    
    return false
  }, [initialValuesMap, editedValues])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!campaignId) return

      const upsertItems: Array<{
        indicatorId: string
        attributeId: string
        valueText: string | null
        valueNumber: number | null
      }> = []
      
      const deleteItems: Array<{ indicatorId: string; attributeId: string }> = []
      
      const allKeys = new Set([...Array.from(initialValuesMap.keys()), ...Object.keys(editedValues)])
      
      for (const key of allKeys) {
        const [indicatorId, attributeId] = key.split('__')
        const initial = initialValuesMap.get(key)
        const edited = editedValues[key]
        
        // If it was removed (should not happen with our UI, but for completeness)
        if (!edited && initial) {
          deleteItems.push({ indicatorId, attributeId })
          continue
        }
        
        // If it has empty values, we can just delete it instead of storing empty
        if (edited && !edited.text && edited.number === null) {
          if (initial) {
            deleteItems.push({ indicatorId, attributeId })
          }
          continue
        }

        // If changed or new
        if (edited) {
          const cellConfig = effectiveMap.get(key)
          const dataType = cellConfig?.dataType ?? 'text'
          
          const isChanged = !initial || initial.valueText !== edited.text || initial.valueNumber !== edited.number
          
          if (isChanged) {
            upsertItems.push({
              indicatorId,
              attributeId,
              valueText: dataType === 'text' ? (edited.text || null) : null,
              valueNumber: dataType === 'number' ? edited.number : null,
            })
          }
        }
      }
      
      if (upsertItems.length > 0) {
        await reportCampaignApi.upsertDefaultValues(campaignId, upsertItems)
      }
      if (deleteItems.length > 0) {
        await reportCampaignApi.deleteDefaultValues(campaignId, deleteItems)
      }
    },
    onSuccess: async () => {
      toast.success('Đã lưu giá trị mặc định.')
      await queryClient.invalidateQueries({ queryKey: ['report-management', 'campaign', campaignId, 'default-values'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function handleValueChange(indicatorId: string, attributeId: string, value: string, dataType: 'number' | 'text') {
    const key = cellKey(indicatorId, attributeId)
    setEditedValues((prev) => {
      const current = prev[key] || { text: '', number: null }
      return {
        ...prev,
        [key]: {
          text: dataType === 'text' ? value : current.text,
          number: dataType === 'number' ? (value === '' ? null : Number(value)) : current.number,
        },
      }
    })
  }

  function renderCell(indicator: TemplateIndicator, field: TemplateField) {
    if (indicator.type === 'TITLE') {
      return (
        <div className='flex w-full min-w-[120px] items-center justify-center rounded-md border border-dashed border-transparent bg-muted/5 px-2 py-1 opacity-50'>
          <span className='text-[10px] uppercase text-muted-foreground'>Không áp dụng</span>
        </div>
      )
    }

    const cellConfig = effectiveMap.get(cellKey(indicator.id, field.id))

    if (!cellConfig) {
      return <span className='text-xs text-muted-foreground block text-center'>-</span>
    }

    if (cellConfig.formula) {
      return (
        <div className='flex w-full min-w-[120px] items-center justify-between rounded-md border border-dashed border-transparent bg-muted/10 px-2 py-1'>
          <span className='text-[10px] uppercase text-muted-foreground'>Công thức</span>
          <Badge variant='outline' className='text-[9px] px-1 py-0'>{cellConfig.formula}</Badge>
        </div>
      )
    }

    if (cellConfig.readOnly) {
      return (
        <div className='flex w-full min-w-[120px] items-center justify-center rounded-md border border-dashed border-transparent bg-muted/10 px-2 py-1'>
          <span className='text-[10px] uppercase text-muted-foreground'>Chỉ đọc</span>
        </div>
      )
    }

    const key = cellKey(indicator.id, field.id)
    const currentValue = editedValues[key]

    return (
      <div className='w-full min-w-[120px]'>
        <Input
          type={cellConfig.dataType === 'number' ? 'number' : 'text'}
          placeholder='Nhập giá trị...'
          className='h-8 text-xs'
          disabled={!canEdit}
          value={
            cellConfig.dataType === 'number'
              ? (currentValue?.number ?? '')
              : (currentValue?.text ?? '')
          }
          onChange={(e) => handleValueChange(indicator.id, field.id, e.target.value, cellConfig.dataType as 'number' | 'text')}
        />
      </div>
    )
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <CardTitle>Giá trị mặc định</CardTitle>
            <CardDescription>
              Thiết lập giá trị điền sẵn cho các ô dữ liệu trong báo cáo. Đơn vị báo cáo sẽ thấy giá trị này khi bắt đầu nhập liệu.
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              className='gap-2 rounded-xl text-xs font-bold'
              onClick={() => saveMutation.mutate()}
              disabled={!canEdit || !hasChanges || saveMutation.isPending}
            >
              <Save className='size-4' />
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {templateQuery.isLoading ? (
          <div className='py-12 text-center text-sm text-muted-foreground'>Đang tải dữ liệu cấu hình...</div>
        ) : templateQuery.isError || !template ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive'>
            Không thể tải cấu trúc biểu mẫu cho đợt báo cáo này.
          </div>
        ) : (
          <div className='space-y-4'>
            {!canEdit && (
              <div className='flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-600 border border-amber-500/20'>
                <AlertCircle className='size-4' />
                <span>Không thể chỉnh sửa giá trị mặc định do đợt báo cáo đã chuyển trạng thái.</span>
              </div>
            )}
            <TemplateMatrixGrid
              indicators={template.indicators}
              fields={template.fields}
              renderCell={renderCell}
              emptyMessage='Chưa có cấu hình ma trận để nhập liệu.'
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
