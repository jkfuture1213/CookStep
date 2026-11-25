import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentSkillResult } from '../skillCheck';
import { useThemedStyles } from '../theme';

// 환영 화면 다음에 나오는 "오늘은 무엇을 하고 싶나요?" 화면입니다.
// 요리를 배우고 싶으면 재료 선택 화면으로, 레시피를 따라 만들고 싶으면 레시피 선택 화면으로 갑니다.
const CHOICES = [
  {
    key: 'learn',
    emoji: '👩‍🍳',
    label: '요리를 배우고 싶어.',
    description: '재료를 고르고 1단계부터 차근차근 배워요',
  },
  {
    key: 'recipe',
    emoji: '📖',
    label: '레시피 따라 만들고 싶어.',
    description: '만들고 싶은 요리를 골라 바로 따라 해요',
  },
];

export default function GoalScreen({ onLearn, onFollowRecipe }) {
  const styles = useThemedStyles(createStyles);
  const handlers = { learn: onLearn, recipe: onFollowRecipe };
  // 요리 실력 확인 결과에 따른 추천 버튼(입문: 배우기, 중급: 레시피 따라 만들기)
  const recommended = getCurrentSkillResult()?.recommendedGoal;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>오늘은 무엇을 하고 싶나요?</Text>

        <View style={styles.buttons}>
          {CHOICES.map((choice) => (
            <Pressable
              key={choice.key}
              accessibilityRole="button"
              onPress={() => handlers[choice.key]?.()}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <Text style={styles.emoji}>{choice.emoji}</Text>
              <View style={styles.texts}>
                {recommended === choice.key ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>⭐ 추천</Text>
                  </View>
                ) : null}
                <Text style={styles.label}>{choice.label}</Text>
                <Text style={styles.description}>{choice.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
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
