import { signOut } from 'firebase/auth';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import appConfig from '../../app.json';
import EasterEgg from '../components/EasterEgg';
import { auth } from '../firebase';
import { THEME_MODES, useTheme, useThemedStyles } from '../theme';

// 이 횟수만큼, 누를 때마다 이 시간 안에 이어서 '앱 정보'를 누르면 이스터에그가 열립니다.
const EASTER_EGG_TAPS = 10;
const EASTER_EGG_GAP_MS = 700;

// 앱 버전은 app.json의 expo.version을 그대로 보여 줍니다.
const APP_VERSION = appConfig.expo.version;
const DEV_TEAM = 'ChaeryJubilee';
const DEVELOPERS = ['BugForever', 'chelchel', 'Sunflower'];

// 하단 탭의 '설정' 화면: 화면 모드(기기 설정/라이트/다크), 계정(로그아웃), 앱 정보
export default function SettingsScreen({ user, onBack }) {
  const styles = useThemedStyles(createStyles);
  const { mode, setMode } = useTheme();
  const [showEgg, setShowEgg] = useState(false);
  const taps = useRef({ count: 0, last: 0 });

  function handleInfoPress() {
    const now = Date.now();
    const tapState = taps.current;
    tapState.count = now - tapState.last <= EASTER_EGG_GAP_MS ? tapState.count + 1 : 1;
    tapState.last = now;
    if (tapState.count >= EASTER_EGG_TAPS) {
      tapState.count = 0;
      setShowEgg(true);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <EasterEgg visible={showEgg} onClose={() => setShowEgg(false)} />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 돌아가기</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>설정</Text>

        <Text style={styles.sectionTitle}>화면 모드</Text>
        <View style={styles.card}>
          {THEME_MODES.map((option, index) => {
            const selected = option.value === mode;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setMode(option.value)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.rowTexts}>
                  <Text style={styles.rowLabel}>{option.label}</Text>
                  {option.value === 'system' ? (
                    <Text style={styles.rowHint}>휴대폰의 라이트·다크 설정을 따라가요</Text>
                  ) : null}
                </View>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>계정</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>로그인 계정</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => signOut(auth)}
            style={({ pressed }) => [styles.row, styles.rowDivider, pressed && styles.pressed]}
          >
            <Text style={styles.logout}>로그아웃</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={styles.card}>
          <Pressable onPress={handleInfoPress} style={styles.row}>
            <Text style={styles.rowLabel}>CookStep</Text>
            <Text style={styles.rowValue}>1인 가구 단계별 요리 학습</Text>
          </Pressable>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowLabel}>버전</Text>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>

        {/* 개발자 크레딧 */}
        <View style={styles.credits}>
          <Text style={styles.creditsLead}>Crafted with ♥ by</Text>
          <Text style={styles.creditsTeam}>Team {DEV_TEAM}</Text>
          <Text style={styles.creditsNames}>{DEVELOPERS.join('  ·  ')}</Text>
          <Text style={styles.creditsCopy}>© 2026 {DEV_TEAM}. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    back: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    title: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    sectionTitle: {
      marginTop: 20,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    row: {
      minHeight: 54,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    rowDivider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowTexts: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    rowHint: {
      fontSize: 13,
      color: colors.textMuted,
    },
    rowValue: {
      flexShrink: 1,
      fontSize: 14,
      color: colors.textMuted,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOn: {
      borderColor: colors.orange,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.orange,
    },
    logout: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.error,
    },
    credits: {
      marginTop: 28,
      alignItems: 'center',
      gap: 4,
    },
    creditsLead: {
      fontSize: 13,
      fontStyle: 'italic',
      letterSpacing: 0.5,
      color: colors.textMuted,
    },
    creditsTeam: {
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: colors.orange,
    },
    creditsNames: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
      color: colors.text,
    },
    creditsCopy: {
      marginTop: 6,
      fontSize: 11,
      color: colors.placeholder,
    },
    pressed: {
      opacity: 0.7,
    },
  });
