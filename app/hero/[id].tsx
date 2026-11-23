import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Gem, Shield, Sparkles, Swords, Users } from 'lucide-react-native';
import type { Hero } from '@/types/game';
import { getHero } from '@/db/repo';
import { bondGroups, curios, events } from '@/data/seed';
import { elementColors, palette, rarityColors, rarityLabels, space, tint, type } from '@/theme';
import { Badge, Card, Chip, ChipRow, ConfidenceNote, ElementEmblem, EmptyState, RarityStars, Row, Screen, SectionHeader, TroopEmblem } from '@/components/ui';

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
            <Text style={type.bodySecondary}>{hero.title}</Text>
            <Row gap={6}><RarityStars rarity={hero.rarity} /><Text style={[type.caption, { color: rc }]}>{rarityLabels[hero.rarity]}</Text></Row>
          </View>
        </Row>
        <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
          <Row gap={6}><ElementEmblem element={hero.element} size={20} /><Text style={[type.body, { color: elementColors[hero.element] }]}>{hero.element}</Text></Row>
          <Row gap={6}><TroopEmblem type={hero.unitType} size={20} /><Text style={type.body}>{hero.unitType}</Text></Row>
          <Badge label={hero.role} color={palette.cyan} />
        </Row>
        <ConfidenceNote confidence={hero.confidence} />
      </Card>

      {hero.marchSkills.length ? (
        <>
          <SectionHeader title="March military skills" subtitle="Active when the hero leads or joins a march" icon={Swords} />
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
          <SectionHeader title="Passive civil skills" subtitle="Own-only — active without marching" icon={Shield} />
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

      <SectionHeader title="Match-3 tactical skill" icon={Sparkles} />
      <Card accent={elementColors[hero.element]}>
        <Text style={type.heading}>{hero.match3Skill.name}</Text>
        <Text style={[type.bodySecondary, { marginTop: 4 }]}>{hero.match3Skill.description}</Text>
        <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
          <Badge label={`Charge: ${hero.match3Skill.charge}`} color={palette.cyan} />
          <Badge label={hero.match3Skill.pattern} />
          {hero.match3Skill.effects.map((e) => <Badge key={e} label={e} color={palette.gold} />)}
        </Row>
      </Card>

      <SectionHeader title="Acquisition" icon={Gem} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {hero.sources.map((s) => <Badge key={s} label={s} color={palette.text} />)}
      </View>
      {featuredIn.length ? (
        <ChipRow>{featuredIn.map((e) => <Chip key={e.id} label={e.name} onPress={() => router.push(`/event/${e.id}`)} />)}</ChipRow>
      ) : null}

      {groups.length || curio ? <SectionHeader title="Bonds & curio" icon={Users} /> : null}
      {groups.map((g) => (
        <Card key={g.id} style={{ marginBottom: space.sm }}>
          <Text style={type.heading}>{g.name}</Text>
          {g.bonuses.map((b) => <Text key={b.level} style={type.bodySecondary}>Lv. {b.level}: {b.effect}</Text>)}
        </Card>
      ))}
      {curio ? (
        <Card accent={palette.gold}>
          <Text style={type.heading}>{curio.name}</Text>
          <Text style={type.bodySecondary}>{curio.legionPassive}</Text>
          <Text style={type.bodySecondary}>{curio.heroAttribute}</Text>
          {curio.exclusivePassive ? <Text style={[type.bodySecondary, { color: palette.gold }]}>{curio.exclusivePassive}</Text> : null}
        </Card>
      ) : null}

      <SectionHeader title="Notes" />
      <Card><Text style={type.body}>{hero.notes}</Text></Card>
    </Screen>
  );
}
