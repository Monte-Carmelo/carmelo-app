const BRAZILIAN_PHONE_MAX_DIGITS = 11;

export function getBrazilianPhoneDigits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '').slice(0, BRAZILIAN_PHONE_MAX_DIGITS);
}

export function formatBrazilianPhone(value: string | null | undefined) {
  const digits = getBrazilianPhoneDigits(value);

  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
