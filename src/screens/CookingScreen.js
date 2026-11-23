import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSaveErrorMessage, saveCookedDish } from '../cookingHistory';
import { RECIPES } from '../data/recipes';
import { colors } from '../theme';

// 요리 학습 화면: 한 화면에 한 단계씩, 그림과 설명을 함께 보여 줍니다.
// 마지막 단계의 "완료"를 누르면 Firebase에 기록을 저장하고 onFinish(기록 id, 요리 이름)를 부릅니다.
export default function CookingScreen({ dishId, onExit, onFinish }) {
  const recipe = RECIPES[dishId];
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!recipe) {
    return null;
  }

  const step = recipe.steps[stepIndex];
  const total = recipe.steps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  async function handleComplete() {
    setError('');
    setSaving(true);
    try {
      const cookedId = await saveCookedDish(dishId, recipe.name);
      // 기록을 저장했으면 완성 사진을 찍는 화면으로 넘어갑니다.
      onFinish(cookedId, recipe.name);
    } catch (e) {
      setError(getSaveErrorMessage(e));
      setSaving(false);
    }
  }

  function handleNext() {
    if (isLast) {
      handleComplete();
    } else {
      setStepIndex(stepIndex + 1);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단: 요리 이름 */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="나가기"
          onPress={onExit}
          hitSlop={12}
          style={styles.side}
        >
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.dishName}>{recipe.name}</Text>
        <View style={styles.side} />
      </View>

      {/* 진행 막대 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((stepIndex + 1) / total) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stepLabel}>
          {stepIndex + 1} / {total} 단계
        </Text>

        <View style={styles.pictureBox}>
          {step.image ? (
            <Image source={step.image} style={styles.pictureImage} />
          ) : (
            <Text style={styles.pictureEmoji}>{step.picture.join(' ')}</Text>
          )}
          {step.pictureCaption ? <Text style={styles.caption}>{step.pictureCaption}</Text> : null}
        </View>

        <Text style={styles.stepText} lineBreakStrategyIOS="hangul-word">
          {step.text}
        </Text>

        {isFirst && (
          <View style={styles.ingredientsBox}>
            <Text style={styles.ingredientsTitle}>준비할 재료</Text>
            <Text style={styles.ingredientsText}>{recipe.ingredients.join(', ')}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.buttons}>
          {!isFirst && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setStepIndex(stepIndex - 1)}
              disabled={saving}
              style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
            >
              <Text style={[styles.buttonText, styles.secondaryText]}>이전</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={handleNext}
            disabled={saving}
            style={({ pressed }) => [styles.button, styles.primary, styles.grow, pressed && styles.pressed]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, styles.primaryText]}>{isLast ? '완료' : '다음'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  side: {
    width: 32,
  },
  close: {
    fontSize: 20,
    color: colors.textMuted,
  },
  dishName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  progressTrack: {
    height: 6,
    marginHorizontal: 24,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.orange,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.orange,
  },
  pictureBox: {
    marginTop: 12,
    aspectRatio: 4 / 3,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  pictureEmoji: {
    fontSize: 64,
  },
  pictureImage: {
    width: '100%',
    height: '100%',
  },
  caption: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  stepText: {
    marginTop: 20,
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '600',
    color: colors.text,
  },
  ingredientsBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFF0E8',
    gap: 4,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
  },
  ingredientsText: {
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 10,
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  grow: {
    flex: 1,
  },
  primary: {
    backgroundColor: colors.orange,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  pressed: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.orange,
  },
});
