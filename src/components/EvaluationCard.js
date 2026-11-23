import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

// 평가 결과(AI 평가 또는 기본 평가: 평점, 평가, 개선 사항)를 보여 주는 카드. 평가 화면과 마이페이지에서 같이 씁니다.
export default function EvaluationCard({ evaluation }) {
  const stars = '★'.repeat(evaluation.score) + '☆'.repeat(5 - evaluation.score);
  return (
    <View style={styles.card}>
      <View style={styles.scoreRow}>
        <Text style={styles.stars}>{stars}</Text>
        <Text style={styles.score}>{evaluation.score} / 5</Text>
      </View>

      <Text style={styles.label}>{evaluation.source === 'basic' ? '기본 평가' : 'AI 평가'}</Text>
      <Text style={styles.body} lineBreakStrategyIOS="hangul-word">
        {evaluation.summary}
      </Text>

      {evaluation.improvements?.length > 0 && (
        <>
          <Text style={styles.label}>다음엔 이렇게 해 보세요</Text>
          {evaluation.improvements.map((tip, i) => (
            <Text key={i} style={styles.tip} lineBreakStrategyIOS="hangul-word">
              • {tip}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stars: {
    fontSize: 26,
    color: colors.orange,
    letterSpacing: 2,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  tip: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
});
