/**
 * Phone number utilities
 * Normalize and validate phone numbers for US format
 */

export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  return phone;
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const localDigits = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (localDigits.length !== 10) return phone;
  const area = localDigits.slice(0, 3);
  const prefix = localDigits.slice(3, 6);
  const line = localDigits.slice(6);
  return '(' + area + ') ' + prefix + '-' + line;
}
