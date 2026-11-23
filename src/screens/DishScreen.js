import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import UserMenu from '../components/UserMenu';
import { DISHES_BY_INGREDIENT } from '../data/dishes';
import { colors } from '../theme';
import { INGREDIENTS } from './IngredientScreen';

// 재료 선택 화면에서 고른 재료(selectedIds, 지금은 1개)로 만들 수 있는 요리를 세로로 보여 줍니다.
export default function DishScreen({ selectedIds, onBack, onSelectDish }) {
  // 재료 선택 화면과 같은 순서(계란, 김치, 참치, 파스타)로 보여 줍니다.
  const ingredients = INGREDIENTS.filter((item) => selectedIds.includes(item.id));
  // 누른 요리는 선택 표시만 하고, 아래 "다음" 버튼을 눌러야 학습 화면으로 넘어갑니다.
  const [selectedDish, setSelectedDish] = useState(null);

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
        <UserMenu />
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
              ) : (
                dishes.map((dish) => {
                  const isSelected = selectedDish?.id === dish.id;
                  return (
                    <Pressable
                      key={dish.id}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !dish.enabled, selected: isSelected }}
                      disabled={!dish.enabled}
                      onPress={() => handleSelect(dish)}
                      style={({ pressed }) => [
                        styles.dishButton,
                        isSelected && styles.dishSelected,
                        !dish.enabled && styles.dishDisabled,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dishText,
                          isSelected && styles.dishTextSelected,
                          !dish.enabled && styles.dishTextDisabled,
                        ]}
                      >
                        {dish.name}
                      </Text>
                      {!dish.enabled && <Text style={styles.soon}>준비 중</Text>}
                      {isSelected && <Text style={styles.check}>✓</Text>}
                    </Pressable>
                  );
                })
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

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  dishSelected: {
    backgroundColor: colors.orange,
  },
  dishDisabled: {
    backgroundColor: '#EFE7E1',
    borderColor: '#EFE7E1',
  },
  dishText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.orange,
  },
  dishTextSelected: {
    color: '#FFFFFF',
  },
  check: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dishTextDisabled: {
    color: '#A99D95',
  },
  soon: {
    fontSize: 13,
    color: '#A99D95',
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
    backgroundColor: '#F5B9A2',
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
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
