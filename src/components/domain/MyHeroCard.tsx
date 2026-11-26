import { Text, View } from 'react-native';
import { BookmarkCheck, BookmarkPlus, Trash } from 'lucide-react-native';
import type { Hero } from '@/types/game';
import { palette, space, type } from '@/theme';
import { Badge, Button, Card, NumberField, Row, SectionHeader, Stepper } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import {
  BOND_MAX, bondCapForEnhancement, hasBonds, clampEntry, enhancementLabel, levelCap, maxEnhancement, maxStars, newEntry,
  nextSkillUnlock, promotionStatus, requiredEnhancementForBond, shardsBetween, specialtyUnlocked, type RosterEntry,
} from '@/lib/roster';
import { PROMOTION, SPECIALTY } from '@/data/seed/heroProgression';
import { fmtFull } from '@/lib/calculators';

/** "My hero" panel on the hero page: ownership, stars, level, enhancement and bond, with progress hints. */
export function MyHeroCard({ hero }: { hero: Hero }) {
  const raw = useAppStore((s) => s.roster[hero.id]);
  const setEntry = useAppStore((s) => s.setRosterEntry);
  const remove = useAppStore((s) => s.removeFromRoster);

  if (!raw) {
    return (
      <>
        <SectionHeader title="My hero" icon={BookmarkPlus} />
        <Card>
          <Text style={type.bodySecondary}>Add this hero to your Roster to track stars, level and enhancement{hasBonds(hero) ? ' and bond' : ''}.</Text>
          <View style={{ marginTop: space.md }}>
            <Button icon={BookmarkPlus} label="I own this hero" onPress={() => setEntry(hero.id, newEntry(hero))} />
          </View>
        </Card>
      </>
    );
  }

  const e = clampEntry(hero, raw);
  const update = (patch: Partial<RosterEntry>) => setEntry(hero.id, clampEntry(hero, { ...e, ...patch }));
  const cap = levelCap(e.stars);
  const maxEnh = maxEnhancement(e.stars);
  const promo = promotionStatus(hero, e);
  const nextUnlock = nextSkillUnlock(e.level, hero.rarity);
  const bondCap = bondCapForEnhancement(e.enhancement);
  const bondNeeds = requiredEnhancementForBond(e.bond);
  const bondBlocked = bondNeeds !== null && e.enhancement < bondNeeds;

  return (
    <>
      <SectionHeader title="My hero" icon={BookmarkCheck} right={<Badge label="Owned" color={palette.success} />} />
      <Card>
        <Row>
          <Stepper label="Stars" value={e.stars} min={hero.rarity} max={maxStars(hero)} onChange={(stars) => update({ stars })} format={(n) => `${n}★`} />
          <Stepper label="Enhancement" value={e.enhancement} min={0} max={maxEnh} onChange={(enhancement) => update({ enhancement })} format={enhancementLabel} />
        </Row>
        <Row style={{ marginTop: space.sm }}>
          <NumberField label={cap ? `Level (max ${cap})` : 'Level'} value={e.level} onChange={(level) => update({ level })} />
          {hasBonds(hero) ? <NumberField label={`Bond level (1–${BOND_MAX})`} value={e.bond} onChange={(bond) => update({ bond })} /> : null}
        </Row>

        <View style={{ marginTop: space.md, gap: 6 }}>
          {e.enhancement < maxEnh ? (
            <Hint label="Next enhancement" value={`${enhancementLabel(e.enhancement + 1)}: ${fmtFull(shardsBetween(e.enhancement, e.enhancement + 1))} shards · to ${enhancementLabel(maxEnh)}: ${fmtFull(shardsBetween(e.enhancement, maxEnh))}`} />
          ) : (
            <Hint label="Enhancement" value={`Maxed at ${enhancementLabel(maxEnh)}${e.stars < 5 ? ' (heroes below 5★ stop at +5)' : ''}`} />
          )}
          {cap !== null && e.level >= cap && !promo.possible ? <Hint label="Level" value={`At the ${e.stars}★ cap (${cap})`} /> : null}
          {promo.possible ? (
            <Hint
              label={`Promote to ${PROMOTION.toStars}★`}
              value={promo.eligible ? `Ready: costs ${fmtFull(PROMOTION.heroExp)} Hero EXP + ${fmtFull(PROMOTION.t6Books)} T6 Evolution Books` : `Needs ${promo.missing.join(' and ')}`}
              color={promo.eligible ? palette.success : undefined}
            />
          ) : null}
          {hero.rarity >= 5 ? (
            <Hint label="Hero Specialty" value={specialtyUnlocked(e) ? 'Unlocked' : `Unlocks at +${SPECIALTY.enhancement} and Lv. ${SPECIALTY.level}`} color={specialtyUnlocked(e) ? palette.success : undefined} />
          ) : null}
          {nextUnlock ? <Hint label="Next skill unlock" value={`Lv. ${nextUnlock.level}: ${nextUnlock.what}`} /> : null}
          {!hasBonds(hero) ? null : bondBlocked ? (
            <Hint label="Bond" value={`Bond Lv. ${e.bond} needs ${enhancementLabel(bondNeeds!)} enhancement`} color={palette.danger} />
          ) : (
            <Hint label="Bond" value={bondCap === null ? 'Enhancement gate above Lv. 86 not listed by the wiki' : `${enhancementLabel(e.enhancement)} allows bond up to Lv. ${bondCap}`} />
          )}
        </View>

        <View style={{ marginTop: space.md }}>
          <Button compact icon={Trash} variant="ghost" label="Remove from Roster" onPress={() => remove(hero.id)} />
        </View>
      </Card>
    </>
  );
}

function Hint({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Row style={{ alignItems: 'flex-start' }}>
      <Text style={[type.caption, { width: 116 }]}>{label}</Text>
      <Text style={[type.bodySecondary, { flex: 1 }, color ? { color } : null]}>{value}</Text>
    </Row>
  );
}
