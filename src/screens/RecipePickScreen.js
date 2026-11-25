import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadCookedDishes } from '../cookingHistory';
import { DISHES_BY_INGREDIENT } from '../data/dishes';
import { RECIPES } from '../data/recipes';
import { getUnlockedLevel } from '../progress';
import { useColors, useThemedStyles } from '../theme';
import { INGREDIENTS } from './IngredientScreen';

const COLUMNS = 3;
const SIDE_PADDING = 24;
const GAP = 12;

// "레시피 따라 만들고 싶어"를 고르면 나오는 화면입니다.
// 레시피가 있는 요리를 3열 타일로 보여 주고, 누르면 바로 그 요리의 학습 화면으로 갑니다.
// 아직 열리지 않은 단계의 요리는 흐리게 🔒 표시되고 누를 수 없습니다(음식 선택 화면과 같은 규칙, src/progress.js).
const RECIPE_DISHES = INGREDIENTS.flatMap((ingredient) =>
  (DISHES_BY_INGREDIENT[ingredient.id] ?? [])
    .map((dish, index) => ({
      ...dish,
      emoji: dish.emoji ?? ingredient.emoji ?? '🍽️',
      ingredientId: ingredient.id,
      level: index + 1,
    }))
    .filter((dish) => RECIPES[dish.id])
);

// 재료별로 몇 단계까지 열렸는지 계산합니다. 예: { egg: 2, kimchi: 1, pasta: 1 }
function getUnlockedLevels(records) {
  const levels = {};
  for (const [ingredientId, dishes] of Object.entries(DISHES_BY_INGREDIENT)) {
    levels[ingredientId] = dishes.length > 0 ? getUnlockedLevel(dishes, records) : 0;
  }
  return levels;
}

export default function RecipePickScreen({ onBack, onSelectDish }) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const { width } = useWindowDimensions();
  const tileSize = Math.floor((width - SIDE_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
  const [records, setRecords] = useState(null); // null이면 기록을 불러오는 중
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    loadCookedDishes()
      .then((list) => active && setRecords(list))
      .catch((e) => {
        console.warn('요리 기록 불러오기 오류', e);
        if (active) {
          setLoadError('기록을 불러오지 못해 1단계 요리만 열어 드려요.');
          setRecords([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const unlockedLevels = records ? getUnlockedLevels(records) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 처음으로</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>어떤 레시피를 따라 할까요?</Text>
        <Text style={styles.subtitle}>
          요리를 누르면 바로 따라 만들 수 있어요. 🔒 요리는 요리 배우기에서 앞 단계를 통과하면 열려요.
        </Text>
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

        {unlockedLevels === null ? (
          <ActivityIndicator style={styles.loading} color={colors.orange} />
        ) : (
          <View style={styles.grid}>
            {RECIPE_DISHES.map((dish) => {
              const locked = dish.level > (unlockedLevels[dish.ingredientId] ?? 1);
              return (
                <Pressable
                  key={dish.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${dish.name} 레시피${locked ? ', 잠김' : ''}`}
                  accessibilityState={{ disabled: locked }}
                  disabled={locked}
                  onPress={() => onSelectDish?.(dish)}
                  style={({ pressed }) => [
                    styles.tile,
                    { width: tileSize, height: tileSize },
                    locked && styles.tileLocked,
                    pressed && styles.tilePressed,
                  ]}
                >
                  {locked && <Text style={styles.lock}>🔒</Text>}
                  <Text style={[styles.emoji, locked && styles.emojiLocked]}>{dish.emoji}</Text>
                  <Text style={[styles.name, locked && styles.nameLocked]} numberOfLines={2}>
                    {dish.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
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
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: 32,
  },
  title: {
    marginTop: 16,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 20,
    fontSize: 15,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tileLocked: {
    backgroundColor: colors.disabledBg,
    borderColor: colors.disabledBg,
  },
  lock: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 14,
  },
  emojiLocked: {
    opacity: 0.35,
  },
  nameLocked: {
    color: colors.disabledText,
  },
  error: {
    marginBottom: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  loading: {
    marginTop: 32,
  },
  tilePressed: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeTint,
  },
  emoji: {
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
});
