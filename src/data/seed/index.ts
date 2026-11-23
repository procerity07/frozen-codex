export { heroes, HERO_DATA_REVISION } from './heroes';
export { heroAudit } from './heroAudit';
export { bondGifts, bondGroups, bondLevels, curioStarCosts, curios, elementWheel, troopTriangle } from './heroSystems';
export { events, EVENT_DATA_REVISION } from './events';
export { aceCards, aceLordPhases, armsRacePhases, bagDayLabels, bagItems, cycleDays, eventCurrencies, radiantCards, royalArmsRace } from './cycles';
export { giftCodes, GIFT_CODE_URL } from './codes';
export { sophiaQuestions } from './sophia';
export * from './progression';
export { shops } from './shops';
export { checklistTemplate, guides } from './guides';

/** Bump when bundled seed content changes; the DB re-seeds when this exceeds the stored version. */
// 4: hero audit (2026-11-23) — corrected bundled hero data must replace stale online-pack rows on existing installs.
// 5: in-game Ace Lord Day 1 values (events revision 2).
// 6: in-game Event Schedule corrections (events revision 3).
// 7: in-game event pop-ups (Alliance Party, Undead Scourge, Elemental Seal).
// 8: hero revision 2 (civil-skill value tables for My Heroes).
// 9: hero revision 3 (in-game Saya table, five added heroes).
export const SEED_VERSION = 27;
