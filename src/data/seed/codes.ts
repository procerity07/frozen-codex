import type { GiftCode } from '@/types/game';

export const GIFT_CODE_URL = 'https://gevents.37games.com/gamecode/index.html?gameId=285';

/** Codes publicly shared by the publisher; status is "unknown" until a user marks it. */
export const giftCodes: GiftCode[] = [
  { code: 'PNC333', rewards: 'Diamonds, speedups', addedOn: '2024-01-15', status: 'unknown' },
  { code: 'PNC888', rewards: 'Diamonds, resources', addedOn: '2024-02-01', status: 'unknown' },
  { code: 'PNC168', rewards: 'Speedups, stamina', addedOn: '2024-03-10', status: 'unknown' },
  { code: 'PC777', rewards: 'Diamonds', addedOn: '2024-04-01', status: 'unknown' },
  { code: 'PNCGO', rewards: 'Starter resources', addedOn: '2024-04-20', status: 'unknown' },
  { code: 'HAPPY777', rewards: 'Diamonds, recruit tickets', addedOn: '2024-05-05', status: 'unknown' },
  { code: 'R2M6N9', rewards: 'Speedups', addedOn: '2024-06-01', status: 'unknown' },
  { code: 'DC55DV', rewards: 'Discord milestone pack', addedOn: '2024-07-01', status: 'unknown' },
  { code: 'DV60DC', rewards: 'Discord milestone pack', addedOn: '2024-08-01', status: 'unknown' },
  { code: 'HP70DC', rewards: 'Discord milestone pack', addedOn: '2024-09-01', status: 'unknown' },
  { code: 'PS80DC', rewards: 'Discord milestone pack', addedOn: '2024-10-01', status: 'unknown' },
  { code: 'PNC2ndY', rewards: '2nd anniversary pack', addedOn: '2025-01-10', status: 'unknown' },
  { code: 'HP90DC', rewards: 'Discord milestone pack', addedOn: '2025-02-01', status: 'unknown' },
  { code: 'PNC123', rewards: 'Diamonds, speedups', addedOn: '2025-03-01', status: 'unknown' },
];
