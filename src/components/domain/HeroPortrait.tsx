import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { Hero } from '@/types/game';
import { palette, radius, rarityColors, tint } from '@/theme';
import { ElementEmblem } from '@/components/ui';
import { loadPortraits, usePortraits } from '@/services/portraits';
import { useAppStore } from '@/store/useAppStore';

/**
 * Hero portrait from the community wiki, cached on the device. Falls back to the initial-letter badge
 * when portraits are switched off, offline on first view, or the wiki has no image.
 */
export function HeroPortrait({ hero, size = 48, stars }: { hero: Pick<Hero, 'id' | 'name' | 'element' | 'rarity'>; size?: number; stars?: number }) {
  const enabled = useAppStore((s) => s.showPortraits);
  const url = usePortraits((s) => s.urls[hero.id]);
  const failed = usePortraits((s) => !!s.failed[hero.id]);
  const markFailed = usePortraits((s) => s.markFailed);
  useEffect(() => { if (enabled) loadPortraits().catch(() => undefined); }, [enabled]);

  const rc = rarityColors[(stars ?? hero.rarity) as keyof typeof rarityColors] ?? palette.textMuted;
  const r = size >= 60 ? 14 : radius.md;
  return (
    <View style={{ width: size, height: size, borderRadius: r, borderWidth: size >= 60 ? 2 : 1.5, borderColor: rc, backgroundColor: tint(rc, 0.1), alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
      {enabled && url && !failed ? (
        <Image
          source={{ uri: url }}
          style={{ width: size - 3, height: size - 3, borderRadius: r - 1 }}
          contentFit="cover"
          cachePolicy="disk"
          recyclingKey={hero.id}
          transition={120}
          accessibilityLabel={`${hero.name} portrait`}
          onError={() => markFailed(hero.id)}
        />
      ) : (
        <Text style={{ fontSize: Math.round(size * 0.46), fontWeight: '800', color: rc }}>{hero.name.slice(0, 1)}</Text>
      )}
      <View style={{ position: 'absolute', right: -6, bottom: -6 }}><ElementEmblem element={hero.element} size={Math.max(16, Math.round(size * 0.36))} /></View>
    </View>
  );
}
