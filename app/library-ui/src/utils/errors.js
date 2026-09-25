export function parseODataError(body, status) {
  if (status === 403) {
    return 'Forbidden: your user has no Admin or Member role collection. Assign Library-Admin or Library-Member in BTP Cockpit, then log out and back in.';
  }
  if (typeof body === 'string') {
    try {
      return parseODataError(JSON.parse(body), status);
    } catch {
      return body || `Request failed (${status})`;
    }
  }
  const err = body.error;
  if (err?.message) {
    if (typeof err.message === 'string') return err.message;
    if (typeof err.message?.value === 'string') return err.message.value;
  }
  if (err?.code) return `${err.code}: ${err.message?.value || 'Error'}`;
  return `Request failed (${status})`;
}
