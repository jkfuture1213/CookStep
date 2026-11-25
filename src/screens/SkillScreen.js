import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadCookedDishes } from '../cookingHistory';
import { SKILLS } from '../data/skills';
import { getCurrentSkillResult } from '../skillCheck';
import { useThemedStyles } from '../theme';

const COLUMNS = 2;
const SIDE_PADDING = 24;
const GAP = 12;

// "기초 요리 스킬을 배우고 싶어."를 누르면 나오는 화면입니다.
// 스킬 8개를 2열 버튼으로 보여 주고, 누르면 바로 그 스킬의 따라 하기(학습 화면)로 갑니다.
// 따라 하기를 마치면 요리와 똑같이 사진을 찍고 AI 평가를 받을 수 있습니다.
// 버튼 오른쪽 위 동그라미: 따라 하기를 한 번이라도 완료한 스킬(요리 기록에 있음)이면 ✓가 채워집니다.
export default function SkillScreen({ onBack, onSelectSkill }) {
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - SIDE_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
  // 완료한 스킬 id 모음. 기록을 못 불러오면 모두 체크 없이 보입니다.
  const [learnedIds, setLearnedIds] = useState(() => new Set());
  // 요리 실력 확인 결과로 추천하는 스킬(칼질이 서툴면 칼질 기본, 불·간이 서툴면 불 조절·간 맞추기)
  const recommendedIds = getCurrentSkillResult()?.recommendedSkills ?? [];

  useEffect(() => {
    let active = true;
    loadCookedDishes()
      .then((list) => active && setLearnedIds(new Set(list.map((record) => record.dishId))))
      .catch((e) => console.warn('요리 기록 불러오기 오류', e));
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 뒤로</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>어떤 기본기를 익혀 볼까요?</Text>
        <Text style={styles.subtitle}>짧게 따라 하고, 결과를 사진으로 찍어 평가받아요</Text>

        <View style={styles.grid}>
          {SKILLS.map((skill) => {
            const learned = learnedIds.has(skill.id);
            const recommended = recommendedIds.includes(skill.id);
            return (
              <Pressable
                key={skill.id}
                accessibilityRole="button"
                accessibilityLabel={`${skill.name} 배우기${learned ? ', 배움 완료' : ''}`}
                accessibilityState={{ checked: learned }}
                onPress={() => onSelectSkill?.(skill)}
                style={({ pressed }) => [
                  styles.card,
                  { width: cardWidth },
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.circle, learned && styles.circleChecked]}>
                  {learned && <Text style={styles.checkText}>✓</Text>}
                </View>
                <View style={styles.emojiRow}>
                  <Text style={styles.emoji}>{skill.emoji}</Text>
                  {recommended ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>⭐ 추천</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.name}>{skill.name}</Text>
                <Text style={styles.description}>{skill.description}</Text>
              </Pressable>
            );
          })}
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
  card: {
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 4,
  },
  cardPressed: {
    backgroundColor: colors.orangeTint,
  },
  circle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleChecked: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  checkText: {
    color: colors.onOrange,
    fontSize: 14,
    fontWeight: '800',
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
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
  emoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.orange,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
