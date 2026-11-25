import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadCookedDishes } from '../cookingHistory';
import { DISHES_BY_INGREDIENT } from '../data/dishes';
import { RECIPES } from '../data/recipes';
import { getUnlockedLevel, UNLOCK_SCORE } from '../progress';
import { useColors, useThemedStyles } from '../theme';
import { INGREDIENTS } from './IngredientScreen';

// 재료 선택 화면에서 고른 재료(selectedIds, 지금은 1개)로 만들 수 있는 요리를 단계별로 보여 줍니다.
// 요리 기록의 평가를 보고 어느 단계까지 열렸는지 정합니다(src/progress.js).
export default function DishScreen({ selectedIds, onBack, onSelectDish }) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  // 재료 선택 화면과 같은 순서(계란, 김치, 참치, 파스타)로 보여 줍니다.
  const ingredients = INGREDIENTS.filter((item) => selectedIds.includes(item.id));
  // 누른 요리는 선택 표시만 하고, 아래 "다음" 버튼을 눌러야 학습 화면으로 넘어갑니다.
  const [selectedDish, setSelectedDish] = useState(null);
  const [records, setRecords] = useState(null); // null이면 기록을 불러오는 중
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    loadCookedDishes()
      .then((list) => active && setRecords(list))
      .catch((e) => {
        console.warn('요리 기록 불러오기 오류', e);
        if (active) {
          setLoadError('기록을 불러오지 못해 1단계만 보여 드려요.');
          setRecords([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function handleSelect(dish) {
    // 같은 요리를 다시 누르면 선택이 풀립니다.
    setSelectedDish((prev) => (prev?.id === dish.id ? null : dish));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 재료 다시 고르기</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>무엇을 만들까요?</Text>

        {ingredients.map((ingredient) => {
          const dishes = DISHES_BY_INGREDIENT[ingredient.id] ?? [];
          return (
            <View key={ingredient.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{ingredient.name} 요리</Text>

              {dishes.length === 0 ? (
                <View style={styles.preparing}>
                  <Text style={styles.preparingText}>요리를 준비 중이에요</Text>
                </View>
              ) : records === null ? (
                <ActivityIndicator style={styles.loading} color={colors.orange} />
              ) : (
                (() => {
                  const unlockedLevel = getUnlockedLevel(dishes, records);
                  const current = dishes[unlockedLevel - 1];
                  const next = dishes[unlockedLevel];
                  return (
                    <>
                      {next ? (
                        <Text style={styles.hint}>
                          {unlockedLevel}단계 {current.name}에서 AI 평가 별 {UNLOCK_SCORE}개 이상을 받으면{' '}
                          {unlockedLevel + 1}단계 {next.name}이(가) 열려요.
                        </Text>
                      ) : (
                        <Text style={styles.hint}>모든 단계가 열렸어요! 🎉</Text>
                      )}
                      {loadError ? <Text style={styles.hint}>{loadError}</Text> : null}

                      {dishes.map((dish, index) => {
                        const level = index + 1;
                        const unlocked = level <= unlockedLevel;
                        const hasRecipe = Boolean(RECIPES[dish.id]);
                        const enabled = unlocked && hasRecipe;
                        const isSelected = selectedDish?.id === dish.id;
                        return (
                          <Pressable
                            key={dish.id}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !enabled, selected: isSelected }}
                            disabled={!enabled}
                            onPress={() => handleSelect(dish)}
                            style={({ pressed }) => [
                              styles.dishButton,
                              isSelected && styles.dishSelected,
                              !enabled && styles.dishDisabled,
                              pressed && styles.pressed,
                            ]}
                          >
                            <View style={styles.dishLeft}>
                              <View
                                style={[
                                  styles.levelBadge,
                                  isSelected && styles.levelBadgeSelected,
                                  !enabled && styles.levelBadgeDisabled,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.levelText,
                                    isSelected && styles.levelTextSelected,
                                    !enabled && styles.levelTextDisabled,
                                  ]}
                                >
                                  {level}단계
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.dishText,
                                  isSelected && styles.dishTextSelected,
                                  !enabled && styles.dishTextDisabled,
                                ]}
                              >
                                {dish.name}
                              </Text>
                            </View>
                            {!unlocked && <Text style={styles.soon}>🔒 잠김</Text>}
                            {unlocked && !hasRecipe && <Text style={styles.soon}>레시피 준비 중</Text>}
                            {isSelected && <Text style={styles.check}>✓</Text>}
                          </Pressable>
                        );
                      })}
                    </>
                  );
                })()
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !selectedDish }}
          disabled={!selectedDish}
          onPress={() => onSelectDish?.(selectedDish)}
          style={({ pressed }) => [
            styles.nextButton,
            !selectedDish && styles.nextDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.nextText}>다음</Text>
        </Pressable>
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
  section: {
    marginTop: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.orange,
  },
  dishButton: {
    height: 58,
    borderRadius: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  dishLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.orangeSoft,
  },
  levelBadgeSelected: {
    backgroundColor: colors.onOrange,
  },
  levelBadgeDisabled: {
    backgroundColor: colors.disabledBadge,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.orange,
  },
  levelTextSelected: {
    color: colors.orange,
  },
  levelTextDisabled: {
    color: colors.disabledText,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  loading: {
    marginTop: 12,
  },
  dishSelected: {
    backgroundColor: colors.orange,
  },
  dishDisabled: {
    backgroundColor: colors.disabledBg,
    borderColor: colors.disabledBg,
  },
  dishText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.orange,
  },
  dishTextSelected: {
    color: colors.onOrange,
  },
  check: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onOrange,
  },
  dishTextDisabled: {
    color: colors.disabledText,
  },
  soon: {
    fontSize: 13,
    color: colors.disabledText,
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  nextButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  nextDisabled: {
    backgroundColor: colors.orangeDisabled,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onOrange,
  },
  preparing: {
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preparingText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
