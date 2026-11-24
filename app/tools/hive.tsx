import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { Copy, Download, LayoutGrid, Maximize, Plus, Search, Settings2, Share2, Trash, Users, ZoomIn, ZoomOut } from 'lucide-react-native';
import { palette, radius, space, tint, type } from '@/theme';
import { BottomSheet, Button, Card, Chip, ChipRow, EmptyState, Field, NumberField, Row, Screen, SectionHeader, haptic } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import {
  cellAt, coordsOf, exportCode, findName, HIVE_COLOR_HEX, HIVE_COLORS, importCode, KIND_LABELS, MAX_SIDE, newHive, normalizeLegend, parseMembers, resize, setCell, unplaced,
  type CellKind, type Hive, type HiveColor,
} from '@/lib/hive';

const CELL = 66;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 1.8;
const KINDS: CellKind[] = ['member', 'fort', 'gate', 'gather', 'marker', 'blocked', 'empty'];
const KIND_COLOR: Record<CellKind, string> = {
  empty: palette.surface, member: palette.surface, fort: palette.success, gate: palette.success, gather: palette.success, marker: palette.cyan, blocked: palette.bg,
};
const newId = () => `h${Date.now().toString(36)}`;

/** Alliance hive planner: a grid of castle spots (one square = one 2x2 castle) with names, special squares and coordinates. */
export default function HivePlanner() {
  const hives = useAppStore((s) => s.hives);
  const saveHive = useAppStore((s) => s.saveHive);
  const removeHive = useAppStore((s) => s.removeHive);
  const [activeId, setActiveId] = useState<string | null>(hives[0]?.id ?? null);
  const found = hives.find((h) => h.id === activeId) ?? hives[0] ?? null;
  const hive = found ? { ...found, legend: normalizeLegend(found.legend) } : null;
  const { width } = useWindowDimensions();
  const [zoom, setZoom] = useState(1);
  const [editing, setEditing] = useState<{ col: number; row: number } | null>(null);
  const [panel, setPanel] = useState<'none' | 'settings' | 'members' | 'import'>('none');
  const [query, setQuery] = useState('');

  const hits = useMemo(() => (hive ? findName(hive, query) : []), [hive, query]);
  const hitSet = new Set(hits.map((h) => `${h.col},${h.row}`));

  const create = () => { const h = newHive(newId(), hives.length ? `Hive ${hives.length + 1}` : 'Main hive'); saveHive(h); setActiveId(h.id); };
  const update = (h: Hive) => saveHive(h);

  if (!hive) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Hive Planner' }} />
        <Text style={type.bodySecondary}>Plan where every alliance member's castle goes around the fort. One square is one castle (2×2 tiles); set one square's coordinates and every spot shows its own X:Y for teleporting.</Text>
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <Button icon={Plus} label="New hive plan" onPress={create} />
          <Button icon={Download} variant="secondary" label="Import a shared plan" onPress={() => setPanel('import')} />
        </View>
        <ImportSheet open={panel === 'import'} onClose={() => setPanel('none')} onImport={(h) => { saveHive(h); setActiveId(h.id); }} />
      </Screen>
    );
  }

  const waiting = unplaced(hive);
  const ref = coordsOf(hive, hive.ref.col, hive.ref.row);
  const size = Math.round(CELL * zoom);
  const fit = () => setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (width - space.md * 2) / (CELL * hive.cols))));
  const step = (f: number) => setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * f * 100) / 100)));
  const used = HIVE_COLORS.filter((c) => hive.cells.some((x) => x.color === c));

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Hive Planner' }} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
        <ChipRow>
          {hives.map((h) => <Chip key={h.id} label={h.name} active={h.id === hive.id} onPress={() => setActiveId(h.id)} />)}
          <Chip label="+ New" onPress={create} />
        </ChipRow>
        <Row style={{ marginTop: space.xs }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, paddingHorizontal: space.sm }}>
            <Search size={15} color={palette.textMuted} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Find a member" placeholderTextColor={palette.textMuted} style={[type.body, { flex: 1, paddingVertical: 8 }]} autoCapitalize="none" />
          </View>
          <IconPill icon={Users} label={`${waiting.length}`} onPress={() => setPanel('members')} />
          <IconPill icon={Settings2} onPress={() => setPanel('settings')} />
          <IconPill icon={Share2} onPress={() => { Share.share({ message: exportCode(hive) }).catch(() => undefined); }} />
        </Row>
        <Row style={{ marginTop: space.xs, alignItems: 'center' }}>
          <IconPill icon={ZoomOut} onPress={() => step(1 / 1.25)} />
          <IconPill icon={ZoomIn} onPress={() => step(1.25)} />
          <IconPill icon={Maximize} label="Fit" onPress={fit} />
          <Text style={[type.caption, { marginLeft: 4 }]}>{Math.round(zoom * 100)}%</Text>
        </Row>
        {used.length ? (
          <Row style={{ marginTop: 6, flexWrap: 'wrap' }} gap={8}>
            {used.map((c) => (
              <Row key={c} gap={4}><View style={[st.dot, { backgroundColor: HIVE_COLOR_HEX[c] }]} /><Text style={type.caption}>{hive.legend[c]}</Text></Row>
            ))}
          </Row>
        ) : null}
        <Text style={[type.caption, { marginTop: 4 }]}>
          {query ? (hits.length ? `${hits.length} match${hits.length > 1 ? 'es' : ''}: ${hits.map((h) => { const c = coordsOf(hive, h.col, h.row); return `X:${c.x} Y:${c.y}`; }).join(' · ')}` : 'No member with that name')
            : `Tap a square to edit. Reference square: X:${ref.x} Y:${ref.y}`}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, marginTop: space.sm }} contentContainerStyle={{ paddingBottom: space.xxl }}>
        <ScrollView horizontal contentContainerStyle={{ padding: space.md }}>
          <View>
            {Array.from({ length: hive.rows }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row' }}>
                {Array.from({ length: hive.cols }, (_, col) => {
                  const c = cellAt(hive, col, row);
                  const hit = hitSet.has(`${col},${row}`);
                  const isRef = hive.ref.col === col && hive.ref.row === row;
                  return (
                    <Pressable key={col} onPress={() => { haptic(); setEditing({ col, row }); }}
                      style={[st.cell, { width: size, height: size },
                        { backgroundColor: c.color ? tint(HIVE_COLOR_HEX[c.color], 0.4) : c.kind === 'member' || c.kind === 'empty' ? palette.surface : tint(KIND_COLOR[c.kind], c.kind === 'blocked' ? 1 : 0.35) },
                        c.color && { borderColor: HIVE_COLOR_HEX[c.color] },
                        c.kind === 'blocked' && { borderColor: palette.bg }, hit && { borderColor: palette.gold, borderWidth: 2 }, isRef && { borderColor: palette.cyan }]}
                      accessibilityLabel={`Square ${col + 1}, ${row + 1}: ${c.kind === 'member' ? c.name : KIND_LABELS[c.kind]}${c.color ? `, ${hive.legend[c.color]}` : ''}`}>
                      {zoom >= 0.5 ? (
                        <Text style={[st.cellText, { fontSize: Math.max(7, Math.round(10 * zoom)) }, c.kind !== 'member' && { color: palette.textSecondary, fontWeight: '700' }]} numberOfLines={2}>
                          {c.kind === 'member' ? c.name : c.kind === 'empty' || c.kind === 'blocked' ? '' : KIND_LABELS[c.kind].toUpperCase()}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {editing ? (
        <CellSheet hive={hive} at={editing} waiting={waiting} onClose={() => setEditing(null)}
          onSave={(h) => { update(h); setEditing(null); }} />
      ) : null}
      <MembersSheet open={panel === 'members'} hive={hive} onClose={() => setPanel('none')} onSave={update} />
      <SettingsSheet open={panel === 'settings'} hive={hive} onClose={() => setPanel('none')} onSave={update}
        onImport={() => setPanel('import')}
        onDelete={() => Alert.alert('Delete this plan?', `"${hive.name}" will be removed from this phone.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => { removeHive(hive.id); setActiveId(null); setPanel('none'); } },
        ])} />
      <ImportSheet open={panel === 'import'} onClose={() => setPanel('none')} onImport={(h) => { saveHive(h); setActiveId(h.id); }} />
    </View>
  );
}

function IconPill({ icon: Icon, label, onPress }: { icon: typeof Users; label?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={st.pill} accessibilityRole="button">
      <Icon size={16} color={palette.cyan} />
      {label ? <Text style={[type.numberSmall, { color: palette.cyan }]}>{label}</Text> : null}
    </Pressable>
  );
}

function CellSheet({ hive, at, waiting, onClose, onSave }: { hive: Hive; at: { col: number; row: number }; waiting: string[]; onClose: () => void; onSave: (h: Hive) => void }) {
  const cur = cellAt(hive, at.col, at.row);
  const [kind, setKind] = useState<CellKind>(cur.kind === 'empty' ? 'member' : cur.kind);
  const [name, setName] = useState(cur.name ?? '');
  const [color, setColor] = useState<HiveColor | undefined>(cur.color);
  const c = coordsOf(hive, at.col, at.row);
  const suggestions = waiting.filter((m) => !name || m.toLowerCase().includes(name.toLowerCase())).slice(0, 12);
  return (
    <BottomSheet visible onClose={onClose} title={cur.kind === 'member' && cur.name ? cur.name : 'Edit square'} subtitle={`X:${c.x} Y:${c.y} · column ${at.col + 1}, row ${at.row + 1}`}>
      <ChipRow>{KINDS.map((k) => <Chip key={k} label={KIND_LABELS[k]} active={kind === k} onPress={() => setKind(k)} />)}</ChipRow>
      {kind === 'member' ? (
        <>
          <Field label="Member name" value={name} onChangeText={setName} autoCapitalize="none" placeholder="Type or pick below" />
          {suggestions.length ? (
            <>
              <Text style={[type.caption, { marginTop: space.sm }]}>Not placed yet</Text>
              <ChipRow>{suggestions.map((m) => <Chip key={m} label={m} onPress={() => setName(m)} />)}</ChipRow>
            </>
          ) : null}
        </>
      ) : null}
      {kind !== 'empty' ? (
        <>
          <Text style={[type.caption, { marginTop: space.md }]}>Colour (optional)</Text>
          <Row style={{ marginTop: 6, flexWrap: 'wrap' }} gap={6}>
            <Pressable onPress={() => setColor(undefined)} style={[st.swatch, !color && st.swatchOn]}><Text style={type.caption}>None</Text></Pressable>
            {HIVE_COLORS.map((k) => (
              <Pressable key={k} onPress={() => { haptic(); setColor(k); }} style={[st.swatch, color === k && st.swatchOn]} accessibilityLabel={hive.legend[k]}>
                <View style={[st.dot, { backgroundColor: HIVE_COLOR_HEX[k] }]} />
                <Text style={type.caption}>{hive.legend[k]}</Text>
              </Pressable>
            ))}
          </Row>
        </>
      ) : null}
      <Row style={{ marginTop: space.md }}>
        <View style={{ flex: 1 }}><Button variant="secondary" label="Clear" onPress={() => onSave(setCell(hive, at.col, at.row, { kind: 'empty' }))} /></View>
        <View style={{ flex: 1 }}><Button label="Save" onPress={() => onSave(setCell(hive, at.col, at.row, { kind, name, color }))} /></View>
      </Row>
      <View style={{ marginTop: space.sm }}>
        <Button compact variant="ghost" icon={LayoutGrid} label="Use this square as the coordinate reference" onPress={() => onSave({ ...hive, ref: { col: at.col, row: at.row, x: c.x, y: c.y } })} />
      </View>
    </BottomSheet>
  );
}

function MembersSheet({ open, hive, onClose, onSave }: { open: boolean; hive: Hive; onClose: () => void; onSave: (h: Hive) => void }) {
  const [text, setText] = useState(hive.members.join('\n'));
  const waiting = unplaced(hive);
  return (
    <BottomSheet visible={open} onClose={onClose} title="Alliance members" subtitle={`${hive.members.length} listed · ${waiting.length} not placed yet`}>
      <Text style={type.caption}>Paste your member list, one name per line (or separated by commas). Placed names drop off the "not placed" list.</Text>
      <TextInput value={text} onChangeText={setText} multiline placeholder={'Crisa\nSemiX\n~-Ice-~'} placeholderTextColor={palette.textMuted}
        style={[type.body, st.textarea]} autoCapitalize="none" />
      <Button label="Save list" onPress={() => { onSave({ ...hive, members: parseMembers(text) }); onClose(); }} />
      {waiting.length ? <Text style={[type.caption, { marginTop: space.md }]}>Not placed: {waiting.join(', ')}</Text> : null}
    </BottomSheet>
  );
}

function SettingsSheet({ open, hive, onClose, onSave, onDelete, onImport }: { open: boolean; hive: Hive; onClose: () => void; onSave: (h: Hive) => void; onDelete: () => void; onImport: () => void }) {
  const set = (patch: Partial<Hive>) => onSave({ ...hive, ...patch });
  return (
    <BottomSheet visible={open} onClose={onClose} title="Plan settings">
      <Field label="Plan name" value={hive.name} onChangeText={(name) => set({ name })} />
      <Row style={{ marginTop: space.sm }}>
        <NumberField label={`Columns (max ${MAX_SIDE})`} value={hive.cols} onChange={(n) => onSave(resize(hive, n, hive.rows))} />
        <NumberField label={`Rows (max ${MAX_SIDE})`} value={hive.rows} onChange={(n) => onSave(resize(hive, hive.cols, n))} />
      </Row>
      <SectionHeader title="Coordinates" subtitle={`Reference square: column ${hive.ref.col + 1}, row ${hive.ref.row + 1} (outlined in cyan)`} />
      <Row>
        <NumberField label="Its X" value={hive.ref.x} onChange={(x) => set({ ref: { ...hive.ref, x } })} />
        <NumberField label="Its Y" value={hive.ref.y} onChange={(y) => set({ ref: { ...hive.ref, y } })} />
        <NumberField label="Tiles per square" value={hive.step} onChange={(step) => set({ step: Math.max(1, Math.min(10, step || 2)) })} />
      </Row>
      <Row style={{ marginTop: space.sm, justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={type.body}>Y goes up as you move down the plan</Text>
          <Text style={type.caption}>Check two castles in-game: if the lower one has the bigger Y, leave this on.</Text>
        </View>
        <Switch value={hive.yDown} onValueChange={(yDown) => set({ yDown })} trackColor={{ true: palette.cyan, false: palette.border }} thumbColor={palette.text} />
      </Row>
      <SectionHeader title="Colour meanings" subtitle="Rename to match your alliance" />
      {HIVE_COLORS.map((k) => (
        <Row key={k} style={{ marginBottom: 6, alignItems: 'center' }}>
          <View style={[st.dot, { backgroundColor: HIVE_COLOR_HEX[k], width: 14, height: 14 }]} />
          <TextInput value={hive.legend[k]} onChangeText={(v) => set({ legend: { ...hive.legend, [k]: v.slice(0, 24) } })} style={[type.body, st.legendInput]} placeholderTextColor={palette.textMuted} />
        </Row>
      ))}
      <Text style={[type.caption, { marginTop: space.sm }]}>A castle is 2×2 tiles, so neighbouring spots are 2 apart. Tap any square and choose "Use this square as the coordinate reference" to move the reference.</Text>
      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <Button icon={Copy} variant="secondary" label="Share plan code" onPress={() => { Share.share({ message: exportCode(hive) }).catch(() => undefined); }} />
        <Button icon={Download} variant="secondary" label="Import a shared plan" onPress={onImport} />
        <Button icon={Trash} variant="ghost" label="Delete this plan" onPress={onDelete} />
      </View>
    </BottomSheet>
  );
}

function ImportSheet({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (h: Hive) => void }) {
  const [text, setText] = useState('');
  return (
    <BottomSheet visible={open} onClose={onClose} title="Import a hive plan" subtitle="Paste the code someone shared (starts with FCHIVE1:)">
      <TextInput value={text} onChangeText={setText} multiline placeholder="FCHIVE1:{...}" placeholderTextColor={palette.textMuted} style={[type.body, st.textarea]} autoCapitalize="none" autoCorrect={false} />
      <Button icon={Download} label="Import" onPress={() => {
        try { onImport(importCode(text, newId())); setText(''); onClose(); }
        catch (e) { Alert.alert('Could not import', e instanceof Error ? e.message : String(e)); }
      }} />
    </BottomSheet>
  );
}

const st = StyleSheet.create({
  cell: { width: CELL, height: CELL, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border, alignItems: 'center', justifyContent: 'center', padding: 2 },
  cellText: { color: palette.text, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 9 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  swatch: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border },
  swatchOn: { borderColor: palette.cyan, backgroundColor: palette.cyanDim },
  legendInput: { flex: 1, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6 },
  textarea: { minHeight: 140, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: space.sm, marginVertical: space.sm, textAlignVertical: 'top' },
});
