export interface AuthError {
  code: string;
  message: string;
}

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: "ERR_INVALID_CREDENTIALS",
    message: "Tài khoản hoặc mật khẩu không chính xác.",
  },
  USER_NOT_FOUND: {
    code: "ERR_USER_NOT_FOUND",
    message: "Tài khoản không tồn tại.",
  },
  INVALID_EMAIL: {
    code: "ERR_INVALID_EMAIL",
    message: "Email không hợp lệ.",
  },
  VALIDATION_ERROR: {
    code: "ERR_VALIDATION",
    message: "Dữ liệu không hợp lệ.",
  },
  SESSION_REQUIRED: {
    code: "ERR_SESSION_REQUIRED",
    message: "Vui lòng đăng nhập.",
  },
} as const;
