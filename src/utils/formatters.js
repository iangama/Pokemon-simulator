export function toTitle(text = '') {
  return text
    .replace(/-/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDateIso(date = new Date()) {
  return new Date(date).toISOString();
}

export function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString('en-US')}`;
}
