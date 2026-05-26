const ERROR_CODE_MESSAGES: Record<string, string> = {
  FIELD_CATEGORY_CODE_DUPLICATE:
    'Mã lĩnh vực đã tồn tại. Vui lòng chọn mã khác.',
  FIELD_CATEGORY_NOT_FOUND: 'Không tìm thấy lĩnh vực.',
  FIELD_CATEGORY_IN_USE:
    'Không thể xóa lĩnh vực đang được sử dụng bởi biểu mẫu.',

  TEMPLATE_CODE_DUPLICATE:
    'Mã biểu mẫu đã tồn tại. Vui lòng chọn mã khác.',
  FORM_CODE_DUPLICATE:
    'Mã biểu mẫu đã tồn tại. Vui lòng chọn mã khác.',
  TEMPLATE_NOT_FOUND: 'Không tìm thấy biểu mẫu.',
  TEMPLATE_IN_USE:
    'Không thể xóa biểu mẫu đang được sử dụng trong đợt báo cáo.',
  TEMPLATE_ALREADY_READY: 'Biểu mẫu đã ở trạng thái sẵn sàng.',
  TEMPLATE_ALREADY_ARCHIVED: 'Biểu mẫu đã được lưu trữ.',
  ALL_INPUT_INDICATORS_MUST_BE_ASSIGNED:
    'Vui lòng phân bổ 100% chỉ tiêu INPUT trước khi chuyển sẵn sàng.',

  INDICATOR_CODE_DUPLICATE:
    'Mã chỉ tiêu đã tồn tại. Vui lòng chọn mã khác.',
  INDICATOR_NOT_FOUND: 'Không tìm thấy chỉ tiêu.',
  INDICATOR_IN_USE: 'Không thể xóa chỉ tiêu đã được phân bổ.',

  FIELD_KEY_DUPLICATE:
    'Mã thuộc tính đã tồn tại. Vui lòng đặt tên khác.',
  FIELD_NOT_FOUND: 'Không tìm thấy thuộc tính.',
  FIELD_IN_USE: 'Không thể xóa thuộc tính đang được sử dụng.',

  USER_CODE_DUPLICATE: 'Mã người dùng đã tồn tại.',
  USERNAME_DUPLICATE:
    'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.',
  EMAIL_DUPLICATE: 'Email đã được sử dụng bởi tài khoản khác.',
  USER_NOT_FOUND: 'Không tìm thấy người dùng.',

  SCOPE_DUPLICATE: 'Phạm vi phân bổ bị trùng. Vui lòng kiểm tra lại.',

  IMPORT_INVALID_FORMAT:
    'File Excel không đúng định dạng. Vui lòng kiểm tra lại.',

  PERIOD_CODE_DUPLICATE:
    'Mã kỳ bị trùng. Vui lòng chọn loại kỳ/khoảng ngày khác hoặc tạo kỳ mới.',
  PERIOD_DUPLICATE:
    'Kỳ báo cáo bị trùng. Đã tồn tại kỳ với loại kỳ và khoảng ngày này.',

  ASSIGNMENT_BATCH_DUPLICATE:
    'Đợt giao báo cáo đã tồn tại. Vui lòng chọn kỳ hoặc thời hạn khác.',
  CAMPAIGN_DUPLICATE:
    'Đợt báo cáo đã tồn tại (trùng kỳ). Vui lòng chọn kỳ khác.',
}

const ERROR_MESSAGE_MESSAGES: Record<string, string> = {
  'Email đã tồn tại': 'Email đã được sử dụng bởi tài khoản khác.',
  'Username đã tồn tại': 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.',
  'Mã người dùng đã tồn tại': 'Mã người dùng đã tồn tại.',
}

export function getApiErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : 'Thao tác thất bại.'

  const code = raw.split(/\s|\(/)[0]?.trim()
  if (code && code in ERROR_CODE_MESSAGES) {
    return ERROR_CODE_MESSAGES[code]
  }

  const messageWithoutRequestId = raw.replace(/\s*\(requestId:.*\)$/, '').trim()
  if (messageWithoutRequestId in ERROR_MESSAGE_MESSAGES) {
    return ERROR_MESSAGE_MESSAGES[messageWithoutRequestId]
  }

  return messageWithoutRequestId || raw
}
