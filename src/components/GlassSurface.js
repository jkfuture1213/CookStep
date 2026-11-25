import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';

// iOS 리퀴드 글래스 느낌의 반투명 바탕입니다.
// - iOS 26 이상: 애플의 진짜 Liquid Glass(expo-glass-effect의 GlassView)를 씁니다.
// - 그 밖의 iOS: 흐림 효과(expo-blur) 위에 밝은 테두리와 하이라이트를 얹어 비슷하게 보이게 합니다.
// - Android: 흐림 대신 반투명 흰 바탕과 테두리로 유리 느낌을 냅니다.
// 두 라이브러리 모두 Expo Go에 들어 있어 따로 빌드하지 않아도 됩니다.
// 다크 모드에서는 어두운 유리로 바뀝니다.
const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

export default function GlassSurface({ style, children, interactive = false }) {
  const { scheme } = useTheme();
  const dark = scheme === 'dark';

  if (LIQUID_GLASS) {
    return (
      <GlassView
        style={[styles.base, style]}
        glassEffectStyle="regular"
        colorScheme={scheme}
        isInteractive={interactive}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[styles.base, styles.fallback, dark && styles.fallbackDark, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={40}
          tint={dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
        />
      ) : null}
      {/* 위쪽 가장자리에 빛이 맺힌 듯한 하이라이트 */}
      <View pointerEvents="none" style={[styles.highlight, dark && styles.highlightDark]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#7A4A30',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fallbackDark: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(40,32,28,0.45)' : 'rgba(44,36,32,0.85)',
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
  },
  highlightDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
