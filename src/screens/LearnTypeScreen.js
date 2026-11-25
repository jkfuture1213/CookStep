import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentSkillResult } from '../skillCheck';
import { useThemedStyles } from '../theme';

// "요리를 배우고 싶어."를 누르면 나오는 화면입니다.
// 재료와 관련된 요리를 배우고 싶으면 재료 선택 화면으로 갑니다.
// 기초 요리 스킬을 배우고 싶으면 기초 스킬 선택 화면으로 갑니다.
// (핸들러를 넘기지 않은 버튼은 "(업데이트 예정)"으로 비활성화됩니다.)
const CHOICES = [
  {
    key: 'basic',
    emoji: '🔪',
    label: '기초 요리 스킬을 배우고 싶어.',
    description: '칼질, 불 조절처럼 요리의 기본기를 익혀요',
  },
  {
    key: 'ingredient',
    emoji: '🥚',
    label: '재료와 관련된 요리를 배우고 싶어.',
    description: '재료를 고르고 1단계부터 차근차근 배워요',
  },
];

export default function LearnTypeScreen({ onBack, onBasicSkills, onIngredientDishes }) {
  const styles = useThemedStyles(createStyles);
  const handlers = { basic: onBasicSkills, ingredient: onIngredientDishes };
  // 입문 요리사에게는 기초 요리 스킬을 먼저 추천합니다.
  const recommended = getCurrentSkillResult()?.recommendBasicSkills ? 'basic' : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 처음으로</Text>
        </Pressable>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>무엇을 배워 볼까요?</Text>

        <View style={styles.buttons}>
          {CHOICES.map((choice) => {
            const handler = handlers[choice.key];
            const disabled = !handler;
            return (
              <Pressable
                key={choice.key}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => handler?.()}
                style={({ pressed }) => [
                  styles.card,
                  disabled && styles.cardDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.emoji, disabled && styles.emojiDisabled]}>{choice.emoji}</Text>
                <View style={styles.texts}>
                  {recommended === choice.key && !disabled ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>⭐ 추천</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.label, disabled && styles.labelDisabled]}>{choice.label}</Text>
                  <Text style={styles.description}>
                    {disabled ? '(업데이트 예정)' : choice.description}
                  </Text>
                </View>
                {!disabled && <Text style={styles.arrow}>›</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  back: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cardDisabled: {
    backgroundColor: colors.disabledBg,
    borderColor: colors.disabledBg,
  },
  emojiDisabled: {
    opacity: 0.4,
  },
  labelDisabled: {
    color: colors.disabledText,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 28,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  buttons: {
    gap: 16,
  },
  card: {
    minHeight: 104,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 40,
  },
  texts: {
    flex: 1,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.orangeSoft,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.orange,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.orange,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  arrow: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.orange,
  },
  pressed: {
    opacity: 0.75,
  },
});
