import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSkillResult, MAX_SKILL_SCORE, SKILL_QUESTIONS } from '../skillCheck';
import { SKILLS } from '../data/skills';
import { TITLES } from '../titles';
import { useThemedStyles } from '../theme';

const INTRO_DURATION_MS = 3000;
// 하나만 고르는 질문은 누른 답이 잠깐 보인 뒤 다음 질문으로 넘어갑니다.
const AUTO_NEXT_DELAY_MS = 300;

// 첫 로그인 때 나오는 요리 실력 확인 화면입니다.
// 안내 문구를 3초 보여 준 뒤 질문을 한 개씩 보여 주고, 다 답하면 결과(입문/초급/중급)를 보여 줍니다.
// 결과 화면의 '시작하기'를 누르면 onDone(answers)를 부릅니다.
export default function SkillCheckScreen({ onDone }) {
  const styles = useThemedStyles(createStyles);
  const [showIntro, setShowIntro] = useState(true);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null); // 다 답하면 getSkillResult 결과
  const nextTimer = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), INTRO_DURATION_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(nextTimer.current);
    };
  }, []);

  const total = SKILL_QUESTIONS.length;
  const question = SKILL_QUESTIONS[index];
  const isLast = index === total - 1;

  function goNext(nextAnswers) {
    if (isLast) {
      setAnswers(nextAnswers);
      setResult(getSkillResult(nextAnswers));
    } else {
      setIndex(index + 1);
    }
  }

  function handleSingle(value) {
    if (nextTimer.current) {
      return; // 이미 넘어가는 중이면 무시합니다.
    }
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    nextTimer.current = setTimeout(() => {
      nextTimer.current = null;
      goNext(nextAnswers);
    }, AUTO_NEXT_DELAY_MS);
  }

  function handleMultiple(value) {
    const current = answers[question.id] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setAnswers({ ...answers, [question.id]: next });
  }

  function handlePrev() {
    clearTimeout(nextTimer.current);
    nextTimer.current = null;
    setIndex(index - 1);
  }

  if (showIntro) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBarEnd}>
        </View>
        <View style={styles.intro}>
          <Text style={styles.introEmoji}>👩‍🍳</Text>
          <Text style={styles.introTitle}>먼저 요리 실력을 확인해 볼게요!</Text>
          <Text style={styles.introText}>4가지 질문에 답을 해 주세요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (result) {
    // 점수로 바로 받는 칭호(입문은 없음)
    const scoreTitle = TITLES.find((title) => title.scoreLevel === result.level);
    const skillNames = result.recommendedSkills
      .map((id) => SKILLS.find((skill) => skill.id === id)?.name)
      .filter(Boolean);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBarEnd}>
        </View>
        <View style={styles.intro}>
          <Text style={styles.introEmoji}>{result.emoji}</Text>
          <Text style={styles.introTitle}>{result.label}로 시작해요!</Text>
          <Text style={styles.resultScore}>요리 실력 점수 {result.score} / {MAX_SKILL_SCORE}</Text>
          <Text style={styles.resultText}>{result.message}</Text>
          {scoreTitle ? (
            <Text style={styles.resultTitle}>
              🎖️ {scoreTitle.emoji} {scoreTitle.name} 칭호를 받았어요!
            </Text>
          ) : null}
          {skillNames.length > 0 ? (
            <Text style={styles.resultText}>추천 기초 스킬: {skillNames.join(', ')}</Text>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onDone?.(answers)}
            style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
          >
            <Text style={styles.nextText}>시작하기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const selected = answers[question.id];
  const multiSelected = question.multiple ? selected ?? [] : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        {index > 0 ? (
          <Pressable accessibilityRole="button" onPress={handlePrev} hitSlop={8}>
            <Text style={styles.back}>‹ 이전 질문</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.counter}>
          {index + 1} / {total}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + 1) / total) * 100}%` }]} />
        </View>

        <Text style={styles.question}>{question.question}</Text>
        {question.hint ? <Text style={styles.hint}>{question.hint}</Text> : null}

        <View style={styles.options}>
          {question.options.map((option) => {
            const isSelected = question.multiple
              ? multiSelected.includes(option.value)
              : selected === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole={question.multiple ? 'checkbox' : 'radio'}
                accessibilityState={question.multiple ? { checked: isSelected } : { selected: isSelected }}
                onPress={() =>
                  question.multiple ? handleMultiple(option.value) : handleSingle(option.value)
                }
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                {question.multiple ? (
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <Text style={styles.checkText}>✓</Text>}
                  </View>
                ) : (
                  isSelected && <Text style={styles.checkMark}>✓</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {question.multiple && (
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => goNext({ ...answers, [question.id]: multiSelected })}
            style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
          >
            <Text style={styles.nextText}>{isLast ? '완료' : '다음'}</Text>
          </Pressable>
        </View>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topBarEnd: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  back: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  intro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  introEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.orange,
    textAlign: 'center',
  },
  introText: {
    fontSize: 17,
    color: colors.text,
    textAlign: 'center',
  },
  resultTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '800',
    color: colors.orange,
    textAlign: 'center',
  },
  resultScore: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  resultText: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  counter: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
  },
  progressTrack: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.orange,
  },
  question: {
    marginTop: 28,
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  hint: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textMuted,
  },
  options: {
    marginTop: 24,
    gap: 12,
  },
  option: {
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  optionSelected: {
    backgroundColor: colors.orange,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.orange,
  },
  optionTextSelected: {
    color: colors.onOrange,
  },
  checkMark: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onOrange,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.onOrange,
    backgroundColor: colors.onOrange,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.orange,
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
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onOrange,
  },
});
