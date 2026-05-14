import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  List,
  Save,
  Search,
  ShieldCheck,
  AlertCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formManagementApi,
  type OrgTreeItem,
} from '../../../form-management/api/template-management-api'
import type { TemplateIndicator } from '../../../form-management/api/types'
import { reportCampaignApi } from '../../api/report-management-api'
import type { CampaignScope } from '../../api/types'

type CampaignScopesTabProps = {
  campaignId: string
  templateId: string
}

function scopeKey(orgId: string, indicatorId: string) {
  return `${orgId}::${indicatorId}`
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

function dedupeScopes(items: CampaignScope[]) {
  const seen = new Map<string, CampaignScope>()
  items.forEach((item) => {
    const orgId = item.orgId.trim()
    const indicatorId = item.indicatorId.trim()
    if (!orgId || !indicatorId) return
    const key = scopeKey(orgId, indicatorId)
    if (seen.has(key)) return
    seen.set(key, { ...item, orgId, indicatorId })
  })
  return Array.from(seen.values())
}

type IndicatorTreeNode = TemplateIndicator & {
  children: IndicatorTreeNode[]
}

export function CampaignScopesTab({
  campaignId,
  templateId,
}: CampaignScopesTabProps) {
  const queryClient = useQueryClient()
  const [draftRows, setDraftRows] = useState<CampaignScope[] | null>(null)
  const [orgSearch, setOrgSearch] = useState('')
  const [indicatorSearch, setIndicatorSearch] = useState('')
  const [selectedOrgIdState, setSelectedOrgId] = useState<string | null>(null)
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([])
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const campaignQuery = useQuery({
    queryKey: ['report-management', 'campaign', campaignId],
    queryFn: () => reportCampaignApi.getCampaign(campaignId),
    enabled: Boolean(campaignId),
  })

  const scopesQuery = useQuery({
    queryKey: ['report-management', 'campaign', campaignId, 'scopes'],
    queryFn: () => reportCampaignApi.listScopes(campaignId),
    enabled: Boolean(campaignId),
  })

  const initialRows = useMemo(
    () => dedupeScopes(scopesQuery.data ?? []),
    [scopesQuery.data]
  )

  const templateQuery = useQuery({
    queryKey: ['form-management', 'template', templateId, 'scopes-tab'],
    queryFn: () => formManagementApi.getTemplate(templateId),
    enabled: Boolean(templateId),
  })

  const orgTreeQuery = useQuery({
    queryKey: ['orgs', 'tree'],
    queryFn: () => formManagementApi.getOrgTree(),
  })

  const campaign = campaignQuery.data ?? null
  const template = templateQuery.data ?? null
  const indicators = useMemo(
    () => template?.indicators ?? [],
    [template?.indicators]
  )
  const canEdit = Boolean(campaign && campaign.status === 'DRAFT')
  const isUnique = template?.templateType === 'UNIQUE'

  const flatOrgs = useMemo(() => {
    const orgTree = orgTreeQuery.data ?? []
    const result: OrgTreeItem[] = []
    const traverse = (nodes: OrgTreeItem[]) => {
      for (const node of nodes) {
        result.push(node)
        if (node.children) traverse(node.children)
      }
    }
    traverse(orgTree)
    return result
  }, [orgTreeQuery.data])

  const selectedOrgId = useMemo(() => {
    if (flatOrgs.length === 0) return null
    if (
      selectedOrgIdState &&
      flatOrgs.some(
        (item) => item.id === selectedOrgIdState && item.canAssignReports
      )
    ) {
      return selectedOrgIdState
    }
    const firstValid = flatOrgs.find((o) => o.canAssignReports)
    return firstValid ? firstValid.id : null
  }, [flatOrgs, selectedOrgIdState])

  const rows = draftRows ?? initialRows

  const selectedOrgSummary = useMemo(
    () => flatOrgs.find((item) => item.id === selectedOrgId) ?? null,
    [flatOrgs, selectedOrgId]
  )

  const selectedOrgRows = useMemo(
    () => rows.filter((item) => item.orgId === selectedOrgId),
    [rows, selectedOrgId]
  )

  const selectedOrgIndicatorIds = useMemo(
    () => new Set(selectedOrgRows.map((item) => item.indicatorId)),
    [selectedOrgRows]
  )

  const orgByIndicatorId = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((r) => map.set(r.indicatorId, r.orgId))
    return map
  }, [rows])

  const filteredOrgs = useMemo(() => {
    const keyword = normalizeText(orgSearch)
    if (!keyword) return flatOrgs
    return flatOrgs.filter((item) => {
      return [item.code, item.name]
        .filter(Boolean)
        .some((value) => normalizeText(value).includes(keyword))
    })
  }, [orgSearch, flatOrgs])

  const indicatorTree = useMemo(() => {
    const map = new Map<string, IndicatorTreeNode>()
    indicators.forEach((i) => map.set(i.id, { ...i, children: [] }))

    const roots: IndicatorTreeNode[] = []
    indicators.forEach((i) => {
      if (i.parentId && map.has(i.parentId)) {
        map.get(i.parentId)!.children.push(map.get(i.id)!)
      } else {
        roots.push(map.get(i.id)!)
      }
    })

    const sortNodes = (nodes: IndicatorTreeNode[]) => {
      // nodes.sort((a, b) => a.order - b.order)
      nodes.forEach((n) => sortNodes(n.children))
    }
    sortNodes(roots)
    return roots
  }, [indicators])

  const flatIndicators = useMemo(() => {
    const result: (IndicatorTreeNode & { depth?: number })[] = []
    const traverse = (nodes: IndicatorTreeNode[], currentDepth: number) => {
      for (const node of nodes) {
        result.push({ ...node, depth: currentDepth })
        if (node.children) traverse(node.children, currentDepth + 1)
      }
    }
    traverse(indicatorTree, 1)
    return result
  }, [indicatorTree])

  const availableIndicators = useMemo(() => {
    if (!selectedOrgId) return []
    const keyword = normalizeText(indicatorSearch)

    return flatIndicators.filter((indicator) => {
      if (
        indicator.type === 'INPUT' &&
        selectedOrgIndicatorIds.has(indicator.id)
      )
        return false
      if (keyword) {
        return [indicator.code, indicator.name]
          .filter(Boolean)
          .some((value) => normalizeText(value).includes(keyword))
      }
      return true
    })
  }, [indicatorSearch, flatIndicators, selectedOrgId, selectedOrgIndicatorIds])

  const assignedIndicators = useMemo(() => {
    if (!selectedOrgId) return []
    const keyword = normalizeText(indicatorSearch)

    return flatIndicators.filter((indicator) => {
      if (
        indicator.type === 'INPUT' &&
        !selectedOrgIndicatorIds.has(indicator.id)
      )
        return false
      // For TITLE, keep them if they match search or we just show the whole assigned tree structure
      if (keyword) {
        return [indicator.code, indicator.name]
          .filter(Boolean)
          .some((value) => normalizeText(value).includes(keyword))
      }
      return true
    })
  }, [indicatorSearch, flatIndicators, selectedOrgId, selectedOrgIndicatorIds])

  // Progress computation
  const totalInputIndicators = indicators.filter(
    (i) => i.type === 'INPUT'
  ).length
  const assignedInputIndicatorsCount = new Set(
    rows
      .map((r) => r.indicatorId)
      .filter((id) => {
        const ind = indicators.find((i) => i.id === id)
        return ind && ind.type === 'INPUT'
      })
  ).size
  const progressPercent = totalInputIndicators
    ? Math.round((assignedInputIndicatorsCount / totalInputIndicators) * 100)
    : 0

  const hasChanges = useMemo(() => {
    const initial = initialRows
      .map((s) => `${s.orgId}::${s.indicatorId}`)
      .sort()
    const current = dedupeScopes(rows)
      .map((s) => `${s.orgId}::${s.indicatorId}`)
      .sort()
    return JSON.stringify(initial) !== JSON.stringify(current)
  }, [initialRows, rows])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const initial = initialRows
      const current = dedupeScopes(rows).filter(
        (item) => item.orgId.trim() && item.indicatorId.trim()
      )

      const initialKeys = new Set(
        initial.map((s) => `${s.orgId}::${s.indicatorId}`)
      )
      const currentKeys = new Set(
        current.map((s) => `${s.orgId}::${s.indicatorId}`)
      )

      const added = current.filter(
        (s) => !initialKeys.has(`${s.orgId}::${s.indicatorId}`)
      )
      const removed = initial.filter(
        (s) => !currentKeys.has(`${s.orgId}::${s.indicatorId}`)
      )

      if (added.length > 0) {
        await reportCampaignApi.upsertScopes(
          campaignId,
          added.map((i) => ({ orgId: i.orgId, indicatorId: i.indicatorId }))
        )
      }
      if (removed.length > 0) {
        await reportCampaignApi.deleteScopes(
          campaignId,
          removed.map((i) => ({ orgId: i.orgId, indicatorId: i.indicatorId }))
        )
      }
    },
    onSuccess: async () => {
      toast.success('Đã lưu phạm vi phân bổ chỉ tiêu.')
      setDraftRows(null)
      setSelectedAvailableIds([])
      setSelectedAssignedIds([])
      await queryClient.invalidateQueries({
        queryKey: ['report-management', 'campaign', campaignId, 'scopes'],
      })
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function handleAssignSelected() {
    if (!selectedOrgId) {
      toast.error('Chọn đơn vị trước khi gán chỉ tiêu.')
      return
    }
    if (selectedAvailableIds.length === 0) return

    setDraftRows((current) => {
      const next = [...dedupeScopes(current ?? initialRows)]
      selectedAvailableIds.forEach((indicatorId) => {
        if (
          next.some(
            (item) =>
              item.orgId === selectedOrgId && item.indicatorId === indicatorId
          )
        ) {
          return
        }
        next.push({
          orgId: selectedOrgId,
          indicatorId,
        })
      })
      return dedupeScopes(next)
    })
    setSelectedAvailableIds([])
  }

  function handleUnassignSelected() {
    if (!selectedOrgId || selectedAssignedIds.length === 0) return
    setDraftRows((current) =>
      (current ?? initialRows).filter(
        (item) =>
          !(
            item.orgId === selectedOrgId &&
            selectedAssignedIds.includes(item.indicatorId)
          )
      )
    )
    setSelectedAssignedIds([])
  }

  function getAvailableDescendantInputs(node: IndicatorTreeNode): string[] {
    let ids: string[] = []
    if (node.type === 'INPUT') {
      const assignedToOther =
        isUnique &&
        orgByIndicatorId.has(node.id) &&
        orgByIndicatorId.get(node.id) !== selectedOrgId
      if (
        availableIndicators.some((i) => i.id === node.id) &&
        !assignedToOther
      ) {
        ids.push(node.id)
      }
    }
    for (const child of node.children) {
      ids = ids.concat(getAvailableDescendantInputs(child))
    }
    return ids
  }

  function getAssignedDescendantInputs(node: IndicatorTreeNode): string[] {
    let ids: string[] = []
    if (node.type === 'INPUT') {
      if (
        assignedIndicators.some((i) => i.id === node.id) &&
        selectedOrgIndicatorIds.has(node.id)
      ) {
        ids.push(node.id)
      }
    }
    for (const child of node.children) {
      ids = ids.concat(getAssignedDescendantInputs(child))
    }
    return ids
  }

  if (!campaign || !template) {
    return (
      <div className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
        Chưa tải được thông tin đợt báo cáo để cấu hình.
      </div>
    )
  }

  const wrapperClass = isFullscreen
    ? 'fixed inset-0 z-[100] flex flex-col bg-background overflow-hidden rounded-none border-0'
    : 'rounded-3xl'

  const contentClass = isFullscreen
    ? 'flex-1 overflow-auto p-6 space-y-3'
    : 'space-y-3'

  return (
    <Card className={wrapperClass}>
      <CardHeader className='gap-4'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Chỉ tiêu</CardTitle>
            <CardDescription>
              Phân bổ chỉ tiêu cho các đơn vị tham gia báo cáo.
            </CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              className='gap-2 rounded-xl px-3 text-xs font-bold'
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Thu nhỏ' : 'Mở rộng toàn màn hình'}
            >
              {isFullscreen ? (
                <Minimize2 className='size-4' />
              ) : (
                <Maximize2 className='size-4' />
              )}
              {isFullscreen ? 'Thu nhỏ' : 'Phóng to'}
            </Button>
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

      <CardContent className={contentClass}>
        <div className='mb-6 rounded-2xl border bg-muted/20 p-4'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-sm font-bold text-foreground'>
              Tiến độ phân bổ chỉ tiêu
            </span>
            <span
              className={`text-sm font-bold ${progressPercent === 100 ? 'text-primary' : 'text-amber-500'}`}
            >
              {assignedInputIndicatorsCount} / {totalInputIndicators} (
              {progressPercent}%)
            </span>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className={`h-full transition-all duration-500 ${progressPercent === 100 ? 'bg-primary' : 'bg-amber-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent < 100 && (
            <p className='mt-2 flex items-center gap-1 text-xs text-amber-600'>
              <AlertCircle className='size-3' />
              Cần phân bổ 100% chỉ tiêu INPUT trước khi có thể chuyển biểu mẫu
              sang trạng thái Sẵn sàng.
            </p>
          )}
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]'>
          <div>
            <Card className='overflow-hidden rounded-2xl border shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base font-bold'>
                  Đơn vị áp dụng
                </CardTitle>
                <CardDescription className='text-xs'>
                  Chọn đơn vị để xem và thiết lập phạm vi chỉ tiêu.
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                <div className='border-y bg-muted/20 px-4 py-3'>
                  <div className='relative'>
                    <Search className='absolute top-2.5 left-2.5 size-4 text-muted-foreground' />
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
                        const isSelected = selectedOrgId === item.id
                        const canAssign = item.canAssignReports
                        return (
                          <button
                            key={item.id}
                            type='button'
                            disabled={!canAssign}
                            className={[
                              'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                              isSelected
                                ? 'bg-primary/10 font-bold text-primary'
                                : canAssign
                                  ? 'font-medium text-foreground hover:bg-muted/50'
                                  : 'cursor-not-allowed opacity-40',
                            ].join(' ')}
                            onClick={() => {
                              if (!canAssign) return
                              setSelectedOrgId(item.id)
                              setSelectedAvailableIds([])
                              setSelectedAssignedIds([])
                            }}
                          >
                            <div
                              style={{
                                paddingLeft: `${(item.level - 1) * 12}px`,
                              }}
                              className='flex items-center gap-2 overflow-hidden'
                            >
                              <Building2
                                className={
                                  isSelected
                                    ? 'size-4 shrink-0 text-primary'
                                    : 'size-4 shrink-0 text-muted-foreground'
                                }
                              />
                              <span className='min-w-0 truncate'>
                                {item.code} - {item.name}
                              </span>
                            </div>
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
              <div className='flex items-center gap-4'>
                <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                  <Building2 className='size-6' />
                </div>
                <div>
                  <Label className='text-[10px] font-bold tracking-widest text-muted-foreground uppercase'>
                    Đơn vị đang thiết lập
                  </Label>
                  <div className='mt-0.5 text-lg font-bold text-foreground'>
                    {selectedOrgSummary
                      ? `${selectedOrgSummary.code} - ${selectedOrgSummary.name}`
                      : 'Chọn đơn vị để bắt đầu'}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {selectedOrgSummary
                      ? `${selectedOrgRows.length} chỉ tiêu đã phân quyền`
                      : 'Chọn một đơn vị ở cột bên trái.'}
                  </div>
                </div>
              </div>
            </div>

            <div className='grid gap-6 xl:grid-cols-2'>
              <Card className='overflow-hidden rounded-2xl border shadow-sm'>
                <CardHeader className='border-b bg-muted/10 pt-5 pb-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2 text-base font-bold'>
                      <List className='size-4 text-muted-foreground' />
                      Chưa phân quyền
                    </CardTitle>
                  </div>
                  <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
                    <div className='relative flex-1'>
                      <Search className='absolute top-2.5 left-2.5 size-3.5 text-muted-foreground' />
                      <Input
                        placeholder='Tìm mã hoặc tên...'
                        className='h-9 rounded-lg pl-9 text-xs'
                        value={indicatorSearch}
                        onChange={(event) =>
                          setIndicatorSearch(event.target.value)
                        }
                      />
                    </div>
                    <Button
                      type='button'
                      className='h-9 gap-2 rounded-lg bg-primary text-xs font-bold'
                      onClick={handleAssignSelected}
                      disabled={
                        !canEdit ||
                        !selectedOrgId ||
                        selectedAvailableIds.length === 0
                      }
                    >
                      Gán <ArrowRight className='size-4' />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='max-h-[500px] overflow-auto p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-muted/30 hover:bg-muted/30'>
                        <TableHead className='w-12 text-center'></TableHead>
                        <TableHead className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                          Chỉ tiêu
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!selectedOrgId ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className='py-12 text-center text-xs text-muted-foreground'
                          >
                            Chọn đơn vị để xem danh sách
                          </TableCell>
                        </TableRow>
                      ) : availableIndicators.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className='py-12 text-center text-xs text-muted-foreground'
                          >
                            Không có chỉ tiêu nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        availableIndicators.map((item) => {
                          const isInput = item.type === 'INPUT'
                          const assignedToOtherOrg =
                            isUnique &&
                            isInput &&
                            orgByIndicatorId.has(item.id) &&
                            orgByIndicatorId.get(item.id) !== selectedOrgId
                          const otherOrgId = assignedToOtherOrg
                            ? orgByIndicatorId.get(item.id)
                            : null
                          const otherOrgName = otherOrgId
                            ? flatOrgs.find((o) => o.id === otherOrgId)?.name
                            : null

                          const descendantInputIds =
                            getAvailableDescendantInputs(item)
                          const canCheck = isInput
                            ? !assignedToOtherOrg
                            : descendantInputIds.length > 0
                          const allSelected =
                            descendantInputIds.length > 0 &&
                            descendantInputIds.every((id) =>
                              selectedAvailableIds.includes(id)
                            )
                          const someSelected =
                            descendantInputIds.length > 0 &&
                            descendantInputIds.some((id) =>
                              selectedAvailableIds.includes(id)
                            )

                          const isChecked = isInput
                            ? selectedAvailableIds.includes(item.id)
                            : allSelected

                          return (
                            <TableRow
                              key={item.id}
                              className='hover:bg-muted/10'
                            >
                              <TableCell className='w-12 text-center'>
                                <div className='flex justify-center'>
                                  <Checkbox
                                    checked={
                                      isInput
                                        ? isChecked
                                        : allSelected
                                          ? true
                                          : someSelected
                                            ? 'indeterminate'
                                            : false
                                    }
                                    onCheckedChange={(checked) => {
                                      if (isInput) {
                                        setSelectedAvailableIds((prev) =>
                                          checked
                                            ? [...prev, item.id]
                                            : prev.filter(
                                                (id) => id !== item.id
                                              )
                                        )
                                      } else {
                                        setSelectedAvailableIds((prev) =>
                                          checked
                                            ? Array.from(
                                                new Set([
                                                  ...prev,
                                                  ...descendantInputIds,
                                                ])
                                              )
                                            : prev.filter(
                                                (id) =>
                                                  !descendantInputIds.includes(
                                                    id
                                                  )
                                              )
                                        )
                                      }
                                    }}
                                    disabled={!canEdit || !canCheck}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div
                                  style={{
                                    paddingLeft: `${((item.depth || 1) - 1) * 16}px`,
                                  }}
                                  className='flex flex-col gap-0.5'
                                >
                                  <div
                                    className={`text-xs ${isInput ? 'font-medium' : 'font-bold'} flex items-center gap-2`}
                                  >
                                    {item.code} - {item.name}
                                    {item.type === 'TITLE' && (
                                      <Badge
                                        variant='outline'
                                        className='px-1 py-0 text-[9px]'
                                      >
                                        Nhóm
                                      </Badge>
                                    )}
                                  </div>
                                  {assignedToOtherOrg && (
                                    <div className='mt-1 flex items-center gap-1 text-[10px] text-destructive'>
                                      <AlertCircle className='size-3' /> Đã giao
                                      cho: {otherOrgName || otherOrgId}
                                    </div>
                                  )}
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

              <Card className='overflow-hidden rounded-2xl border shadow-sm'>
                <CardHeader className='border-b bg-muted/10 pt-5 pb-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2 text-base font-bold'>
                      <ShieldCheck className='size-4 text-primary' />
                      Đã phân quyền
                    </CardTitle>
                    <Badge className='rounded-full bg-primary/10 px-2 py-0 text-[10px] text-primary hover:bg-primary/10'>
                      {selectedOrgRows.length} chỉ tiêu
                    </Badge>
                  </div>
                  <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
                    <div className='relative flex-1'>
                      <Search className='absolute top-2.5 left-2.5 size-3.5 text-muted-foreground' />
                      <Input
                        placeholder='Tìm mã hoặc tên...'
                        className='h-9 rounded-lg pl-9 text-xs'
                        value={indicatorSearch}
                        onChange={(event) =>
                          setIndicatorSearch(event.target.value)
                        }
                      />
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      className='h-9 gap-2 rounded-lg border-destructive/20 text-xs font-bold text-destructive hover:bg-destructive/5'
                      onClick={handleUnassignSelected}
                      disabled={
                        !canEdit ||
                        !selectedOrgId ||
                        selectedAssignedIds.length === 0
                      }
                    >
                      <ArrowLeft className='size-4' />
                      Hủy gán
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className='max-h-[500px] overflow-auto p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-muted/30 hover:bg-muted/30'>
                        <TableHead className='w-12 text-center'></TableHead>
                        <TableHead className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                          Chỉ tiêu
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!selectedOrgId ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className='py-12 text-center text-xs text-muted-foreground'
                          >
                            Chọn đơn vị để xem danh sách
                          </TableCell>
                        </TableRow>
                      ) : assignedIndicators.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className='py-12 text-center text-xs text-muted-foreground'
                          >
                            Chưa có chỉ tiêu nào được gán
                          </TableCell>
                        </TableRow>
                      ) : (
                        assignedIndicators.map((item) => {
                          const isInput = item.type === 'INPUT'
                          const descendantInputIds =
                            getAssignedDescendantInputs(item)
                          const canCheck = isInput
                            ? true
                            : descendantInputIds.length > 0
                          const allSelected =
                            descendantInputIds.length > 0 &&
                            descendantInputIds.every((id) =>
                              selectedAssignedIds.includes(id)
                            )
                          const someSelected =
                            descendantInputIds.length > 0 &&
                            descendantInputIds.some((id) =>
                              selectedAssignedIds.includes(id)
                            )

                          const isChecked = isInput
                            ? selectedAssignedIds.includes(item.id)
                            : allSelected

                          return (
                            <TableRow
                              key={item.id}
                              className='hover:bg-muted/10'
                            >
                              <TableCell className='w-12 text-center'>
                                <div className='flex justify-center'>
                                  <Checkbox
                                    checked={
                                      isInput
                                        ? isChecked
                                        : allSelected
                                          ? true
                                          : someSelected
                                            ? 'indeterminate'
                                            : false
                                    }
                                    onCheckedChange={(checked) => {
                                      if (isInput) {
                                        setSelectedAssignedIds((prev) =>
                                          checked
                                            ? [...prev, item.id]
                                            : prev.filter(
                                                (id) => id !== item.id
                                              )
                                        )
                                      } else {
                                        setSelectedAssignedIds((prev) =>
                                          checked
                                            ? Array.from(
                                                new Set([
                                                  ...prev,
                                                  ...descendantInputIds,
                                                ])
                                              )
                                            : prev.filter(
                                                (id) =>
                                                  !descendantInputIds.includes(
                                                    id
                                                  )
                                              )
                                        )
                                      }
                                    }}
                                    disabled={!canEdit || !canCheck}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div
                                  style={{
                                    paddingLeft: `${((item.depth || 1) - 1) * 16}px`,
                                  }}
                                  className='flex flex-col gap-0.5'
                                >
                                  <div
                                    className={`text-xs ${isInput ? 'font-medium' : 'font-bold'}`}
                                  >
                                    {item.code} - {item.name}
                                    {item.type === 'TITLE' && (
                                      <Badge
                                        variant='outline'
                                        className='ml-2 px-1 py-0 text-[9px]'
                                      >
                                        Nhóm
                                      </Badge>
                                    )}
                                  </div>
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
    </Card>
  )
}
