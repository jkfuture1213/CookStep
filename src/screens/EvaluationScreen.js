import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { evaluateDish, getBasicEvaluation, getEvaluationErrorDetail } from '../aiEvaluation';
import EvaluationCard from '../components/EvaluationCard';
import { saveEvaluation } from '../cookingHistory';
import { colors } from '../theme';

// 완성 사진을 AI에게 보내 레시피대로 잘 만들었는지 평가받는 화면입니다.
// 평가가 끝나면 요리 기록에 저장해서 마이페이지에서도 다시 볼 수 있습니다.
export default function EvaluationScreen({ cookedId, dishId, dishName, photo, onDone }) {
  const [evaluation, setEvaluation] = useState(null);
  const [saveWarning, setSaveWarning] = useState('');

  const [noticeDetail, setNoticeDetail] = useState('');
  const [loading, setLoading] = useState(true);

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
    setEvaluation(result);
    setLoading(false);
    try {
      await saveEvaluation(cookedId, result);
    } catch (e) {
      setSaveWarning('평가 결과를 마이페이지에 저장하지 못했어요.');
    }
  }, [cookedId, dishId, photo]);

  useEffect(() => {
    runEvaluation();
  }, [runEvaluation]);

  return (
    <SafeAreaView style={styles.safeArea}>
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
