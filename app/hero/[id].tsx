import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ClipboardCheck, Crosshair, Gem, Shield, Sparkles, Swords, Users } from 'lucide-react-native';
import type { CombatRole, Hero, HeroAuditField, Match3Skill } from '@/types/game';
import { getHero } from '@/db/repo';
import { bondGroups, curios, events } from '@/data/seed';
import { elementColors, palette, rarityColors, rarityLabels, space, tint, type } from '@/theme';
import { Badge, Card, Chip, ChipRow, ConfidenceNote, ElementEmblem, EmptyState, RarityStars, Row, Screen, SectionHeader, TroopEmblem } from '@/components/ui';
import { combatRoleLabel, isFieldVerified } from '@/lib/heroData';

const ROLE_COLORS: Record<CombatRole, string> = { Damage: palette.danger, Support: palette.cyan, Healer: palette.success };

/** Small marker for a section whose content no source has confirmed. */
function Unverified({ hero, field }: { hero: Hero; field: HeroAuditField }) {
  return isFieldVerified(hero, field) ? null : <Badge label="Not verified" color={palette.textMuted} />;
}

function Match3Section({ hero, m3 }: { hero: Hero; m3: Match3Skill }) {
  return (
    <>
      <SectionHeader title="Match-3 tactical skill" icon={Sparkles} right={<Unverified hero={hero} field="match3Skill" />} />
      <Card accent={elementColors[hero.element]}>
        <Text style={type.heading}>{m3.name}</Text>
        <Text style={[type.bodySecondary, { marginTop: 4 }]}>{m3.description}</Text>
        <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
          {m3.charge ? <Badge label={`Charge: ${m3.charge}`} color={palette.cyan} /> : null}
          <Badge label={m3.pattern} />
          {m3.effects.map((e) => <Badge key={e} label={e} color={palette.gold} />)}
        </Row>
      </Card>
    </>
  );
}

