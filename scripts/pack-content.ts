/** The content published in the online data pack (shared by the pack writer and the checks). */
import { events, giftCodes, heroes, shops, sophiaQuestions } from '../src/data/seed';

export const packContent = () => JSON.parse(JSON.stringify({ heroes, events, giftCodes, sophia: sophiaQuestions, shops })) as Record<string, unknown>;
