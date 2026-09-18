export function fmt(n: number) {
  return Number.isInteger(n) ? `${n}` : n.toFixed(2);
}

export function buyinLabel(count: number, buyIn: number) {
  return `${count} ${count === 1 ? 'buy-in' : 'buy-ins'} (€${fmt(count * buyIn)})`;
}

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export function makeNameKey(name: string) {
  return normalizeName(name).toLowerCase();
}

export function sameName(a: string, b: string) {
  return makeNameKey(a) === makeNameKey(b);
}