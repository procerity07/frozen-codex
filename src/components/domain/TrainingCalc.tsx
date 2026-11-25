import { useState } from 'react';
import { Text, View } from 'react-native';
import { heroes } from '@/data/seed';
import { palette, space, type } from '@/theme';
import { Card, Chip, ChipRow, NumberField, Row, SectionHeader, Segmented, Stat } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { civilBonuses } from '@/lib/roster';
import { fmtFull } from '@/lib/calculators';
import { formatDuration } from '@/lib/time';
import { affordable, RESOURCES, TIER_CAMP_LEVEL, TIER_POWER, TROOP_TIERS, trainingCost, type TroopCost, type TroopType } from '@/lib/training';

const TYPES: readonly TroopType[] = ['Infantry', 'Cavalry', 'Archer'];
const LABEL: Record<(typeof RESOURCES)[number], string> = { food: 'Food', wood: 'Wood', stone: 'Stone', iron: 'Iron' };
const blankCost: TroopCost = { food: 0, wood: 0, stone: 0, iron: 0, seconds: 0 };

/** Resources, time and power to train troops, from per-troop costs you enter once (saved per tier). */
export function TrainingCalc() {
  const saved = useAppStore((s) => s.savedCalcs);
  const save = useAppStore((s) => s.saveCalc);
  const roster = useAppStore((s) => s.roster);
  const focus = useAppStore((s) => s.troopFocus);
  const [troop, setTroop] = useState<TroopType>(focus === 'All' ? 'Infantry' : focus);
  const [tier, setTier] = useState(Number(saved.trainingUi?.tier ?? 10));
  const s = saved.training ?? {};
  const set = (k: string, v: number) => save('training', { ...s, [k]: v });
  const costKey = (k: keyof TroopCost) => `${troop}-${tier}-${k}`;
  const per: TroopCost = { ...blankCost, ...Object.fromEntries((Object.keys(blankCost) as (keyof TroopCost)[]).map((k) => [k, saved.trainingCosts?.[costKey(k)] ?? 0])) };
  const setPer = (k: keyof TroopCost, v: number) => save('trainingCosts', { ...(saved.trainingCosts ?? {}), [costKey(k)]: v });

  // Owned-hero bonuses the app knows about (Fiona, Carvell, Schubert…): shown as a hint, not added automatically.
  const heroSpeed = civilBonuses(heroes, roster).filter((b) => b.stat === 'trainSpeed' && b.active && b.value !== null).reduce((t, b) => t + b.value!, 0);

  const r = trainingCost({ count: s.count ?? 0, perTroop: per, speedPct: s.speedPct ?? 0, costCutPct: s.costCutPct ?? 0, capacity: s.capacity ?? 0 }, tier);
  const canAfford = affordable({ food: s.haveFood, wood: s.haveWood, stone: s.haveStone, iron: s.haveIron }, per, s.costCutPct ?? 0);
  const filled = RESOURCES.some((k) => per[k] > 0);

  return (
    <>
      <Text style={[type.bodySecondary, { marginTop: space.sm }]}>Work out the resources, time and power for training troops. Enter one troop's cost from the in-game training screen once; it is remembered for each tier.</Text>
      <View style={{ marginTop: space.md }}><Segmented options={TYPES} value={troop} onChange={setTroop} /></View>
      <ChipRow>
        {TIER_POWER.map((_, i) => <Chip key={i} label={`T${i + 1}`} active={tier === i + 1} onPress={() => { setTier(i + 1); save('trainingUi', { tier: i + 1 }); }} />)}
      </ChipRow>
      <Text style={type.caption}>{TROOP_TIERS[troop][tier - 1]} · {TIER_POWER[tier - 1]} power each · Camp Lv. {TIER_CAMP_LEVEL[tier - 1]}</Text>

      <SectionHeader title="Cost of ONE troop (before bonuses)" subtitle="From the training screen in-game" />
      <Card>
        <Row>{(['food', 'wood'] as const).map((k) => <NumberField key={k} label={LABEL[k]} value={per[k]} onChange={(v) => setPer(k, v)} />)}</Row>
        <Row style={{ marginTop: space.sm }}>{(['stone', 'iron'] as const).map((k) => <NumberField key={k} label={LABEL[k]} value={per[k]} onChange={(v) => setPer(k, v)} />)}</Row>
        <View style={{ marginTop: space.sm }}><NumberField label="Training time per troop (seconds)" value={per.seconds} onChange={(v) => setPer('seconds', v)} suffix="s" /></View>
      </Card>

      <SectionHeader title="Your bonuses" />
      <Card>
        <NumberField label="Troops to train" value={s.count ?? 0} onChange={(v) => set('count', v)} />
        <Row style={{ marginTop: space.sm }}>
          <NumberField label="Training speed bonus" value={s.speedPct ?? 0} onChange={(v) => set('speedPct', v)} suffix="%" />
          <NumberField label="Training cost reduction" value={s.costCutPct ?? 0} onChange={(v) => set('costCutPct', Math.min(100, v))} suffix="%" />
        </Row>
        <View style={{ marginTop: space.sm }}><NumberField label="Training capacity (troops per batch)" value={s.capacity ?? 0} onChange={(v) => set('capacity', v)} /></View>
        <Text style={[type.caption, { marginTop: space.sm }]}>
          Use the totals from your Lord stats (research, VIP, buffs and heroes). {heroSpeed ? `Your owned heroes add +${heroSpeed}% training speed (already part of your in-game total).` : 'Fiona, Carvell and Schubert add training speed; Fiona also cuts training cost; Lucia adds capacity.'}
        </Text>
      </Card>

      <SectionHeader title="Result" />
      <Card>
        {!filled || !((s.count ?? 0) > 0) ? (
          <Text style={type.bodySecondary}>Enter the cost of one troop and how many to train.</Text>
        ) : (
          <>
            <Row style={{ flexWrap: 'wrap' }}>{RESOURCES.filter((k) => r[k] > 0).map((k) => <View key={k} style={{ minWidth: '45%' }}><Stat label={LABEL[k]} value={fmtFull(r[k])} /></View>)}</Row>
            <Row style={{ marginTop: space.md, justifyContent: 'space-between' }}>
              <Stat label="Training time" value={per.seconds ? formatDuration(r.seconds * 1000) : '—'} color={palette.cyan} />
              <Stat label="Power gained" value={fmtFull(r.power)} color={palette.gold} align="right" />
            </Row>
            {r.batches ? <Text style={[type.caption, { marginTop: space.sm }]}>{r.batches} batch{r.batches > 1 ? 'es' : ''} at your training capacity.</Text> : null}
          </>
        )}
      </Card>

      <SectionHeader title="How many can I afford?" subtitle="Enter what you have" />
      <Card>
        <Row>{(['haveFood', 'haveWood'] as const).map((k) => <NumberField key={k} label={k === 'haveFood' ? 'Food' : 'Wood'} value={s[k] ?? 0} onChange={(v) => set(k, v)} />)}</Row>
        <Row style={{ marginTop: space.sm }}>{(['haveStone', 'haveIron'] as const).map((k) => <NumberField key={k} label={k === 'haveStone' ? 'Stone' : 'Iron'} value={s[k] ?? 0} onChange={(v) => set(k, v)} />)}</Row>
        <Text style={[type.heading, { marginTop: space.md, color: palette.success }]}>{filled ? `${fmtFull(canAfford)} ${TROOP_TIERS[troop][tier - 1]}` : 'Enter the cost of one troop first'}</Text>
      </Card>
    </>
  );
}
