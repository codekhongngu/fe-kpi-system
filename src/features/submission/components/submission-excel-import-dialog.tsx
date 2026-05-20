import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formManagementApi } from '@/features/form-management/api/template-management-api'
import type { FormTemplate } from '@/features/form-management/api/types'
import type { CellChange, SubmissionDetail } from '../api/types'
import { SubmissionGrid } from './submission-grid'
import {
  buildExcelImportInvalidCellKeys,
  downloadSubmissionExcelTemplate,
  mergeSubmissionDetailForExcelPreview,
  parseSubmissionExcelFile,
  type SubmissionExcelParseResult,
} from '../utils/submission-excel'

type SubmissionExcelImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: FormTemplate
  detail: SubmissionDetail
  formName: string
  periodCode: string
  isReadOnly: boolean
  onApply: (changes: CellChange[]) => void
}

function buildTemplateFileName(formName: string, periodCode: string) {
  const safe = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)

  return `Bao-cao-${safe(formName)}-${safe(periodCode)}.xlsx`
}

export function SubmissionExcelImportDialog({
  open,
  onOpenChange,
  template,
  detail,
  formName,
  periodCode,
  isReadOnly,
  onApply,
}: SubmissionExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseResult, setParseResult] = useState<SubmissionExcelParseResult | null>(
    null
  )

  const effectiveCellConfigsQuery = useQuery({
    queryKey: [
      'form-management',
      'template',
      template.id,
      'cell-configs',
      'effective',
    ],
    queryFn: () => formManagementApi.listEffectiveCellConfigs(template.id),
    enabled: open && Boolean(template.id),
  })

  const previewDetail = useMemo(() => {
    if (!parseResult) return null
    if (
      parseResult.changes.length === 0 &&
      parseResult.invalidCells.length === 0
    ) {
      return null
    }
    return mergeSubmissionDetailForExcelPreview(
      detail,
      parseResult.changes,
      parseResult.invalidCells
    )
  }, [detail, parseResult])

  const importInvalidCellKeys = useMemo(
    () =>
      parseResult
        ? buildExcelImportInvalidCellKeys(parseResult.invalidCells)
        : undefined,
    [parseResult]
  )

  const resetState = () => {
    setSelectedFile(null)
    setParseResult(null)
    setIsParsing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetState()
    onOpenChange(next)
  }

  const handleDownloadTemplate = () => {
    downloadSubmissionExcelTemplate(
      template,
      detail,
      buildTemplateFileName(formName, periodCode)
    )
    toast.success('Đã tải file mẫu Excel.')
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsParsing(true)
    setParseResult(null)

    try {
      let cellConfigs = effectiveCellConfigsQuery.data
      if (!cellConfigs && template.id) {
        cellConfigs = await formManagementApi.listEffectiveCellConfigs(template.id)
      }

      const result = await parseSubmissionExcelFile(
        file,
        template,
        cellConfigs,
        detail
      )
      setParseResult(result)

      if (result.structureErrors.length > 0) {
        toast.error(
          'File Excel thiếu chỉ tiêu hoặc cột thuộc tính so với biểu mẫu — không thể áp dụng.'
        )
      } else if (result.errors.length > 0 && result.changes.length > 0) {
        toast.warning(
          `${result.matchedCells} ô hợp lệ, ${result.errors.length} ô lỗi (xem trước ô đỏ).`
        )
      } else if (result.errors.length > 0) {
        toast.error(`Có ${result.errors.length} ô không hợp lệ trong tệp Excel.`)
      } else if (result.changes.length > 0) {
        toast.success(`Đã đọc ${result.matchedCells} ô dữ liệu. Xem trước bên dưới.`)
      }
    } catch {
      toast.error('Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng.')
      setParseResult(null)
    } finally {
      setIsParsing(false)
    }
  }

  const handleConfirm = () => {
    if (!parseResult?.changes.length) return
    if (parseResult.structureErrors.length > 0) return
    onApply(parseResult.changes)
    toast.success(`Đã áp dụng ${parseResult.changes.length} ô vào báo cáo.`)
    handleOpenChange(false)
  }

  const canConfirm =
    Boolean(parseResult?.changes.length) &&
    (parseResult?.structureErrors.length ?? 0) === 0 &&
    !isReadOnly

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl'
        showCloseButton={!isParsing}
      >
        <DialogHeader className='shrink-0 border-b px-6 py-4 text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <FileSpreadsheet className='size-5 text-primary' />
            Nhập dữ liệu từ Excel
          </DialogTitle>
          <DialogDescription>
            Tải file mẫu theo đúng danh sách chỉ tiêu và thuộc tính của biểu mẫu,
            nhập số liệu rồi tải lên để xem trước trước khi áp dụng.
          </DialogDescription>
        </DialogHeader>

        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4'>
          <div className='flex flex-wrap items-center gap-2'>
            <Button type='button' variant='outline' onClick={handleDownloadTemplate}>
              <Download className='mr-2 size-4' />
              Tải file mẫu Excel
            </Button>
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              accept='.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
              onChange={handleFileSelected}
            />
            <Button
              type='button'
              variant='secondary'
              disabled={isReadOnly || isParsing}
              onClick={() => fileInputRef.current?.click()}
            >
              {isParsing ? (
                <Loader2 className='mr-2 size-4 animate-spin' />
              ) : (
                <Upload className='mr-2 size-4' />
              )}
              {isParsing ? 'Đang đọc tệp...' : 'Chọn tệp Excel'}
            </Button>
            {selectedFile ? (
              <span className='text-sm text-muted-foreground'>{selectedFile.name}</span>
            ) : null}
          </div>

          {parseResult ? (
            <div className='space-y-3'>
              <div className='flex flex-wrap gap-3 text-sm'>
                <span className='rounded-md bg-green-50 px-2 py-1 text-green-800'>
                  Khớp: {parseResult.matchedCells} ô
                </span>
                <span className='rounded-md bg-muted px-2 py-1 text-muted-foreground'>
                  Bỏ qua: {parseResult.skippedCells} ô
                </span>
                {parseResult.structureErrors.length > 0 ? (
                  <span className='rounded-md border border-red-400 bg-red-100 px-2 py-1 font-semibold text-red-900'>
                    Thiếu cấu trúc file
                  </span>
                ) : null}
                {parseResult.invalidCells.length > 0 ? (
                  <span className='rounded-md border border-red-300 bg-red-100 px-2 py-1 font-medium text-red-900'>
                    Lỗi (ô đỏ viền đậm): {parseResult.invalidCells.length} ô
                  </span>
                ) : null}
              </div>

              {parseResult.structureErrors.length > 0 ? (
                <Alert variant='destructive'>
                  <AlertTitle>
                    File Excel không đủ chỉ tiêu hoặc thuộc tính — không thể áp dụng
                  </AlertTitle>
                  <AlertDescription>
                    <p className='text-sm'>
                      Tệp phải giữ đủ các dòng chỉ tiêu (mã) và cột thuộc tính như file
                      mẫu. Vui lòng tải lại file mẫu và nhập đủ trước khi tải lên.
                    </p>
                    <ul className='mt-2 max-h-28 list-disc space-y-1 overflow-y-auto pl-4 text-sm'>
                      {parseResult.structureErrors.map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {parseResult.structureErrors.length === 0 &&
              parseResult.errors.length > 0 ? (
                <Alert variant='destructive'>
                  <AlertTitle>
                    {parseResult.changes.length > 0
                      ? `${parseResult.errors.length} ô không hợp lệ (ô đỏ trong xem trước) — chỉ áp dụng ô hợp lệ`
                      : 'Không thể áp dụng do lỗi đọc dữ liệu'}
                  </AlertTitle>
                  <AlertDescription>
                    <ul className='mt-2 max-h-28 list-disc space-y-1 overflow-y-auto pl-4 text-sm'>
                      {parseResult.errors.slice(0, 20).map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {parseResult.warnings.length > 0 ? (
                <Alert>
                  <AlertTitle>Cảnh báo</AlertTitle>
                  <AlertDescription>
                    <ul className='mt-2 max-h-24 list-disc space-y-1 overflow-y-auto pl-4 text-sm'>
                      {parseResult.warnings.slice(0, 15).map((msg) => (
                        <li key={msg}>{msg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

          {previewDetail ? (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold'>
                Xem trước (giống giao diện nhập liệu)
                {parseResult?.invalidCells.length ? (
                  <span className='ml-2 text-xs font-semibold text-red-700'>
                    — ô viền đỏ đậm + biểu tượng cảnh báo = không hợp lệ
                  </span>
                ) : null}
              </h3>
              <div className='rounded-md border bg-white'>
                {effectiveCellConfigsQuery.isLoading &&
                !effectiveCellConfigsQuery.data ? (
                  <div className='flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground'>
                    <Loader2 className='size-4 animate-spin' />
                    Đang tải cấu hình lưới...
                  </div>
                ) : (
                  <SubmissionGrid
                    template={template}
                    detail={previewDetail}
                    isReadOnly
                    previewMode
                    effectiveCellConfigs={effectiveCellConfigsQuery.data}
                    importInvalidCellKeys={importInvalidCellKeys}
                    onCellChange={() => undefined}
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className='shrink-0 gap-2 border-t px-6 py-4 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isParsing}
          >
            Đóng
          </Button>
          <Button
            type='button'
            onClick={handleConfirm}
            disabled={!canConfirm || isParsing}
          >
            {parseResult?.structureErrors.length
              ? 'Không thể áp dụng'
              : parseResult?.errors.length
                ? `Áp dụng ${parseResult.changes.length} ô hợp lệ`
                : 'Áp dụng vào báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
