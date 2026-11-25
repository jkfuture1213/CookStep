import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { evaluateDish, getBasicEvaluation, getEvaluationErrorDetail } from '../aiEvaluation';
import EvaluationCard from '../components/EvaluationCard';
import ShareButton from '../components/ShareButton';
import LevelUpCelebration from '../components/LevelUpCelebration';
import TitleUpCelebration from '../components/TitleUpCelebration';
import { loadCookedDishes, saveEvaluation } from '../cookingHistory';
import { DISHES_BY_INGREDIENT } from '../data/dishes';
import { findDishLadder, findNewlyUnlockedDish } from '../progress';
import { colors } from '../theme';
import { findTitleUp } from '../titles';

// 완성 사진을 AI에게 보내 레시피대로 잘 만들었는지 평가받는 화면입니다.
// 평가가 끝나면 요리 기록에 저장해서 마이페이지에서도 다시 볼 수 있습니다.
export default function EvaluationScreen({ cookedId, dishId, dishName, photo, onDone }) {
  const [evaluation, setEvaluation] = useState(null);
  const [saveWarning, setSaveWarning] = useState('');

  const [noticeDetail, setNoticeDetail] = useState('');
  const [loading, setLoading] = useState(true);
  const [unlockedDish, setUnlockedDish] = useState(null); // 이번 평가로 새로 열린 요리(축하 화면용)
  // 이번 평가로 올라간 칭호. 단계 해제 축하가 있으면 그걸 닫은 뒤에 보여 줍니다.
  const [newTitle, setNewTitle] = useState(null);
  const [titleReady, setTitleReady] = useState(false); // 단계 해제 축하가 다 닫혔는지

  // AI 평가를 받고, AI가 실패하면 바로 앱 안의 기본 평가를 보여 줍니다.
  const runEvaluation = useCallback(async () => {
    setLoading(true);
    setNoticeDetail('');
    setSaveWarning('');
    let result;
    try {
      result = await evaluateDish(dishId, photo.base64);
    } catch (e) {
      console.warn('AI 평가 오류', e);
      setNoticeDetail(getEvaluationErrorDetail(e));
      result = getBasicEvaluation(dishId);
    }
    // 평가를 저장하기 전에 기록을 읽어 두어야 "이번 평가로 새 단계가 열렸는지" 알 수 있습니다.
    let records = null;
    try {
      records = await loadCookedDishes();
    } catch (e) {
      console.warn('요리 기록 불러오기 오류', e);
    }

    setEvaluation(result);
    setLoading(false);
    let saved = false;
    try {
      await saveEvaluation(cookedId, result);
      saved = true;
    } catch (e) {
      setSaveWarning('평가 결과를 마이페이지에 저장하지 못했어요.');
    }

    // 저장된 평가로 다음 단계가 처음 열렸다면 축하 화면을 띄웁니다.
    if (saved && records) {
      const ladder = findDishLadder(DISHES_BY_INGREDIENT, dishId);
      const newDish = findNewlyUnlockedDish(ladder, records, cookedId, result);
      if (newDish) {
        setUnlockedDish(newDish);
      }
      setTitleReady(!newDish);
      // 이번 평가를 넣기 전/후의 칭호를 비교합니다.
      const withoutNew = records.filter((record) => record.id !== cookedId);
      const thisRecord = records.find((record) => record.id === cookedId);
      const before = thisRecord ? [...withoutNew, thisRecord] : withoutNew;
      const after = [...withoutNew, { ...thisRecord, id: cookedId, dishId, evaluation: result }];
      setNewTitle(findTitleUp(before, after));
    }
  }, [cookedId, dishId, photo]);

  useEffect(() => {
    runEvaluation();
  }, [runEvaluation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LevelUpCelebration
        visible={Boolean(unlockedDish)}
        dish={unlockedDish}
        score={evaluation?.score ?? 0}
        onClose={() => {
          setUnlockedDish(null);
          // 축하 화면 두 개가 동시에 바뀌면 iPhone에서 다음 화면이 안 뜰 수 있어 잠깐 기다립니다.
          setTimeout(() => setTitleReady(true), 500);
        }}
      />
      <TitleUpCelebration
        visible={Boolean(newTitle) && titleReady}
        title={newTitle}
        onClose={() => setNewTitle(null)}
      />
      <View style={styles.header}>
        <Text style={styles.title}>{dishName} 평가</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: photo.uri }} style={styles.photo} />

        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.orange} />
            <Text style={styles.loadingText}>AI가 요리를 살펴보고 있어요... (최대 20초)</Text>
          </View>
        )}

        {photo?.uri ? <ShareButton photo={photo.uri} dishName={dishName} /> : null}
        {!loading && evaluation && <EvaluationCard evaluation={evaluation} />}

        {!loading && evaluation?.source === 'basic' && (
          <View style={styles.noticeBox}>
            <Text style={styles.notice}>AI가 바빠서 기본 평가를 보여 드렸어요.</Text>
            {noticeDetail ? <Text style={styles.noticeDetail}>자세한 오류: {noticeDetail}</Text> : null}
            <Pressable
              accessibilityRole="button"
              onPress={runEvaluation}
              style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>AI에게 다시 평가받기</Text>
            </Pressable>
          </View>
        )}
        {saveWarning ? <Text style={styles.warning}>{saveWarning}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={onDone}
          disabled={loading}
          style={({ pressed }) => [styles.button, loading && styles.buttonDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.buttonText}>완료</Text>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  noticeBox: {
    alignItems: 'center',
    gap: 10,
  },
  notice: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  noticeDetail: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: '#FFFFFF',
  },
  retryText: {
    color: colors.orange,
    fontWeight: '700',
  },
  warning: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  buttonDisabled: {
    backgroundColor: '#F5B9A2',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.75,
  },
});
