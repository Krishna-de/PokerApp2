/** Default prize split (percent of the pool) by number of paid places. */
export const PAYOUT_SPLITS: Record<number, number[]> = {
  1: [100],
  2: [60, 40],
  3: [50, 30, 20],
  4: [40, 30, 20, 10],
  5: [35, 25, 20, 12, 8],
  6: [30, 22, 18, 13, 10, 7],
};

export const MAX_PLACES = 6;

/** House rule: 5 or fewer players pay 2, 6–9 pay 3, 10+ pay 4. */
export function defaultPlaces(playerCount: number) {
  if (playerCount <= 5) return 2;
  if (playerCount <= 9) return 3;
  return 4;
}

/** Split the pool into whole-euro amounts; rounding leftovers go to 1st place. */
export function splitPool(pool: number, places: number): number[] {
  const pct = PAYOUT_SPLITS[places] ?? PAYOUT_SPLITS[3];
  const amounts = pct.map((p) => Math.floor((pool * p) / 100));
  amounts[0] += pool - amounts.reduce((sum, n) => sum + n, 0);
  return amounts;
}
