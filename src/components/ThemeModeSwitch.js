import { Pressable, StyleSheet, Text, View } from 'react-native';

import { THEME_MODES, useTheme, useThemedStyles } from '../theme';

// 마이페이지의 화면 모드 선택: 기기 설정 / 라이트 / 다크
export default function ThemeModeSwitch() {
  const styles = useThemedStyles(createStyles);
  const { mode, setMode } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>화면 모드</Text>
      <View style={styles.segment}>
        {THEME_MODES.map((option) => {
          const selected = option.value === mode;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setMode(option.value)}
              style={[styles.item, selected && styles.itemSelected]}
            >
              <Text style={[styles.itemText, selected && styles.itemTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      alignSelf: 'stretch',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
    },
    segment: {
      flexDirection: 'row',
      padding: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    item: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 999,
    },
    itemSelected: {
      backgroundColor: colors.orange,
    },
    itemText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMuted,
    },
    itemTextSelected: {
      color: colors.onOrange,
    },
  });
