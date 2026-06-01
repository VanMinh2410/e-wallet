export function getApiErrorMessage(err: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  const ax = err as { response?: { data?: { message?: string | string[] } } };
  const msg = ax.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string' && msg) return msg;
  return fallback;
}

export function extractResponseData<T extends Record<string, unknown>>(res: { data: unknown }): T {
  const body = res.data as { data?: T } & T;
  if (body && typeof body === 'object' && 'data' in body && body.data) {
    return body.data as T;
  }
  return body as T;
}
