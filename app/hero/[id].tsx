import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ClipboardCheck, Crosshair, Gem, Shield, Sparkles, Swords, Users } from 'lucide-react-native';
import type { CombatRole, Hero, HeroAuditField, Match3Skill } from '@/types/game';
import { getHero } from '@/db/repo';
import { bondGroups, events } from '@/data/seed';
import { CurioCard } from '@/components/domain/CurioCard';
import { elementColors, palette, rarityColors, rarityLabels, space, tint, type } from '@/theme';
import { Badge, Card, Chip, ChipRow, ConfidenceNote, ElementEmblem, EmptyState, RarityStars, Row, Screen, CollapsibleSection, MoreText, TroopEmblem } from '@/components/ui';
import { combatRoleLabel, isFieldVerified, skillsCheckedInGame } from '@/lib/heroData';
import { MyHeroCard } from '@/components/domain/MyHeroCard';
import { SkillValues } from '@/components/domain/SkillValues';
import { cleanSourceNotes, withoutTierSentence } from '@/lib/text';
import { gridFromTiers, parseTierText, type TierGrid } from '@/lib/tiers';
import { clampEntry, type RosterEntry } from '@/lib/roster';
import { useAppStore } from '@/store/useAppStore';
import { HeroPortrait } from '@/components/domain/HeroPortrait';

const ROLE_COLORS: Record<CombatRole, string> = { Damage: palette.danger, Support: palette.cyan, Healer: palette.success };

/** Small marker for a section whose content no source has confirmed. */
function Unverified({ hero, field }: { hero: Hero; field: HeroAuditField }) {
  if ((field === 'marchSkills' || field === 'match3Skill') && !skillsCheckedInGame(hero)) return <Badge label="Not checked in-game" color={palette.warning} />;
  return isFieldVerified(hero, field) ? null : <Badge label="Not verified" color={palette.textMuted} />;
}

/** Skill text without source remarks: current value + folded level grid when the numbers can be read, then the rest of the text. */
function SkillBody({ text, entry, grid, unit, requirement }: { text: string; entry?: RosterEntry; grid?: TierGrid; unit?: string; requirement?: string }) {
  const unlock = Number(/unlocks at (?:lv\.|level)\s*(\d+)/i.exec(`${text} ${requirement ?? ''}`)?.[1] ?? 0);
  const g = grid && Object.keys(grid).length ? grid : parseTierText(text);
  const clean = cleanSourceNotes(text);
  const rest = g ? withoutTierSentence(clean) : clean;
  return (
    <>
      {g ? <SkillValues grid={g} entry={entry} unit={unit ?? '%'} lockedAt={entry && unlock > entry.level ? unlock : undefined} /> : null}
      {rest ? <MoreText text={rest} style={[type.bodySecondary, { marginTop: 4 }]} /> : null}
    </>
  );
}

function Match3Section({ hero, m3 }: { hero: Hero; m3: Match3Skill }) {
  return (
    <>
      <CollapsibleSection title="Match-3 tactical skill" icon={Sparkles} right={<Unverified hero={hero} field="match3Skill" />}>
      <Card accent={elementColors[hero.element]}>
        <Text style={type.heading}>{m3.name}</Text>
        <MoreText text={cleanSourceNotes(m3.description)} style={[type.bodySecondary, { marginTop: 4 }]} />
        <Row style={{ marginTop: space.md, flexWrap: 'wrap' }}>
          {m3.charge ? <Badge label={`Charge: ${m3.charge}`} color={palette.cyan} /> : null}
          <Badge label={m3.pattern} />
          {m3.effects.map((e) => <Badge key={e} label={e} color={palette.gold} />)}
        </Row>
      </Card>
      </CollapsibleSection>
    </>
  );
}

