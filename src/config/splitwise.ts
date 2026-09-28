/**
 * Fixed Splitwise mapping for "Add to Splitwise" (see src/utils/splitwise.ts).
 * IDs are not secret — safe to commit. The API key is NOT here; it lives in .env.
 *
 * Find the IDs (replace KEY and GROUP_ID):
 *   curl -s -H "Authorization: Bearer KEY" https://secure.splitwise.com/api/v3.0/get_groups
 *   curl -s -H "Authorization: Bearer KEY" https://secure.splitwise.com/api/v3.0/get_group/GROUP_ID
 * The group ID is also the number in the web address: secure.splitwise.com/#/groups/12345678
 */

/**
 * Splitwise group the expense goes to. When set, ONLY this group is used (no picker) and
 * "Open Splitwise" opens it. 0 = pick any of the API key owner's groups in the app.
 */
export const SPLITWISE_GROUP_ID = 0;

/**
 * Poker player name (as typed in the app, any case) → Splitwise user ID.
 * Players not listed are matched by name, or picked in the app.
 */
export const SPLITWISE_PLAYER_IDS: Record<string, number> = {
  // 'Sai': 12345678,
  // 'Krishna': 23456789,
};

/**
 * "Add to Splitwise" shows only when the room admin is one of these users (app display name, any case).
 * Empty = nobody. Everyone still sees the table and Copy / Share.
 */
export const SPLITWISE_ADDERS: string[] = ['Adi', 'Bharath', 'Naresh', 'Sai', 'BhuvR'];
