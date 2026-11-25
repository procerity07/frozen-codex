import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { Copy, Download, LayoutGrid, Maximize, Move, Plus, Search, Settings2, Share2, Trash, Users, X, ZoomIn, ZoomOut } from 'lucide-react-native';
import { palette, radius, space, tint, type } from '@/theme';
import { BottomSheet, Button, Chip, ChipRow, Field, NumberField, Row, Screen, SectionHeader, haptic } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import {
  canPlace, coordsOf, DEFAULT_OUTPOST_TILES, exportCode, findName, HIVE_COLOR_HEX, HIVE_COLORS, importCode, KIND_LABELS, KIND_SIZE, MAX_SIDE,
  MEMBER_COLOR, migrateHive, newHive, outpostAreas, parseMembers, pieceAt, putPiece, removePiece, resize, unplaced,
  type Hive, type HiveColor, type HivePiece, type PieceKind,
} from '@/lib/hive';

/** On-screen size of one map tile at 100% zoom. A castle is 2×2 tiles. */
const TILE = 34;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const KINDS: PieceKind[] = ['member', 'fort', 'gate', 'gather', 'warehouse', 'hospital', 'outpost', 'blocked'];
const KIND_FILL: Record<PieceKind, string> = {
  member: palette.surface, fort: palette.success, gate: palette.success, gather: palette.success, warehouse: palette.success, hospital: palette.success, outpost: palette.cyan, blocked: palette.textMuted,
};
const newId = () => `h${Date.now().toString(36)}`;

type Editing = { piece: HivePiece } | { col: number; row: number };

/**
 * Alliance hive planner on a grid of map tiles: castles, the Fort, the Gate and Alliance Gather cover 2×2 tiles,
 * outposts and blocked spots 1 tile. Tap an empty tile to place, tap a piece to edit or move it.
 */
