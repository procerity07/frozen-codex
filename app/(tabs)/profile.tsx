import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Castle, Pencil, Settings, Shield, Sparkles, User } from 'lucide-react-native';
import { MarchCard } from '@/components/domain/MarchCard';
import { MyStatsCard } from '@/components/domain/MyStatsCard';
import { Badge, Card, CollapsibleSection, Row, Screen, Stat, haptic } from '@/components/ui';
import { listHeroes } from '@/db/repo';
import { civilBonuses, clampEntry, enhancementLabel, type CivilBonus } from '@/lib/roster';
import { skillsCheckedInGame } from '@/lib/heroData';
import { useAppStore } from '@/store/useAppStore';
import { elementColors, palette, space, type } from '@/theme';
import type { Hero } from '@/types/game';

const STAT_NAMES: Record<string, string> = {
  buildSpeed: 'Building speed', buildCost: 'Building cost', researchSpeed: 'Research speed', troopCap: 'Troop capacity',
  trainSpeed: 'Training speed', gatherSpeed: 'Gathering speed', healSpeed: 'Healing speed', resourceOutput: 'Resource output',
};

interface Total { key: string; label: string; unit: string; sum: number; parts: CivilBonus[]; unknown: CivilBonus[]; locked: CivilBonus[] }

/** Groups the civil skills of owned heroes by what they boost, adding up only values the app has exactly. */
function totals(bonuses: CivilBonus[]): Total[] {
  const map = new Map<string, Total>();
  for (const b of bonuses) {
    const key = b.stat ?? `skill:${b.skill}`;
    const t = map.get(key) ?? { key, label: b.stat ? STAT_NAMES[b.stat] ?? b.stat : b.skill, unit: b.unit === '%' ? '%' : b.unit === 'min' ? ' min' : '', sum: 0, parts: [], unknown: [], locked: [] };
    if (!b.active) t.locked.push(b);
    else if (b.value === null) t.unknown.push(b);
    else { t.sum += b.value; t.parts.push(b); }
    map.set(key, t);
  }
  return [...map.values()].sort((a, b) => Number(!!b.parts.length) - Number(!!a.parts.length) || a.label.localeCompare(b.label));
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export default function ProfileScreen() {
  const s = useAppStore();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { listHeroes().then(setHeroes).catch(() => undefined); }, []);

  const owned = useMemo(() => heroes.filter((h) => s.roster[h.id]).map((h) => ({ h, e: clampEntry(h, s.roster[h.id]) }))
    .sort((a, b) => b.e.stars - a.e.stars || b.e.level - a.e.level || a.h.name.localeCompare(b.h.name)), [heroes, s.roster]);
  const groups = useMemo(() => totals(civilBonuses(owned.map((o) => o.h), s.roster)), [owned, s.roster]);
  const byStars = useMemo(() => {
    const c: Record<number, number> = {};
    owned.forEach((o) => { c[o.e.stars] = (c[o.e.stars] ?? 0) + 1; });
    return Object.entries(c).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [owned]);
  const unchecked = owned.filter((o) => !skillsCheckedInGame(o.h)).length;
  const b = s.citadel.bonuses;

  return (
    <Screen>
      <Pressable onPress={() => { haptic(); router.push('/tools/settings'); }} accessibilityRole="button"
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.md, borderRadius: 12, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface }, pressed && { opacity: 0.7 }]}>
        <Settings size={18} color={palette.cyan} />
        <Text style={[type.body, { color: palette.cyan }]}>Settings</Text>
      </Pressable>

      <CollapsibleSection title="Account" icon={User} right={<Pressable onPress={() => router.push('/tools/settings')} hitSlop={8}><Pencil size={16} color={palette.cyan} /></Pressable>}>
      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }} gap={space.lg}>
          <Stat label="Lord" value={s.realm.lordName || '—'} />
          <Stat label="Realm" value={s.realm.number ? `#${s.realm.number}` : '—'} />
          <Stat label="Realm age" value={s.realm.ageWeeks ? `${s.realm.ageWeeks} wk` : '—'} />
          <Stat label="Castles" value={String(s.castles.length)} />
        </Row>
        {s.castles.length > 1 ? <Text style={[type.caption, { marginTop: space.sm }]}>{s.castles.map((c) => c.name).join(' · ')}</Text> : null}
      </Card>
      </CollapsibleSection>

      <CollapsibleSection title="Citadel" icon={Castle} right={<Pressable onPress={() => router.push('/tools/citadel')} hitSlop={8}><Pencil size={16} color={palette.cyan} /></Pressable>}>
      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }} gap={space.lg}>
          <Stat label="Citadel level" value={String(s.citadel.from)} color={palette.success} />
          <Stat label="Goal" value={String(s.citadel.to)} />
          <Stat label="Build speed boosts" value={`${fmt(b.civilSpeedPct + b.builderGearPct + b.vipPct + b.institutePct)}%`} />
          <Stat label="Cost cut" value={`${fmt(b.costReductionPct)}%`} />
        </Row>
        <Text style={[type.caption, { marginTop: space.sm }]}>From the Citadel Planner. Change them there.</Text>
      </Card>
      </CollapsibleSection>

      <MarchCard heroes={heroes} roster={s.roster} />

      <CollapsibleSection title="Heroes in My Roster" icon={Shield} subtitle={`${owned.length} heroes`} right={<Badge label={String(owned.length)} color={palette.gold} />} initiallyOpen={false}>
      {owned.length === 0 ? (
        <Card><Text style={type.bodySecondary}>No heroes yet. Open a hero and tap "I own this hero" to add them with their stars and level.</Text></Card>
      ) : (
        <Card>
          <Row style={{ flexWrap: 'wrap' }}>{byStars.map(([st, n]) => <Badge key={st} label={`${st}★ × ${n}`} color={palette.gold} />)}</Row>
          {unchecked ? <Text style={[type.caption, { marginTop: space.sm, color: palette.gold }]}>{unchecked} of your heroes have skills not checked in-game yet.</Text> : null}
          <View style={{ marginTop: space.sm, gap: 6 }}>
            {owned.map(({ h, e }) => (
              <Pressable key={h.id} onPress={() => { haptic(); router.push(`/hero/${h.id}`); }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={[type.body, { color: elementColors[h.element] ?? palette.text, flex: 1 }]} noTranslate>{h.name}</Text>
                  <Text style={type.caption} noTranslate>{`${e.stars}★ · Lv ${e.level} · ${enhancementLabel(e.enhancement)}${h.rarity >= 5 ? ` · Bond ${e.bond}` : ''}`}</Text>
                </Row>
              </Pressable>
            ))}
          </View>
        </Card>
      )}
      </CollapsibleSection>

      <MyStatsCard />

      <CollapsibleSection title="Total hero bonuses" icon={Sparkles} subtitle="Civil (city) skills of your heroes added together. Tap a line to see where it comes from." initiallyOpen={false}>
      {groups.length === 0 ? (
        <Card><Text style={type.bodySecondary}>Add heroes to My Roster to see your totals.</Text></Card>
      ) : groups.map((g) => (
        <Pressable key={g.key} onPress={() => setOpen(open === g.key ? null : g.key)}>
          <Card>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={[type.body, { flex: 1 }]}>{g.label}</Text>
              <Text style={[type.heading, { color: g.parts.length ? palette.success : palette.textSecondary }]} noTranslate>
                {g.parts.length ? `+${fmt(g.sum)}${g.unit}` : '—'}
              </Text>
            </Row>
            {g.unknown.length || g.locked.length ? (
              <Text style={type.caption}>
                {[g.unknown.length ? `${g.unknown.length} value not verified (not added)` : '', g.locked.length ? `${g.locked.length} not unlocked yet` : ''].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            {open === g.key ? (
              <View style={{ marginTop: space.sm, gap: 4 }}>
                {[...g.parts, ...g.unknown, ...g.locked].map((p, i) => (
                  <Row key={i} style={{ justifyContent: 'space-between' }}>
                    <Text style={[type.caption, { flex: 1 }]} noTranslate>{`${p.hero} — ${p.skill}`}</Text>
                    <Text style={type.caption}>{p.active && p.value !== null ? `+${fmt(p.value)}${g.unit}` : p.note}</Text>
                  </Row>
                ))}
              </View>
            ) : null}
          </Card>
        </Pressable>
      ))}
      </CollapsibleSection>

    </Screen>
  );
}
