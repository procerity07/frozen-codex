import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Swords } from 'lucide-react-native';
import { Card, Chip, Row, SectionHeader, haptic } from '@/components/ui';
import { MARCH_TYPES, recommendMarch, type MarchMode, type MarchType } from '@/lib/march';
import type { RosterEntry } from '@/lib/roster';
import { useAppStore } from '@/store/useAppStore';
import { elementColors, palette, space, type } from '@/theme';
import type { Hero } from '@/types/game';

const ROLE_LABEL = { core: 'Core', hybrid: 'Hybrid', 'troop-buffer': 'All-troop buff', filler: 'Filler' } as const;

export function MarchCard({ heroes, roster }: { heroes: Hero[]; roster: Record<string, RosterEntry> }) {
  const focus = useAppStore((s) => s.troopFocus);
  const [troop, setTroop] = useState<MarchType>(MARCH_TYPES.includes(focus as MarchType) ? (focus as MarchType) : 'Cavalry');
  const [mode, setMode] = useState<MarchMode>('advanced');
  const plan = useMemo(() => recommendMarch(heroes, roster, troop, mode), [heroes, roster, troop, mode]);

  return (
    <>
      <SectionHeader title="Recommended march" icon={Swords} subtitle="Built from your heroes in My Roster. Civil heroes are never used." />
      <Card>
        <Row style={{ flexWrap: 'wrap' }}>
          {MARCH_TYPES.map((t) => <Chip key={t} label={t} active={troop === t} onPress={() => setTroop(t)} />)}
        </Row>
        <Row style={{ flexWrap: 'wrap', marginTop: space.xs }}>
          <Chip label="Advanced (4 + 1)" active={mode === 'advanced'} onPress={() => setMode('advanced')} />
          <Chip label="Beginner (5 same type)" active={mode === 'beginner'} onPress={() => setMode('beginner')} />
        </Row>
        <Text style={[type.caption, { marginTop: space.xs }]}>
          {mode === 'advanced'
            ? `Four ${troop} heroes plus one off-type: in Monster Dens only four same-type troop skills activate. Best fifth: a hybrid whose skill boosts ${troop}, otherwise an all-troop ATK hero (e.g. Sodoma, Freya, Tutanhet).`
            : `Five ${troop} heroes. Good while you are building up your roster.`}
        </Text>

        {plan.picks.length === 0 ? (
          <Text style={[type.bodySecondary, { marginTop: space.md }]}>Add military heroes to My Roster (open a hero → "I own this hero") to get a recommendation.</Text>
        ) : (
          <View style={{ marginTop: space.md, gap: space.sm }}>
            {plan.picks.map((p, i) => (
              <Pressable key={p.hero.id} onPress={() => { haptic(); router.push(`/hero/${p.hero.id}`); }}>
                <Row style={{ alignItems: 'flex-start' }}>
                  <Text style={[type.heading, { width: 22, color: palette.textSecondary }]} noTranslate>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Text style={[type.body, { color: elementColors[p.hero.element] ?? palette.text, fontWeight: '700' }]} noTranslate>{p.hero.name}</Text>
                      <Text style={[type.caption, { color: p.role === 'core' ? palette.cyan : palette.gold }]}>{`${ROLE_LABEL[p.role]} · ${p.hero.unitType}`}</Text>
                    </Row>
                    <Text style={type.caption} noTranslate>{p.reason}</Text>
                  </View>
                </Row>
              </Pressable>
            ))}
          </View>
        )}
        {plan.notes.map((n) => <Text key={n} style={[type.caption, { marginTop: space.sm, color: palette.gold }]}>{n}</Text>)}
        <Text style={[type.caption, { marginTop: space.sm }]}>Ranked by enhancement first (+5 gives the 500% troop skill, so a 3★ +5 beats a 5★ +2), then by unlocked skills that boost {troop} ({troop} ATK counts far more than general Troop ATK), then stars and level.</Text>
      </Card>
    </>
  );
}