export default function HeroDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [hero, setHero] = useState<Hero | null | undefined>(undefined);
  useEffect(() => { getHero(String(id)).then(setHero).catch(() => setHero(null)); }, [id]);

  if (hero === undefined) return <Screen><Stack.Screen options={{ title: '' }} /></Screen>;
  if (!hero) return <Screen><Stack.Screen options={{ title: 'Not found' }} /><EmptyState title="Hero not found" /></Screen>;

  const rc = rarityColors[hero.rarity];
  const curio = curios.find((c) => c.heroId === hero.id);
  const groups = bondGroups.filter((g) => g.members.includes(hero.id));
  const featuredIn = events.filter((e) => e.featuredHeroes.includes(hero.id));
  const roleLabel = combatRoleLabel(hero);

  return (
    <Screen>
      <Stack.Screen options={{ title: hero.name }} />
      <Card style={{ marginTop: space.sm, borderColor: tint(rc, 0.5) }}>
        <Row gap={space.md}>
          <View style={{ width: 64, height: 64, borderRadius: 14, borderWidth: 2, borderColor: rc, backgroundColor: tint(rc, 0.12), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 30, fontWeight: '800', color: rc }}>{hero.name.slice(0, 1)}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={type.title}>{hero.name}</Text>
            {hero.title ? <Text style={type.bodySecondary}>{hero.title}</Text> : null}
            <Row gap={6}><RarityStars rarity={hero.rarity} /><Text style={[type.caption, { color: rc }]}>{rarityLabels[hero.rarity]}</Text></Row>
          </View>
        </Row>
        <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
          <Row gap={6}><ElementEmblem element={hero.element} size={20} /><Text style={[type.body, { color: elementColors[hero.element] }]}>{hero.element}</Text></Row>
          <Row gap={6}><TroopEmblem type={hero.unitType} size={20} /><Text style={type.body}>{hero.unitType}</Text></Row>
          {hero.role ? <Badge label={hero.role} color={palette.cyan} /> : null}
        </Row>
        <ConfidenceNote confidence={hero.confidence} />
      </Card>

      <SectionHeader title="Combat role" icon={Crosshair} />
      <Card style={{ padding: space.md }}>
        {roleLabel === 'Not verified' ? (
          <Text style={[type.bodySecondary, { color: palette.textMuted }]}>Not verified</Text>
        ) : (
          <Badge label={roleLabel} color={ROLE_COLORS[roleLabel]} />
        )}
      </Card>

      {hero.marchSkills.length ? (
        <>
          <SectionHeader title="March military skills" subtitle="Active when the hero leads or joins a march" icon={Swords} right={<Unverified hero={hero} field="marchSkills" />} />
          {hero.marchSkills.map((sk) => (
            <Card key={sk.name} style={{ marginBottom: space.sm }}>
              <Text style={type.heading}>{sk.name}</Text>
              <Text style={[type.bodySecondary, { marginTop: 4 }]}>{sk.description}</Text>
            </Card>
          ))}
        </>
      ) : null}

      {hero.civilSkills.length ? (
        <>
          <SectionHeader title="Passive civil skills" subtitle="Own-only — active without marching" icon={Shield} right={<Unverified hero={hero} field="civilSkills" />} />
          {hero.civilSkills.map((sk) => (
            <Card key={sk.name} style={{ marginBottom: space.sm }} accent={palette.gold}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={[type.heading, { flex: 1 }]}>{sk.name}</Text>
                {sk.value ? <Text style={[type.number, { color: palette.gold }]}>+{sk.value}%</Text> : null}
              </Row>
              <Text style={[type.bodySecondary, { marginTop: 4 }]}>{sk.description}</Text>
              <Text style={[type.caption, { marginTop: 4, color: palette.gold }]}>{sk.requirement}</Text>
            </Card>
          ))}
        </>
      ) : null}

      {hero.match3Skill ? <Match3Section hero={hero} m3={hero.match3Skill} /> : null}

      <SectionHeader title="Acquisition" icon={Gem} right={<Unverified hero={hero} field="sources" />} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {hero.sources.map((s) => <Badge key={s} label={s} color={palette.text} />)}
      </View>
      {featuredIn.length ? (
        <ChipRow>{featuredIn.map((e) => <Chip key={e.id} label={e.name} onPress={() => router.push(`/event/${e.id}`)} />)}</ChipRow>
      ) : null}

      {groups.length || curio ? <SectionHeader title="Bonds & curio" icon={Users} /> : null}
      {groups.map((g) => (
        <Card key={g.id} style={{ marginBottom: space.sm }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={[type.heading, { flex: 1 }]}>{g.name}</Text>
            {g.verified === false || g.bonusesVerified === false ? <Badge label={g.verified === false ? 'Not verified' : 'Bonuses not verified'} color={palette.textMuted} /> : null}
          </Row>
          {g.bonuses.map((b, i) => <Text key={i} style={type.bodySecondary}>{b.level > 0 ? `Lv. ${b.level}: ` : ''}{b.effect}</Text>)}
        </Card>
      ))}
      {curio ? (
        <Card accent={palette.gold}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={[type.heading, { flex: 1 }]}>{curio.name}</Text>
            {curio.verified === false ? <Badge label="Not verified" color={palette.textMuted} /> : null}
          </Row>
          <Text style={type.bodySecondary}>{curio.legionPassive}</Text>
          <Text style={type.bodySecondary}>{curio.heroAttribute}</Text>
          {curio.exclusivePassive ? <Text style={[type.bodySecondary, { color: palette.gold }]}>{curio.exclusivePassive}</Text> : null}
        </Card>
      ) : null}

      {hero.notes ? (
        <>
          <SectionHeader title="Notes" right={<Unverified hero={hero} field="notes" />} />
          <Card><Text style={type.body}>{hero.notes}</Text></Card>
        </>
      ) : null}

      {hero.audit ? (
        <>
          <SectionHeader title="Data check" subtitle={`Checked ${hero.audit.checkedOn} · sections marked Not verified are unconfirmed`} icon={ClipboardCheck} />
          <Card>
            {hero.audit.notes.map((n, i) => <Text key={i} style={[type.bodySecondary, { marginBottom: 6 }]}>{n}</Text>)}
            {hero.audit.sourceUrls.map((u) => (
              <Pressable key={u} onPress={() => { WebBrowser.openBrowserAsync(u).catch(() => undefined); }} accessibilityRole="link" hitSlop={4}>
                <Text style={[type.caption, { color: palette.cyan, marginTop: 4 }]} numberOfLines={1}>{u.replace(/^https:\/\//, '')}</Text>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
