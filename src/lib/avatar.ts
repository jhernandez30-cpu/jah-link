function cleanInitial(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .charAt(0)
    .toUpperCase();
}

export function getInitials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email?.split('@')[0] || '').trim();
  if (!source) return 'JL';

  const parts = source
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return 'JL';
  if (parts.length === 1) return cleanInitial(parts[0]) || 'JL';

  const first = cleanInitial(parts[0]);
  const second = cleanInitial(parts[1]);
  return `${first}${second}` || 'JL';
}
