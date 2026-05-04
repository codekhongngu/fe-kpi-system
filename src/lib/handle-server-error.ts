import { AxiosError } from 'axios'
import { toast } from 'sonner'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = 'Đã xảy ra lỗi.'

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'Không tìm thấy dữ liệu.'
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data
    if (typeof data === 'string' && data.trim()) {
      errMsg = data
    } else if (isRecord(data)) {
      const message = typeof data.message === 'string' ? data.message : ''
      const title = typeof data.title === 'string' ? data.title : ''
      errMsg = message || title || errMsg
    }
  }

  toast.error(errMsg)
}
