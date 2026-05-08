import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Filter,
  List,
  PlusCircle,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserPen,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formManagementApi } from '../../api/template-management-api'
import type { TemplateIndicator, TemplateScope } from '../../api/types'

type TemplateScopesTabProps = {
  templateId: string
}

type ScopeFormState = {
  orgId: string
  orgName: string
  indicatorId: string
}

type OrgSummary = {
  orgId: string
  orgName: string
  orgCode?: string
  items: TemplateScope[]
}

const defaultScopeForm: ScopeFormState = {
  orgId: '',
  orgName: '',
  indicatorId: '',
}

function scopeKey(orgId: string, indicatorId: string) {
  return `${orgId}::${indicatorId}`
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function dedupeScopes(items: TemplateScope[]) {
  const seen = new Map<string, TemplateScope>()

  items.forEach((item) => {
    const orgId = item.orgId.trim()
    const indicatorId = item.indicatorId.trim()
    if (!orgId || !indicatorId) return

    const key = scopeKey(orgId, indicatorId)
    if (seen.has(key)) return

    seen.set(key, {
      ...item,
      orgId,
      orgName: item.orgName?.trim() || undefined,
      orgCode: item.orgCode?.trim() || undefined,
      indicatorId,
      indicatorName: item.indicatorName?.trim() || undefined,
      indicatorCode: item.indicatorCode?.trim() || undefined,
    })
  })

  return Array.from(seen.values())
}

function formatOrgLabel(item: Pick<TemplateScope, 'orgId' | 'orgName' | 'orgCode'>) {
  return [item.orgCode, item.orgName ?? item.orgId].filter(Boolean).join(' - ')
}

function formatIndicatorLabel(item: Pick<TemplateIndicator, 'code' | 'name'>) {
  return [item.code, item.name].filter(Boolean).join(' - ')
}

export function TemplateScopesTab({ templateId }: TemplateScopesTabProps) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<TemplateScope[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingScopeKey, setEditingScopeKey] = useState<string | null>(null)
  const [scopeForm, setScopeForm] = useState<ScopeFormState>(defaultScopeForm)
  const [orgSearch, setOrgSearch] = useState('')
  const [indicatorSearch, setIndicatorSearch] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([])
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([])

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'scopes-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const template = templateQuery.data ?? null
  const indicators = useMemo(() => template?.indicators ?? [], [template?.indicators])
  const canEdit = Boolean(template && ['DRAFT', 'READY'].includes(template.templateStatus ?? 'DRAFT'))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(dedupeScopes(template?.templateScopes ?? []))
  }, [template?.templateScopes])

  const orgSummaries = useMemo<OrgSummary[]>(() => {
    const map = new Map<string, OrgSummary>()

    rows.forEach((item) => {
      const orgId = item.orgId.trim()
      if (!orgId) return

      const current = map.get(orgId)
      if (!current) {
        map.set(orgId, {
          orgId,
          orgName: item.orgName?.trim() || item.orgId,
          orgCode: item.orgCode?.trim() || undefined,
          items: [item],
        })
        return
      }

      current.items.push(item)
      if (!current.orgCode && item.orgCode?.trim()) {
        current.orgCode = item.orgCode.trim()
      }
      if (current.orgName === current.orgId && item.orgName?.trim()) {
        current.orgName = item.orgName.trim()
      }
    })

    return Array.from(map.values()).sort((left, right) =>
      formatOrgLabel(left).localeCompare(formatOrgLabel(right), 'vi-VN'),
    )
  }, [rows])

  useEffect(() => {
    if (orgSummaries.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOrgId(null)
      return
    }

    if (!selectedOrgId || !orgSummaries.some((item) => item.orgId === selectedOrgId)) {
      setSelectedOrgId(orgSummaries[0].orgId)
    }
  }, [orgSummaries, selectedOrgId])

  const selectedOrgSummary = useMemo(
    () => orgSummaries.find((item) => item.orgId === selectedOrgId) ?? null,
    [orgSummaries, selectedOrgId],
  )

  const selectedOrgRows = useMemo(
    () => rows.filter((item) => item.orgId === selectedOrgId),
    [rows, selectedOrgId],
  )

  const indicatorById = useMemo(() => {
    return new Map(indicators.map((item) => [item.id, item]))
  }, [indicators])

  const selectedOrgIndicatorIds = useMemo(
    () => new Set(selectedOrgRows.map((item) => item.indicatorId)),
    [selectedOrgRows],
  )

  const filteredOrgs = useMemo(() => {
    const keyword = normalizeText(orgSearch)
    if (!keyword) return orgSummaries

    return orgSummaries.filter((item) => {
      return [item.orgId, item.orgCode, item.orgName]
        .filter(Boolean)
        .some((value) => normalizeText(value).includes(keyword))
    })
  }, [orgSearch, orgSummaries])

  const availableIndicators = useMemo(() => {
    const keyword = normalizeText(indicatorSearch)
    if (!selectedOrgId) return []

    return indicators.filter((indicator) => {
      if (selectedOrgIndicatorIds.has(indicator.id)) return false
      if (!keyword) return true
      return [indicator.code, indicator.name, indicator.unit]
        .filter(Boolean)
        .some((value) => normalizeText(value).includes(keyword))
    })
  }, [indicatorSearch, indicators, selectedOrgId, selectedOrgIndicatorIds])

  const assignedIndicators = useMemo(() => {
    const keyword = normalizeText(indicatorSearch)
    if (!selectedOrgId) return []

    return selectedOrgRows
      .map((item) => ({
        scope: item,
        indicator: indicatorById.get(item.indicatorId) ?? null,
      }))
      .filter(({ scope, indicator }) => {
        if (!keyword) return true
        return [indicator?.code ?? scope.indicatorCode, indicator?.name ?? scope.indicatorName, scope.indicatorId]
          .filter(Boolean)
          .some((value) => normalizeText(value).includes(keyword))
      })
  }, [indicatorById, indicatorSearch, selectedOrgId, selectedOrgRows])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedAvailableIds((current) =>
      current.filter((id) => availableIndicators.some((item) => item.id === id)),
    )
  }, [availableIndicators])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedAssignedIds((current) =>
      current.filter((id) => assignedIndicators.some((item) => item.scope.indicatorId === id)),
    )
  }, [assignedIndicators])

  const saveMutation = useMutation({
    mutationFn: () =>
      formManagementApi.upsertTemplateScopes(
        templateId,
        dedupeScopes(rows)
          .filter((item) => item.orgId.trim() && item.indicatorId.trim())
          .map((item) => ({
            orgId: item.orgId.trim(),
            indicatorId: item.indicatorId.trim(),
          })),
      ),
    onSuccess: async () => {
      toast.success('Đã lưu phạm vi mẫu.')
      await queryClient.invalidateQueries({ queryKey: ['form-management', 'template', templateId] })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreateDialog() {
    setEditingScopeKey(null)
    setScopeForm({
      orgId: selectedOrgSummary?.orgId ?? '',
      orgName: selectedOrgSummary?.orgName ?? '',
      indicatorId: '',
    })
    setDialogOpen(true)
  }

  function openEditDialog(item: TemplateScope) {
    setEditingScopeKey(scopeKey(item.orgId, item.indicatorId))
    setScopeForm({
      orgId: item.orgId,
      orgName: item.orgName ?? '',
      indicatorId: item.indicatorId,
    })
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingScopeKey(null)
    setScopeForm(defaultScopeForm)
  }

  function submitScopeForm() {
    if (!scopeForm.orgId.trim() || !scopeForm.indicatorId.trim()) {
      toast.error('Mã đơn vị và chỉ tiêu là bắt buộc.')
      return
    }

    const selectedIndicator = indicatorById.get(scopeForm.indicatorId.trim())
    const nextRow: TemplateScope = {
      orgId: scopeForm.orgId.trim(),
      orgName: scopeForm.orgName.trim() || undefined,
      indicatorId: scopeForm.indicatorId.trim(),
      indicatorCode: selectedIndicator?.code,
      indicatorName: selectedIndicator?.name,
    }

    setRows((current) => {
      const normalized = dedupeScopes(current)
      if (!editingScopeKey) {
        return dedupeScopes([...normalized, nextRow])
      }

      return dedupeScopes(
        normalized.map((item) => (scopeKey(item.orgId, item.indicatorId) === editingScopeKey ? nextRow : item)),
      )
    })
    closeDialog()
  }

  function removeScopeByKey(itemKey: string) {
    setRows((current) => current.filter((item) => scopeKey(item.orgId, item.indicatorId) !== itemKey))
  }

  function handleAssignSelected() {
    if (!selectedOrgId) {
      toast.error('Chọn đơn vị trước khi gán chỉ tiêu.')
      return
    }

    if (selectedAvailableIds.length === 0) return

    const selectedOrg = selectedOrgSummary

    setRows((current) => {
      const next = [...dedupeScopes(current)]

      selectedAvailableIds.forEach((indicatorId) => {
        if (next.some((item) => item.orgId === selectedOrgId && item.indicatorId === indicatorId)) {
          return
        }

        const indicator = indicatorById.get(indicatorId)
        next.push({
          orgId: selectedOrgId,
          orgName: selectedOrg?.orgName ?? selectedOrgId,
          orgCode: selectedOrg?.orgCode,
          indicatorId,
          indicatorCode: indicator?.code,
          indicatorName: indicator?.name,
        })
      })

      return dedupeScopes(next)
    })

    setSelectedAvailableIds([])
  }

  function handleUnassignSelected() {
    if (!selectedOrgId || selectedAssignedIds.length === 0) return

    setRows((current) =>
      current.filter(
        (item) => !(item.orgId === selectedOrgId && selectedAssignedIds.includes(item.indicatorId)),
      ),
    )

    setSelectedAssignedIds([])
  }

  if (!template) {
    return (
      <div className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
        Chưa có biểu mẫu để cấu hình phạm vi.
      </div>
    )
  }

  return (
    <Card className='rounded-3xl'>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Chỉ tiêu</CardTitle>
            <CardDescription>Cấu hình cây chỉ tiêu theo cấp, lưu trữ thêm, sửa, xóa, nhập Excel và sắp xếp cùng cấp.</CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              // onClick={handleSaveOrder}
              // disabled={!canEdit || !hasPendingReorder || saveOrderMutation.isPending}
            >
              <Save className='size-4' />
              Save order
            </Button>
            {/* <Button
              size='sm'
              variant='outline'
              // onClick={() => importMutation.mutate()}
              // disabled={!canEdit || importMutation.isPending}
            >
              <FileUp className='size-4' />
              Nhập Excel
            </Button> */}
            {/* <Button size='sm' onClick={() => openCreateDialog(null)} disabled={!canEdit}>
              <PlusCircle className='size-4' />
              Thêm chỉ tiêu
            </Button> */}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className='space-y-3'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]'>
        <div>
          <Card className='overflow-hidden rounded-2xl border shadow-sm'>
            <CardHeader className='pb-4'>
              <CardTitle className='text-base font-bold'>Đơn vị áp dụng</CardTitle>
              <CardDescription className='text-xs'>
                Chọn đơn vị để xem và thiết lập phạm vi chỉ tiêu.
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='border-y bg-muted/20 px-4 py-3'>
                <div className='relative'>
                  <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
                  <Input
                    placeholder='Tìm mã hoặc tên đơn vị...'
                    className='h-9 rounded-lg pl-9 text-xs focus-visible:ring-primary'
                    value={orgSearch}
                    onChange={(event) => setOrgSearch(event.target.value)}
                  />
                </div>
              </div>
              <div className='max-h-[600px] overflow-auto p-3'>
                {filteredOrgs.length > 0 ? (
                  <div className='space-y-1'>
                    {filteredOrgs.map((item) => {
                      const isSelected = selectedOrgId === item.orgId
                      return (
                        <button
                          key={item.orgId}
                          type='button'
                          className={[
                            'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                            isSelected
                              ? 'bg-primary/10 font-bold text-primary'
                              : 'hover:bg-muted/50 font-medium text-foreground',
                          ].join(' ')}
                          onClick={() => setSelectedOrgId(item.orgId)}
                        >
                          <Building2 className={isSelected ? 'size-4 text-primary' : 'size-4 text-muted-foreground'} />
                          <span className='min-w-0 truncate'>{formatOrgLabel(item)}</span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className='py-12 text-center text-xs text-muted-foreground'>
                    <div className='flex flex-col items-center gap-2'>
                      <div className='rounded-full bg-muted p-3'>
                        <Building2 className='size-6 opacity-20' />
                      </div>
                      <span>Chưa có đơn vị nào được cấu hình.</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='space-y-6'>
          <div className='rounded-2xl border bg-background p-5 shadow-sm'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-4'>
                <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <Building2 className='size-6' />
                </div>
                <div>
                  <Label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground'>
                    Đơn vị đang thiết lập
                  </Label>
                  <div className='mt-0.5 text-lg font-bold text-foreground'>
                    {selectedOrgSummary ? formatOrgLabel(selectedOrgSummary) : 'Chọn đơn vị để bắt đầu'}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {selectedOrgSummary
                      ? `${selectedOrgRows.length} chỉ tiêu đã phân quyền`
                      : 'Chọn một đơn vị ở cột bên trái hoặc thêm phạm vi thủ công.'}
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-2'>
                <Button type='button' variant='outline' className='h-10 gap-2 rounded-xl text-xs font-bold'>
                  <Filter className='size-4' />
                  Bộ lọc nâng cao
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  className='h-10 gap-2 rounded-xl text-xs font-bold'
                  onClick={openCreateDialog}
                  disabled={!canEdit}
                >
                  <PlusCircle className='size-4' />
                  Thêm phạm vi
                </Button>
                <Button
                  type='button'
                  className='h-10 gap-2 rounded-xl text-xs font-bold'
                  onClick={() => saveMutation.mutate()}
                  disabled={!canEdit || saveMutation.isPending}
                >
                  <Save className='size-4' />
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            <Card className='overflow-hidden rounded-2xl border shadow-sm'>
              <CardHeader className='border-b bg-muted/10 pb-4 pt-5'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-base font-bold'>
                    <List className='size-4 text-muted-foreground' />
                    Chỉ tiêu chưa phân quyền
                  </CardTitle>
                  <Badge variant='outline' className='rounded-full px-2 py-0 text-[10px]'>
                    {availableIndicators.length} chỉ tiêu
                  </Badge>
                </div>
                <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-2.5 top-2.5 size-3.5 text-muted-foreground' />
                    <Input
                      placeholder='Tìm mã hoặc tên...'
                      className='h-9 rounded-lg pl-9 text-xs'
                      value={indicatorSearch}
                      onChange={(event) => setIndicatorSearch(event.target.value)}
                    />
                  </div>
                  <Button
                    type='button'
                    className='h-9 gap-2 rounded-lg bg-primary text-xs font-bold'
                    onClick={handleAssignSelected}
                    disabled={!canEdit || !selectedOrgId || selectedAvailableIds.length === 0}
                  >
                    Gán <ArrowRight className='size-4' />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/30 hover:bg-muted/30'>
                      <TableHead className='w-12 text-center'>
                        <div className='flex justify-center'>
                          <Checkbox
                            checked={
                              availableIndicators.length > 0 &&
                              selectedAvailableIds.length === availableIndicators.length
                            }
                            onCheckedChange={(checked) =>
                              setSelectedAvailableIds(checked ? availableIndicators.map((item) => item.id) : [])
                            }
                            disabled={!canEdit || !selectedOrgId || availableIndicators.length === 0}
                          />
                        </div>
                      </TableHead>
                      <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Mã chỉ tiêu
                      </TableHead>
                      <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Tên chỉ tiêu
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedOrgId ? (
                      <TableRow>
                        <TableCell colSpan={3} className='py-24 text-center text-xs text-muted-foreground'>
                          <div className='flex flex-col items-center gap-2'>
                            <div className='rounded-full bg-muted p-3'>
                              <List className='size-6 opacity-20' />
                            </div>
                            <span>Chọn đơn vị để xem danh sách</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : availableIndicators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className='py-24 text-center text-xs text-muted-foreground'>
                          <div className='flex flex-col items-center gap-2'>
                            <div className='rounded-full bg-muted p-3'>
                              <ShieldCheck className='size-6 opacity-20' />
                            </div>
                            <span>Không có chỉ tiêu nào để phân quyền</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      availableIndicators.map((item) => {
                        const isChecked = selectedAvailableIds.includes(item.id)
                        return (
                          <TableRow key={item.id} className='hover:bg-muted/10'>
                            <TableCell className='w-12 text-center'>
                              <div className='flex justify-center'>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    setSelectedAvailableIds((current) =>
                                      checked
                                        ? Array.from(new Set([...current, item.id]))
                                        : current.filter((id) => id !== item.id),
                                    )
                                  }
                                  disabled={!canEdit}
                                />
                              </div>
                            </TableCell>
                            <TableCell className='text-xs font-medium'>{item.code}</TableCell>
                            <TableCell className='text-xs'>{item.name}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className='overflow-hidden rounded-2xl border shadow-sm'>
              <CardHeader className='border-b bg-muted/10 pb-4 pt-5'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2 text-base font-bold'>
                    <ShieldCheck className='size-4 text-primary' />
                    Chỉ tiêu đã phân quyền
                  </CardTitle>
                  <Badge className='rounded-full bg-primary/10 px-2 py-0 text-[10px] text-primary hover:bg-primary/10'>
                    {selectedOrgRows.length} chỉ tiêu
                  </Badge>
                </div>
                <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
                  <div className='relative flex-1'>
                    <Search className='absolute left-2.5 top-2.5 size-3.5 text-muted-foreground' />
                    <Input
                      placeholder='Tìm mã hoặc tên...'
                      className='h-9 rounded-lg pl-9 text-xs'
                      value={indicatorSearch}
                      onChange={(event) => setIndicatorSearch(event.target.value)}
                    />
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    className='h-9 gap-2 rounded-lg border-destructive/20 text-xs font-bold text-destructive hover:bg-destructive/5'
                    onClick={handleUnassignSelected}
                    disabled={!canEdit || !selectedOrgId || selectedAssignedIds.length === 0}
                  >
                    <ArrowLeft className='size-4' />
                    Hủy gán
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='p-0'>
                <Table>
                  <TableHeader>
                    <TableRow className='bg-muted/30 hover:bg-muted/30'>
                      <TableHead className='w-12 text-center'>
                        <div className='flex justify-center'>
                          <Checkbox
                            checked={
                              assignedIndicators.length > 0 &&
                              selectedAssignedIds.length === assignedIndicators.length
                            }
                            onCheckedChange={(checked) =>
                              setSelectedAssignedIds(
                                checked
                                  ? assignedIndicators.map((item) => item.scope.indicatorId)
                                  : [],
                              )
                            }
                            disabled={!canEdit || !selectedOrgId || assignedIndicators.length === 0}
                          />
                        </div>
                      </TableHead>
                      <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Mã chỉ tiêu
                      </TableHead>
                      <TableHead className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Tên chỉ tiêu
                      </TableHead>
                      <TableHead className='w-24 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedOrgId ? (
                      <TableRow>
                        <TableCell colSpan={4} className='py-24 text-center text-xs text-muted-foreground'>
                          <div className='flex flex-col items-center gap-2'>
                            <div className='rounded-full bg-primary/5 p-3 text-primary/30'>
                              <ShieldCheck className='size-6' />
                            </div>
                            <span>Chọn đơn vị để xem danh sách</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : assignedIndicators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className='py-24 text-center text-xs text-muted-foreground'>
                          <div className='flex flex-col items-center gap-2'>
                            <div className='rounded-full bg-primary/5 p-3 text-primary/30'>
                              <ShieldCheck className='size-6' />
                            </div>
                            <span>Chưa có chỉ tiêu nào được gán cho đơn vị này</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignedIndicators.map(({ scope, indicator }) => {
                        const rowKey = scopeKey(scope.orgId, scope.indicatorId)
                        const isChecked = selectedAssignedIds.includes(scope.indicatorId)
                        return (
                          <TableRow key={rowKey} className='hover:bg-muted/10'>
                            <TableCell className='w-12 text-center'>
                              <div className='flex justify-center'>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    setSelectedAssignedIds((current) =>
                                      checked
                                        ? Array.from(new Set([...current, scope.indicatorId]))
                                        : current.filter((id) => id !== scope.indicatorId),
                                    )
                                  }
                                  disabled={!canEdit}
                                />
                              </div>
                            </TableCell>
                            <TableCell className='text-xs font-medium'>
                              {indicator?.code ?? scope.indicatorCode ?? scope.indicatorId}
                            </TableCell>
                            <TableCell className='text-xs'>
                              {indicator?.name ?? scope.indicatorName ?? '--'}
                            </TableCell>
                            <TableCell className='px-2 text-right'>
                              <div className='inline-flex gap-2'>
                                <Button
                                  type='button'
                                  size='icon'
                                  variant='outline'
                                  className='h-8 w-8'
                                  onClick={() => openEditDialog(scope)}
                                  disabled={!canEdit}
                                >
                                  <UserPen className='size-4' />
                                </Button>
                                <Button
                                  type='button'
                                  size='icon'
                                  variant='destructive'
                                  className='h-8 w-8'
                                  onClick={() => removeScopeByKey(rowKey)}
                                  disabled={!canEdit}
                                >
                                  <Trash2 className='size-4' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
</CardContent>
      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader className='text-start'>
            <DialogTitle>{editingScopeKey === null ? 'Thêm phạm vi' : 'Sửa phạm vi'}</DialogTitle>
            <DialogDescription>
              Thiết lập đơn vị và chỉ tiêu sẽ được gán vào biểu mẫu.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4'>
            <div className='space-y-2'>
              <Label>Mã đơn vị</Label>
              <Input
                value={scopeForm.orgId}
                onChange={(event) => setScopeForm((prev) => ({ ...prev, orgId: event.target.value }))}
                placeholder='Ví dụ: PTCN-01'
              />
            </div>

            <div className='space-y-2'>
              <Label>Tên đơn vị</Label>
              <Input
                value={scopeForm.orgName}
                onChange={(event) => setScopeForm((prev) => ({ ...prev, orgName: event.target.value }))}
                placeholder='Ví dụ: Phòng Tài chính'
              />
            </div>

            <div className='space-y-2'>
              <Label>Chỉ tiêu</Label>
              <Select
                value={scopeForm.indicatorId}
                onValueChange={(value) => setScopeForm((prev) => ({ ...prev, indicatorId: value }))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn chỉ tiêu' />
                </SelectTrigger>
                <SelectContent>
                  {indicators.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {formatIndicatorLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={closeDialog}>
              Hủy
            </Button>
            <Button onClick={submitScopeForm}>
              <Save className='size-4' />
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