export default function HivePlanner() {
  const stored = useAppStore((s) => s.hives);
  const saveHive = useAppStore((s) => s.saveHive);
  const removeHive = useAppStore((s) => s.removeHive);
  const hives = useMemo(() => stored.map((h) => migrateHive(h)), [stored]);
  const [activeId, setActiveId] = useState<string | null>(hives[0]?.id ?? null);
  const hive = hives.find((h) => h.id === activeId) ?? hives[0] ?? null;
  const { width } = useWindowDimensions();
  const [zoom, setZoom] = useState(1);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [moving, setMoving] = useState<HivePiece | null>(null);
  const [panel, setPanel] = useState<'none' | 'settings' | 'members' | 'import'>('none');
  const [query, setQuery] = useState('');

  const create = () => { const h = newHive(newId(), hives.length ? `Hive ${hives.length + 1}` : 'Main hive'); saveHive(h); setActiveId(h.id); };

  if (!hive) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Hive Planner' }} />
        <Text style={type.bodySecondary}>Plan where every alliance member's castle goes around the fort. The plan is made of map tiles: castles, the Gate, Alliance Warehouse and Alliance Hospital cover 2×2 tiles, the Fort 3×3, outposts 1 tile. Set one tile's coordinates and every castle shows its own X:Y for teleporting.</Text>
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <Button icon={Plus} label="New hive plan" onPress={create} />
          <Button icon={Download} variant="secondary" label="Import a shared plan" onPress={() => setPanel('import')} />
        </View>
        <ImportSheet open={panel === 'import'} onClose={() => setPanel('none')} onImport={(h) => { saveHive(h); setActiveId(h.id); }} />
      </Screen>
    );
  }

  const tile = Math.round(TILE * zoom);
  const W = tile * hive.cols;
  const H = tile * hive.rows;
  const hits = findName(hive, query);
  const hitIds = new Set(hits.map((p) => p.id));
  const waiting = unplaced(hive);
  const used = HIVE_COLORS.filter((c) => hive.pieces.some((p) => p.color === c));
  const fit = () => setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (width - space.md * 2) / (TILE * hive.cols))));
  const step = (f: number) => setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(z * f * 100) / 100)));

  const tapTile = (col: number, row: number) => {
    haptic();
    if (moving) {
      // Place the moving piece with its top-left on the tapped tile (nudged back inside the plan).
      const c = Math.min(col, hive.cols - moving.size);
      const r = Math.min(row, hive.rows - moving.size);
      const next = putPiece(hive, { ...moving, col: c, row: r });
      if (!next) { Alert.alert('No room there', `A ${KIND_LABELS[moving.kind].toLowerCase()} needs ${moving.size}×${moving.size} free tiles.`); return; }
      saveHive(next);
      setMoving(null);
      return;
    }
    const p = pieceAt(hive, col, row);
    setEditing(p ? { piece: p } : { col, row });
  };

  // Grid lines (no hook: this code runs after the early return above).
  const lines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
  for (let c = 0; c <= hive.cols; c++) lines.push({ x1: c * tile, y1: 0, x2: c * tile, y2: H, major: c % 2 === 0 });
  for (let r = 0; r <= hive.rows; r++) lines.push({ x1: 0, y1: r * tile, x2: W, y2: r * tile, major: r % 2 === 0 });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Hive Planner' }} />
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}>
        <ChipRow>
          {hives.map((h) => <Chip key={h.id} label={h.name} active={h.id === hive.id} onPress={() => setActiveId(h.id)} />)}
          <Chip label="+ New" onPress={create} />
        </ChipRow>
        <Row style={{ marginTop: space.xs }}>
          <View style={st.search}>
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
            {used.map((c) => <Row key={c} gap={4}><View style={[st.dot, { backgroundColor: HIVE_COLOR_HEX[c] }]} /><Text style={type.caption}>{hive.legend[c]}</Text></Row>)}
          </Row>
        ) : null}
        {moving ? (
          <Row style={[st.banner, { marginTop: 6 }]}>
            <Move size={15} color={palette.gold} />
            <Text style={[type.body, { flex: 1 }]}>Tap where {moving.kind === 'member' ? moving.name : KIND_LABELS[moving.kind]} should go (top-left tile).</Text>
            <Pressable onPress={() => setMoving(null)} accessibilityLabel="Cancel move"><X size={18} color={palette.textSecondary} /></Pressable>
          </Row>
        ) : (
          <Text style={[type.caption, { marginTop: 4 }]}>
            {query
              ? (hits.length ? hits.map((p) => { const c = coordsOf(hive, p.col, p.row); return `${p.name} X:${c.x} Y:${c.y}`; }).join(' · ') : 'No member with that name')
              : 'Tap an empty tile to place a castle; tap a castle to edit or move it.'}
          </Text>
        )}
      </View>

      <ScrollView style={{ flex: 1, marginTop: space.sm }} contentContainerStyle={{ paddingBottom: space.xxl }}>
        <ScrollView horizontal contentContainerStyle={{ padding: space.md }}>
          <View style={{ width: W, height: H }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={(e) => tapTile(Math.floor(e.nativeEvent.locationX / tile), Math.floor(e.nativeEvent.locationY / tile))}>
              <Svg width={W} height={H} pointerEvents="none">
                {lines.map((l, i) => <Line key={i} {...l} stroke={l.major ? palette.borderStrong : palette.border} strokeWidth={l.major ? 1 : 0.5} />)}
              </Svg>
            </Pressable>
            {outpostAreas(hive).map((a, i) => (
              <View key={`o${i}`} pointerEvents="none" style={{ position: 'absolute', left: a.col0 * tile, top: a.row0 * tile, width: (a.col1 - a.col0 + 1) * tile, height: (a.row1 - a.row0 + 1) * tile, borderWidth: 2, borderColor: palette.success, backgroundColor: tint(palette.success, 0.08) }} />
            ))}
            {hive.pieces.map((p) => {
              const fill = p.color ? HIVE_COLOR_HEX[p.color] : KIND_FILL[p.kind];
              const isRef = hive.ref.col === p.col && hive.ref.row === p.row;
              return (
                <Pressable key={p.id} onPress={() => { if (moving) return; haptic(); setEditing({ piece: p }); }}
                  style={[st.piece, { left: p.col * tile, top: p.row * tile, width: p.size * tile, height: p.size * tile, backgroundColor: tint(fill, p.kind === 'blocked' ? 0.5 : 0.35), borderColor: fill },
                    hitIds.has(p.id) && { borderColor: palette.text, borderWidth: 3 }, isRef && { borderColor: palette.cyan, borderWidth: 2 }, moving?.id === p.id && { opacity: 0.4 }]}
                  accessibilityLabel={p.kind === 'member' ? `${p.name}` : KIND_LABELS[p.kind]}>
                  {zoom >= 0.5 && p.size > 1 ? (
                    <Text style={[st.pieceText, { fontSize: Math.max(7, Math.round(10 * zoom)) }, p.kind !== 'member' && { fontWeight: '800' }]} numberOfLines={2}>
                      {p.kind === 'member' ? p.name : KIND_LABELS[p.kind].toUpperCase()}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>

      {editing ? (
        <PieceSheet hive={hive} editing={editing} waiting={waiting} onClose={() => setEditing(null)}
          onSave={(h) => { saveHive(h); setEditing(null); }}
          onMove={(p) => { setEditing(null); setMoving(p); }} />
      ) : null}
      <MembersSheet open={panel === 'members'} hive={hive} onClose={() => setPanel('none')} onSave={saveHive} />
      <SettingsSheet open={panel === 'settings'} hive={hive} onClose={() => setPanel('none')} onSave={saveHive}
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

function PieceSheet({ hive, editing, waiting, onClose, onSave, onMove }: {
  hive: Hive; editing: Editing; waiting: string[]; onClose: () => void; onSave: (h: Hive) => void; onMove: (p: HivePiece) => void;
}) {
  const existing = 'piece' in editing ? editing.piece : null;
  const col = existing ? existing.col : (editing as { col: number }).col;
  const row = existing ? existing.row : (editing as { row: number }).row;
  const [kind, setKind] = useState<PieceKind>(existing?.kind ?? 'member');
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState<HiveColor | undefined>(existing ? existing.color : MEMBER_COLOR);
  const c = coordsOf(hive, col, row);
  const suggestions = waiting.filter((m) => !name || m.toLowerCase().includes(name.toLowerCase())).slice(0, 12);

  const save = () => {
    const size = KIND_SIZE[kind];
    // New pieces near the bottom/right edge are nudged inside the plan.
    const pc = existing ? col : Math.min(col, hive.cols - size);
    const pr = existing ? row : Math.min(row, hive.rows - size);
    if (kind === 'member' && !name.trim()) { Alert.alert('Add a name', 'Type the member name or pick one from your list.'); return; }
    if (!canPlace(hive, pc, pr, size, existing?.id)) { Alert.alert('No room here', `A ${KIND_LABELS[kind].toLowerCase()} needs ${size}×${size} free tiles. Move or clear what is in the way.`); return; }
    const next = putPiece(hive, { id: existing?.id, kind, col: pc, row: pr, name, color });
    if (next) onSave(next);
  };

  return (
    <BottomSheet visible onClose={onClose} title={existing ? (existing.kind === 'member' ? existing.name ?? 'Castle' : KIND_LABELS[existing.kind]) : 'Place on the map'} subtitle={`X:${c.x} Y:${c.y}`}>
      <ChipRow>{KINDS.map((k) => <Chip key={k} label={`${KIND_LABELS[k]} (${KIND_SIZE[k]}×${KIND_SIZE[k]})`} active={kind === k} onPress={() => setKind(k)} />)}</ChipRow>
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
      <Row style={{ marginTop: space.md }}>
        {existing ? <View style={{ flex: 1 }}><Button variant="secondary" icon={Trash} label="Remove" onPress={() => onSave(removePiece(hive, existing.id))} /></View> : null}
        <View style={{ flex: 1 }}><Button label={existing ? 'Save' : 'Place'} onPress={save} /></View>
      </Row>
      {existing ? (
        <View style={{ marginTop: space.sm, gap: 4 }}>
          <Button compact variant="ghost" icon={Move} label="Move" onPress={() => onMove(existing)} />
          <Button compact variant="ghost" icon={LayoutGrid} label="Use this as the coordinate reference" onPress={() => onSave({ ...hive, ref: { col, row, x: c.x, y: c.y } })} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

function MembersSheet({ open, hive, onClose, onSave }: { open: boolean; hive: Hive; onClose: () => void; onSave: (h: Hive) => void }) {
  const [text, setText] = useState(hive.members.join('\n'));
  const waiting = unplaced(hive);
  return (
    <BottomSheet visible={open} onClose={onClose} title="Alliance members" subtitle={`${hive.members.length} listed · ${waiting.length} not placed yet`}>
      <Text style={type.caption}>Paste your member list, one name per line (or separated by commas). Placed names drop off the "not placed" list.</Text>
      <TextInput value={text} onChangeText={setText} multiline placeholder={'Crisa\nSemiX\n~-Ice-~'} placeholderTextColor={palette.textMuted} style={[type.body, st.textarea]} autoCapitalize="none" />
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
        <NumberField label={`Width in tiles (max ${MAX_SIDE})`} value={hive.cols} onChange={(n) => onSave(resize(hive, n, hive.rows))} />
        <NumberField label={`Height in tiles (max ${MAX_SIDE})`} value={hive.rows} onChange={(n) => onSave(resize(hive, hive.cols, n))} />
      </Row>
      <Text style={[type.caption, { marginTop: 4 }]}>A castle is 2×2 tiles, so 24×24 tiles fits 12×12 castles.</Text>
      <SectionHeader title="Coordinates" subtitle={`Reference: tile ${hive.ref.col + 1}, ${hive.ref.row + 1} (outlined in cyan)`} />
      <Row>
        <NumberField label="Its X" value={hive.ref.x} onChange={(x) => set({ ref: { ...hive.ref, x } })} />
        <NumberField label="Its Y" value={hive.ref.y} onChange={(y) => set({ ref: { ...hive.ref, y } })} />
      </Row>
      <Row style={{ marginTop: space.sm, justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={type.body}>Y goes up as you move down the plan</Text>
          <Text style={type.caption}>Check two castles in-game: if the lower one has the bigger Y, leave this on.</Text>
        </View>
        <Switch value={hive.yDown} onValueChange={(yDown) => set({ yDown })} trackColor={{ true: palette.cyan, false: palette.border }} thumbColor={palette.text} />
      </Row>
      <Row style={{ marginTop: space.sm }}>
        <NumberField label="Outpost territory (tiles wide)" value={hive.outpostTiles ?? DEFAULT_OUTPOST_TILES} onChange={(n) => set({ outpostTiles: Math.max(2, Math.min(40, n || DEFAULT_OUTPOST_TILES)) })} />
      </Row>
      <SectionHeader title="Colour meanings" subtitle="Rename to match your alliance" />
      {HIVE_COLORS.map((k) => (
        <Row key={k} style={{ marginBottom: 6, alignItems: 'center' }}>
          <View style={[st.dot, { backgroundColor: HIVE_COLOR_HEX[k], width: 14, height: 14 }]} />
          <TextInput value={hive.legend[k]} onChangeText={(v) => set({ legend: { ...hive.legend, [k]: v.slice(0, 24) } })} style={[type.body, st.legendInput]} placeholderTextColor={palette.textMuted} />
        </Row>
      ))}
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
    <BottomSheet visible={open} onClose={onClose} title="Import a hive plan" subtitle="Paste the code someone shared (starts with FCHIVE)">
      <TextInput value={text} onChangeText={setText} multiline placeholder="FCHIVE2:{...}" placeholderTextColor={palette.textMuted} style={[type.body, st.textarea]} autoCapitalize="none" autoCorrect={false} />
      <Button icon={Download} label="Import" onPress={() => {
        try { onImport(importCode(text, newId())); setText(''); onClose(); }
        catch (e) { Alert.alert('Could not import', e instanceof Error ? e.message : String(e)); }
      }} />
    </BottomSheet>
  );
}

const st = StyleSheet.create({
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, paddingHorizontal: space.sm },
  piece: { position: 'absolute', borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center', padding: 2 },
  pieceText: { color: palette.text, fontWeight: '600', textAlign: 'center' },
  banner: { alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.goldLine, borderRadius: radius.md, padding: space.sm, backgroundColor: palette.surface },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 9 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  swatch: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: palette.border },
  swatchOn: { borderColor: palette.cyan, backgroundColor: palette.cyanDim },
  textarea: { minHeight: 140, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: space.sm, marginVertical: space.sm, textAlignVertical: 'top' },
  legendInput: { flex: 1, borderWidth: 1, borderColor: palette.border, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 6 },
});
