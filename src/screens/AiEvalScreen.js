import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EvaluationCard from '../components/EvaluationCard';
import { loadCookedDishes, loadFreeEvaluations } from '../cookingHistory';
import { useColors, useThemedStyles } from '../theme';

function formatDate(date) {
  if (!date) {
    return '';
  }
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

// 하단 탭의 'AI 평가' 화면: 지금까지 받은 평가를 최신순으로 모아 보여 줍니다.
// 요리를 완료하고 받은 평가와, 오른쪽 위 '사진 찍기'로 레시피 없이 받은 평가를 함께 보여 줍니다.
export default function AiEvalScreen({ onBack, onTakePhoto }) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const [items, setItems] = useState(null); // null이면 불러오는 중
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      loadCookedDishes(),
      // 사진 평가를 못 읽어도 요리 평가는 보여 줍니다.
      loadFreeEvaluations().catch((e) => {
        console.warn('사진 평가 불러오기 오류', e);
        return [];
      }),
    ])
      .then(([cooked, free]) => {
        if (!active) {
          return;
        }
        const merged = [
          ...cooked
            .filter((record) => record.evaluation)
            .map((record) => ({ ...record, key: `c-${record.id}`, date: record.completedAt })),
          ...free.map((record) => ({ ...record, key: `f-${record.id}`, date: record.createdAt, free: true })),
        ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
        setItems(merged);
      })
      .catch((e) => {
        console.warn('AI 평가 불러오기 오류', e);
        if (active) {
          setError('평가 기록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.');
          setItems([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const scored = (items ?? []).map((item) => item.evaluation.score);
  const average = scored.length ? (scored.reduce((a, b) => a + b, 0) / scored.length).toFixed(1) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 돌아가기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진 찍어서 AI 평가받기"
          onPress={onTakePhoto}
          style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
        >
          <Text style={styles.photoButtonText}>📷 사진 찍기</Text>
        </Pressable>
      </View>

      {items === null ? (
        <ActivityIndicator style={styles.loading} color={colors.orange} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>AI 평가</Text>
              {average ? (
                <Text style={styles.summary}>
                  평가 {scored.length}개 · 평균 ★ {average}
                </Text>
              ) : null}
              {error ? <Text style={styles.summary}>{error}</Text> : null}
            </View>
          }
          ListEmptyComponent={
            error ? null : (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyText}>
                  아직 받은 평가가 없어요.{'\n'}오른쪽 위 '사진 찍기'로 요리 사진을 평가받아 보세요!
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View style={styles.itemHeader}>
                <View style={styles.nameRow}>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {item.dishName}
                  </Text>
                  {item.free ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>📷 사진 평가</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </View>
              <EvaluationCard evaluation={item.evaluation} />
            </View>
          )}
        />
      )}
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
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    photoButton: {
      marginTop: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.orange,
    },
    photoButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.onOrange,
    },
    pressed: {
      opacity: 0.75,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    tag: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: colors.orangeSoft,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.orange,
    },
    back: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },
    loading: {
      marginTop: 48,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 20,
    },
    header: {
      marginTop: 16,
      gap: 6,
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    summary: {
      fontSize: 15,
      color: colors.textMuted,
    },
    item: {
      gap: 8,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    dishName: {
      flexShrink: 1,
      fontSize: 18,
      fontWeight: '800',
      color: colors.orange,
    },
    date: {
      fontSize: 13,
      color: colors.textMuted,
    },
    empty: {
      marginTop: 48,
      alignItems: 'center',
      gap: 10,
    },
    emptyEmoji: {
      fontSize: 48,
    },
    emptyText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
