import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import UserMenu from '../components/UserMenu';
import { colors } from '../theme';

// 재료 목록입니다. image가 있으면 사진을, 없으면 이모지를 보여 줍니다.
// 사진은 assets 폴더에 넣고 image: require('../../assets/파일이름.jpg') 처럼 연결합니다.
// 김치 사진 출처: Jeremy Keith, "Korean cuisine-Kimchi-08.jpg", Wikimedia Commons, CC BY 2.0
// https://commons.wikimedia.org/wiki/File:Korean_cuisine-Kimchi-08.jpg
export const INGREDIENTS = [
  { id: 'egg', name: '계란', emoji: '🥚' },
  { id: 'kimchi', name: '김치', image: require('../../assets/kimchi.jpg') },
  { id: 'pasta', name: '파스타', emoji: '🍝' },
  // comingSoon: 아직 요리가 없어 고를 수 없는 재료(흐리게, "(업데이트 예정)" 표시)
  { id: 'tuna', name: '참치', emoji: '🐟', comingSoon: true },
];

const SELECTABLE_IDS = INGREDIENTS.filter((item) => !item.comingSoon).map((item) => item.id);

export default function IngredientScreen({ initialSelected = [], onNext }) {
  // 요리 화면에서 돌아왔을 때 이전에 고른 재료가 그대로 선택돼 있도록 합니다.
  const [selected, setSelected] = useState(() =>
    initialSelected.filter((id) => SELECTABLE_IDS.includes(id))
  );

  // 재료는 하나만 고를 수 있습니다. 다른 재료를 누르면 선택이 그 재료로 바뀌고,
  // 이미 고른 재료를 다시 누르면 선택이 풀립니다.
  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? [] : [id]));
  }

  function handleNext() {
    onNext?.(selected);
  }

  const canGoNext = selected.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <UserMenu />
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>어떤 재료로 요리할까요?</Text>
        <Text style={styles.subtitle}>요리할 재료 하나를 골라 주세요</Text>

        <View style={styles.grid}>
          {INGREDIENTS.map((item) => {
            const isSelected = selected.includes(item.id);
            const disabled = Boolean(item.comingSoon);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                disabled={disabled}
                onPress={() => toggle(item.id)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  disabled && styles.cardDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {isSelected && (
                  <View style={styles.check}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
                {/* 그림과 이름을 한 묶음으로 만들어 카드 한가운데에 놓습니다.
                    카드 안쪽 여백(padding)이 묶음 주위를 위아래 좌우 고르게 감쌉니다. */}
                <View style={styles.group}>
                  <View style={styles.visual}>
                    {item.image ? (
                      <Image source={item.image} style={styles.photo} />
                    ) : (
                      <Text style={styles.emoji}>{item.emoji}</Text>
                    )}
                  </View>
                  <Text style={[styles.name, isSelected && styles.nameSelected]}>{item.name}</Text>
                  {disabled ? <Text style={styles.comingSoon}>(업데이트 예정)</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoNext }}
          onPress={handleNext}
          disabled={!canGoNext}
          style={({ pressed }) => [
            styles.nextButton,
            !canGoNext && styles.nextDisabled,
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
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
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
    fontSize: 15,
    color: colors.textMuted,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
    rowGap: 16,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cardDisabled: {
    opacity: 0.45,
    backgroundColor: '#F3EEEA',
  },
  comingSoon: {
    marginTop: -6,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cardSelected: {
    borderColor: colors.orange,
    backgroundColor: '#FFF0E8',
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  visual: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
    lineHeight: 64,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  name: {
    textAlign: 'center',
    includeFontPadding: false,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  nameSelected: {
    color: colors.orange,
  },
  pressed: {
    opacity: 0.75,
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
});
