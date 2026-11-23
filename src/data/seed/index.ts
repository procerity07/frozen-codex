export { heroes } from './heroes';
export { bondGifts, bondGroups, bondLevels, curioStarCosts, curios, elementWheel, troopTriangle } from './heroSystems';
export { events } from './events';
export { aceCards, aceLordPhases, armsRacePhases, bagDayLabels, bagItems, cycleDays, eventCurrencies, radiantCards, royalArmsRace } from './cycles';
export { giftCodes, GIFT_CODE_URL } from './codes';
export { sophiaQuestions } from './sophia';
export * from './progression';
export { shops } from './shops';
export { checklistTemplate, guides } from './guides';

/** Bump when bundled seed content changes; the DB re-seeds when this exceeds the stored version. */
export const SEED_VERSION = 2;
