import { fmt } from './format';

/**
 * Splitwise export for a finished tournament.
 *
 * One Splitwise expense settles the whole game:
 *   - "Paid by"  (paid share)  = what each player EARNED (prize + bounties won)
 *   - "Split"    (owed share)  = what each player SPENT  (buy-ins + bounties lost)
 * Splitwise balance = paid − owed = the player's net, so the group ends up owing
 * exactly the right amounts. Both columns add up to the same total.
 *
 * The Splitwise API can't be called from the browser (no CORS, OAuth needs a
 * secret), so the app prepares the numbers and the text; the admin pastes them
 * into Splitwise.
 */

export type SplitwiseRow = {
  id: string;
  name: string;
  spent: number;
  earned: number;
  net: number;
};

export type Transfer = { from: string; to: string; amount: number };

const cents = (n: number) => Math.round(n * 100);

export function splitwiseRows(
  players: { id: string; name: string; buyins: number; bountyBalance: number }[],
  buyIn: number,
  prizeFor: (id: string) => number,
): SplitwiseRow[] {
  const rows = players.map((p) => {
    const bounty = p.bountyBalance || 0;
    const spentC = cents(p.buyins * buyIn + Math.max(0, -bounty));
    const earnedC = cents(prizeFor(p.id) + Math.max(0, bounty));
    return { id: p.id, name: p.name, spentC, earnedC };
  });
  // Split bounties (e.g. thirds) can leave a cent of rounding; give it to the biggest earner
  // so both columns match to the cent, as Splitwise requires.
  const diff = rows.reduce((s, r) => s + r.spentC - r.earnedC, 0);
  if (diff !== 0 && Math.abs(diff) <= rows.length) {
    const top = rows.reduce((a, b) => (b.earnedC > a.earnedC ? b : a), rows[0]);
    if (top) top.earnedC += diff;
  }
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    spent: r.spentC / 100,
    earned: r.earnedC / 100,
    net: (r.earnedC - r.spentC) / 100,
  }));
}

/** Fewest "X pays Y" transfers that settle every net. */
export function settleUp(rows: SplitwiseRow[]): Transfer[] {
  const debtors = rows.filter((r) => r.net < 0).map((r) => ({ name: r.name, c: -cents(r.net) }));
  const creditors = rows.filter((r) => r.net > 0).map((r) => ({ name: r.name, c: cents(r.net) }));
  debtors.sort((a, b) => b.c - a.c);
  creditors.sort((a, b) => b.c - a.c);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].c, creditors[j].c);
    if (amount > 0) out.push({ from: debtors[i].name, to: creditors[j].name, amount: amount / 100 });
    debtors[i].c -= amount;
    creditors[j].c -= amount;
    if (debtors[i].c === 0) i++;
    if (creditors[j].c === 0) j++;
  }
  return out;
}

const money = (n: number) => `€${fmt(Math.round(n * 100) / 100)}`;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${money(Math.abs(n))}`;

/** Plain-text expense description to paste into Splitwise (notes / description). */
export function splitwiseText(title: string, date: Date, rows: SplitwiseRow[]): string {
  const total = rows.reduce((s, r) => s + r.spent, 0);
  const lines = [
    `🃏 Poker: ${title} (${date.toLocaleDateString()})`,
    `Total ${money(total)}`,
    '',
    'Paid by (earned):',
    ...rows.filter((r) => r.earned > 0).map((r) => `  ${r.name}: ${money(r.earned)}`),
    '',
    'Split unequally (spent):',
    ...rows.map((r) => `  ${r.name}: ${money(r.spent)}`),
    '',
    'Net:',
    ...rows.map((r) => `  ${r.name}: ${signed(r.net)}`),
  ];
  const transfers = settleUp(rows);
  if (transfers.length) {
    lines.push('', 'Settle up:', ...transfers.map((t) => `  ${t.from} → ${t.to}: ${money(t.amount)}`));
  }
  return lines.join('\n');
}

export const SPLITWISE_URL = 'https://secure.splitwise.com/#/dashboard';