export default function HeroDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [hero, setHero] = useState<Hero | null | undefined>(undefined);
  useEffect(() => { getHero(String(id)).then(setHero).catch(() => setHero(null)); }, [id]);
  const rawEntry = useAppStore((st) => st.roster[String(id)]);

  if (hero === undefined) return <Screen><Stack.Screen options={{ title: '' }} /></Screen>;
  if (!hero) return <Screen><Stack.Screen options={{ title: 'Not found' }} /><EmptyState title="Hero not found" /></Screen>;
  const entry = rawEntry ? clampEntry(hero, rawEntry) : undefined;

  const rc = rarityColors[hero.rarity];
  const groups = bondGroups.filter((g) => g.members.includes(hero.id));
  const featuredIn = events.filter((e) => e.featuredHeroes.includes(hero.id));
  const roleLabel = combatRoleLabel(hero);

  return (
    <Screen>
      <Stack.Screen options={{ title: hero.name }} />
      <Card style={{ borderColor: tint(rc, 0.5) }}>
        <Row gap={space.md}>
          <HeroPortrait hero={hero} size={72} />
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

      <MyHeroCard hero={hero} />


      {!skillsCheckedInGame(hero) ? (
        <Card accent={palette.warning}>
          <Text style={[type.body, { fontWeight: '600' }]}>Skills not checked in-game yet</Text>
          <Text style={[type.caption, { marginTop: 2 }]}>This hero's troop and hero skills come from the wiki or older data and may be wrong. Screenshots of the Troop Skill and Hero Skill tabs will fix them.</Text>
        </Card>
      ) : null}

      {hero.marchSkills.length ? (
        <>
          <CollapsibleSection title="March military skills" subtitle="Active when the hero leads or joins a march" icon={Swords} right={<Unverified hero={hero} field="marchSkills" />}>
          {hero.marchSkills.map((sk) => (
            <Card key={sk.name}>
              <Text style={type.heading}>{sk.name}</Text>
              <SkillBody text={sk.description} entry={entry} />
            </Card>
          ))}
          </CollapsibleSection>
        </>
      ) : null}

      {hero.civilSkills.length ? (
        <>
          <CollapsibleSection title="Passive civil skills" subtitle="Own-only — active without marching" icon={Shield} right={<Unverified hero={hero} field="civilSkills" />}>
          {hero.civilSkills.map((sk) => (
            <Card key={sk.name} accent={palette.gold}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={[type.heading, { flex: 1 }]}>{sk.name}</Text>
                {sk.value ? <Text style={[type.number, { color: palette.gold }]}>{sk.value < 0 ? '' : '+'}{sk.value}%</Text> : null}
              </Row>
              <SkillBody text={sk.description} entry={entry} grid={sk.tiers ? gridFromTiers(sk.tiers) : undefined} unit={sk.unit} requirement={sk.requirement} />
              <Text style={[type.caption, { marginTop: 4, color: palette.gold }]}>{cleanSourceNotes(sk.requirement)}</Text>
            </Card>
          ))}
          </CollapsibleSection>
        </>
      ) : null}

      {hero.match3Skill ? <Match3Section hero={hero} m3={hero.match3Skill} /> : null}

      <CollapsibleSection title="How to get" icon={Gem} right={<Unverified hero={hero} field="sources" />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {hero.sources.map((s) => <Badge key={s} label={s} color={palette.text} />)}
      </View>
      {featuredIn.length ? (
        <ChipRow>{featuredIn.map((e) => <Chip key={e.id} label={e.name} onPress={() => router.push(`/event/${e.id}`)} />)}</ChipRow>
      ) : null}
      </CollapsibleSection>

      {hero.rarity >= 5 ? (
      <CollapsibleSection title="Bonds & curio" icon={Users}>
      {groups.map((g) => (
        <Card key={g.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={[type.heading, { flex: 1 }]}>{g.name}</Text>
            {g.verified === false || g.bonusesVerified === false ? <Badge label={g.verified === false ? 'Not verified' : 'Bonuses not verified'} color={palette.textMuted} /> : null}
          </Row>
          {g.bonuses.map((b, i) => <Text key={i} style={type.bodySecondary}>{b.level > 0 ? `Lv. ${b.level}: ` : ''}{b.effect}</Text>)}
        </Card>
      ))}
      <CurioCard hero={hero} />
      </CollapsibleSection>
      ) : null}


      {hero.audit ? (
        <>
          <CollapsibleSection title="Sources & notes" subtitle={`Where this data comes from · checked ${hero.audit.checkedOn}`} icon={ClipboardCheck} initiallyOpen={false}>
          <Card>
            {hero.notes ? <Text style={[type.body, { marginBottom: 6 }]}>{hero.notes}</Text> : null}
            {hero.audit.notes.map((n, i) => <Text key={i} style={[type.bodySecondary, { marginBottom: 6 }]}>{n}</Text>)}
            {hero.audit.sourceUrls.map((u) => (
              <Pressable key={u} onPress={() => { WebBrowser.openBrowserAsync(u).catch(() => undefined); }} accessibilityRole="link" hitSlop={4}>
                <Text style={[type.caption, { color: palette.cyan, marginTop: 4 }]} numberOfLines={1}>{u.replace(/^https:\/\//, '')}</Text>
              </Pressable>
            ))}
          </Card>
          </CollapsibleSection>
        </>
      ) : null}
    </Screen>
  );
}
