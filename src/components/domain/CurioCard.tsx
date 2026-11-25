import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Card, Chip, Row, Stepper } from '@/components/ui';
import { CODE_OF_LIGHT, CURIO_QUALITIES, curioHeroAttribute, curioLegion, heroCurios } from '@/data/seed';
import { useAppStore, type CurioChoice } from '@/store/useAppStore';
import { palette, space, type } from '@/theme';
import type { Hero } from '@/types/game';

const QUALITY_COLOR = { Common: '#9CA3AF', Uncommon: '#22C55E', Superb: '#3B82F6', Epic: '#A855F7', Legendary: '#F59E0B' } as const;
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
const STAR_OPTIONS = [4, 5, 6, 7];

/** Curio for one hero: its exclusive curio (or Code of Light), with values for the chosen quality. */
export function CurioCard({ hero }: { hero: Hero }) {
  const curio = heroCurios.find((c) => c.heroId === hero.id);
  const saved = useAppStore((s) => s.curioChoice[hero.id]);
  const setChoice = useAppStore((s) => s.setCurioChoice);
  const owned = useAppStore((s) => s.roster[hero.id]);
  const showImages = useAppStore((s) => s.showPortraits);
  const c: CurioChoice = saved ?? { kind: curio ? 'exclusive' : 'light', quality: 'Legendary', stars: 4, enhancement: 1 };
  const kind = curio ? c.kind : 'light';
  const set = (p: Partial<CurioChoice>) => setChoice(hero.id, { ...c, ...p });
  const qi = CURIO_QUALITIES.indexOf(c.quality);
  const legionRows = curioLegion.filter((r) => r.stars === c.stars);
  const maxEnh = legionRows.length ? Math.max(...legionRows.map((r) => r.enhancement)) : 1;
  const enh = Math.min(c.enhancement, maxEnh);
  const legion = legionRows.find((r) => r.enhancement === enh)?.pct ?? null;
  const ha = curioHeroAttribute[c.quality];

  return (
    <Card accent={QUALITY_COLOR[c.quality]}>
      <Row style={{ flexWrap: 'wrap' }}>
        {curio ? <Chip label={curio.name} active={kind === 'exclusive'} onPress={() => set({ kind: 'exclusive' })} /> : null}
        <Chip label={CODE_OF_LIGHT.name} active={kind === 'light'} onPress={() => set({ kind: 'light' })} />
      </Row>

      <Row style={{ marginTop: space.sm, alignItems: 'center' }}>
        {kind === 'exclusive' && curio?.image && showImages ? (
          <Image source={{ uri: curio.image }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: palette.surface }} contentFit="contain" cachePolicy="disk" accessibilityLabel={curio.name} />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, { color: QUALITY_COLOR[c.quality] }]} noTranslate>{`${c.quality} ${kind === 'exclusive' && curio ? curio.name : CODE_OF_LIGHT.name}`}</Text>
          <Text style={type.caption}>{kind === 'exclusive' ? `Exclusive to ${hero.name}.` : CODE_OF_LIGHT.note}</Text>
        </View>
      </Row>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm }}>
        {CURIO_QUALITIES.map((q) => <Chip key={q} label={q} color={QUALITY_COLOR[q]} active={c.quality === q} onPress={() => set({ quality: q })} />)}
      </View>

      {kind === 'exclusive' && curio ? (
        <View style={{ marginTop: space.md }}>
          <Text style={type.heading}>Exclusive Attributes (passive)</Text>
          {curio.exclusive.map((a) => {
            const v = a.values[qi] ?? null;
            const heroEnh = owned?.enhancement;
            const active = heroEnh === undefined ? null : heroEnh >= a.heroEnhancement;
            return (
              <Row key={a.name} style={{ justifyContent: 'space-between', paddingVertical: 3 }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{a.name}</Text>
                  <Text style={[type.caption, { color: active === false ? palette.warning : palette.textSecondary }]}>
                    {`Needs ${hero.name} ${a.heroEnhancement === 0 ? 'Hero0' : `+${a.heroEnhancement}`}${active === false ? ' (not yet)' : active ? ' ✓' : ''}`}
                  </Text>
                </View>
                <Text style={[type.body, { color: v === null ? palette.textMuted : palette.success }]} noTranslate>
                  {v === null ? 'Legendary only' : `+${fmt(v)}${a.unit === '%' ? '%' : ''}`}
                </Text>
              </Row>
            );
          })}
        </View>
      ) : null}

      <View style={{ marginTop: space.md }}>
        <Text style={type.heading}>Hero Attribute</Text>
        <Text style={type.body} noTranslate>{`HP +${fmt(ha.hp)} · DEF +${fmt(ha.def)} · ATK +${fmt(ha.atk)}`}</Text>
      </View>

      <View style={{ marginTop: space.md }}>
        <Text style={type.heading}>Legion Attribute (passive)</Text>
        <Text style={type.caption}>Troop DEF, HP and ATK. Depends on the curio's stars and enhancement.</Text>
        <Row style={{ flexWrap: 'wrap', marginTop: 4 }}>
          {STAR_OPTIONS.map((st) => <Chip key={st} label={`${st}★`} active={c.stars === st} onPress={() => set({ stars: st })} />)}
        </Row>
        <View style={{ marginTop: space.xs }}>
          <Stepper label="Curio enhancement" value={enh} min={1} max={maxEnh} onChange={(n) => set({ enhancement: n })} format={(n) => `+${n}`} />
        </View>
        <Text style={[type.body, { marginTop: 4, color: palette.success }]} noTranslate>{legion === null ? 'Not listed on the wiki' : `Troop DEF, HP & ATK +${fmt(legion)}%`}</Text>
      </View>
    </Card>
  );
}
