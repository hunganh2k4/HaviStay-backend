export function parseExpiryToSeconds(expiry: string): number {
  if (!expiry) {
    throw new Error('Expiry value is required');
  }

  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);

  if (isNaN(value)) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      // Nếu chỉ là số: "600"
      return parseInt(expiry, 10);
  }
}