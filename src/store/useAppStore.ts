import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { TroopFocus } from '@/types/game';
import type { RosterEntry } from '@/lib/roster';
import { weekIndex } from '@/lib/time';
import type { BuildBonuses, ResourceKey } from '@/lib/calculators';

export interface Castle { id: string; name: string; kind: 'main' | 'farm' }

export interface AppState {
  troopFocus: TroopFocus;
  realm: { number: string; ageWeeks: number; server: string; lordName: string };
  castles: Castle[];
  checklist: { dateKey: string; done: Record<string, boolean> };
  cooldowns: Record<string, number>;
  claimedCodes: string[];
  aceLordAnchorWeek: number;
  rotationAnchorWeek: number;
  alarms: Record<string, boolean>;
  alarmLeadMinutes: number;
  manifestUrl: string;
  bagInventory: Record<string, number>;
  citadel: { from: number; to: number; owned: Partial<Record<ResourceKey, number>>; bonuses: BuildBonuses };
  savedCalcs: Record<string, Record<string, number>>;
  /** App version whose update banner the user dismissed with "Later". */
  dismissedUpdate: string;
  /** My Heroes: owned heroes by id. Entries are re-validated against game rules wherever they are read. */
  roster: Record<string, RosterEntry>;

  setTroopFocus: (f: TroopFocus) => void;
  setRealm: (r: Partial<AppState['realm']>) => void;
  addCastle: (name: string) => void;
  removeCastle: (id: string) => void;
  renameCastle: (id: string, name: string) => void;
  toggleCheck: (castleId: string, itemId: string, todayKey: string) => void;
  startCooldown: (castleId: string, itemId: string, at: number) => void;
  toggleClaimed: (code: string) => void;
  flipCycle: (now: Date) => void;
  setRotationWeek: (now: Date, week: 1 | 2 | 3 | 4) => void;
  setAlarm: (eventId: string, on: boolean) => void;
  setAlarmLead: (m: number) => void;
  setManifestUrl: (u: string) => void;
  setBagQty: (id: string, qty: number) => void;
  resetBag: () => void;
  setCitadel: (c: Partial<AppState['citadel']>) => void;
  saveCalc: (key: string, values: Record<string, number>) => void;
  importState: (data: Partial<PersistedState>) => void;
  dismissUpdate: (version: string) => void;
  setRosterEntry: (heroId: string, entry: RosterEntry) => void;
  removeFromRoster: (heroId: string) => void;
}

export type PersistedState = Omit<AppState, { [K in keyof AppState]: AppState[K] extends (...a: never[]) => unknown ? K : never }[keyof AppState]>;

const now = new Date();

export const defaultState: PersistedState = {
  troopFocus: 'All',
  realm: { number: '', ageWeeks: 0, server: '', lordName: '' },
  castles: [{ id: 'main', name: 'Main Castle', kind: 'main' }],
  checklist: { dateKey: '', done: {} },
  cooldowns: {},
  claimedCodes: [],
  aceLordAnchorWeek: weekIndex(now),
  rotationAnchorWeek: weekIndex(now),
  alarms: {},
  alarmLeadMinutes: 10,
  manifestUrl: '',
  bagInventory: {},
  citadel: { from: 15, to: 25, owned: {}, bonuses: { civilSpeedPct: 0, builderGearPct: 0, vipPct: 0, institutePct: 0, costReductionPct: 0 } },
  savedCalcs: {},
  dismissedUpdate: '',
  roster: {},
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      setTroopFocus: (troopFocus) => set({ troopFocus }),
      setRealm: (r) => set({ realm: { ...get().realm, ...r } }),
      addCastle: (name) => set({ castles: [...get().castles, { id: `farm-${Date.now().toString(36)}`, name: name.trim() || `Farm ${get().castles.length}`, kind: 'farm' }] }),
      removeCastle: (id) => set({ castles: get().castles.filter((c) => c.id !== id || c.kind === 'main') }),
      renameCastle: (id, name) => set({ castles: get().castles.map((c) => (c.id === id ? { ...c, name } : c)) }),
      toggleCheck: (castleId, itemId, todayKey) => {
        const cur = get().checklist;
        const done = cur.dateKey === todayKey ? { ...cur.done } : {};
        const k = `${castleId}:${itemId}`;
        done[k] = !done[k];
        set({ checklist: { dateKey: todayKey, done } });
      },
      startCooldown: (castleId, itemId, at) => set({ cooldowns: { ...get().cooldowns, [`${castleId}:${itemId}`]: at } }),
      toggleClaimed: (code) => {
        const s = new Set(get().claimedCodes);
        if (s.has(code)) s.delete(code); else s.add(code);
        set({ claimedCodes: [...s] });
      },
      flipCycle: (d) => {
        // Make the current week the opposite of what it is now.
        const w = weekIndex(d);
        const isAce = ((w - get().aceLordAnchorWeek) % 2 + 2) % 2 === 0;
        set({ aceLordAnchorWeek: isAce ? w + 1 : w });
      },
      setRotationWeek: (d, week) => set({ rotationAnchorWeek: weekIndex(d) - (week - 1) }),
      setAlarm: (eventId, on) => set({ alarms: { ...get().alarms, [eventId]: on } }),
      setAlarmLead: (alarmLeadMinutes) => set({ alarmLeadMinutes }),
      setManifestUrl: (manifestUrl) => set({ manifestUrl }),
      setBagQty: (id, qty) => set({ bagInventory: { ...get().bagInventory, [id]: Math.max(0, Math.floor(qty) || 0) } }),
      resetBag: () => set({ bagInventory: {} }),
      setCitadel: (c) => set({ citadel: { ...get().citadel, ...c } }),
      saveCalc: (key, values) => set({ savedCalcs: { ...get().savedCalcs, [key]: values } }),
      importState: (data) => set({ ...defaultState, ...data }),
      dismissUpdate: (dismissedUpdate) => set({ dismissedUpdate }),
      setRosterEntry: (heroId, entry) => set({ roster: { ...get().roster, [heroId]: entry } }),
      removeFromRoster: (heroId) => {
        const next = { ...get().roster };
        delete next[heroId];
        set({ roster: next });
      },
    }),
    {
      name: 'frozen-codex-profile',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(defaultState) as (keyof PersistedState)[]) out[k] = s[k];
        return out as PersistedState;
      },
    },
  ),
);

export function selectPersisted(s: AppState): PersistedState {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(defaultState) as (keyof PersistedState)[]) out[k] = s[k];
  return out as PersistedState;
}
