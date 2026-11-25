// 첫 로그인 때 받는 요리 실력 확인 질문과 답 저장입니다.
// 저장 위치: users/{uid}/profile/skillCheck → { answers, completedAt }
// answers 예: { frequency: 'monthly', canCook: 'basic', knife: 'slow', heatSeasoning: 'recipe' }
// (예전에 저장된 terms(용어 질문) 답은 점수에 쓰지 않습니다.)
// 이 기록이 있으면 다음 로그인부터는 질문을 건너뜁니다.
// 답으로 점수를 매겨 입문/초급/중급과 시작 단계, 추천을 정합니다(getSkillResult).
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth } from './firebase';

const TIMEOUT_MS = 10000;

export const SKILL_QUESTIONS = [
  {
    id: 'frequency',
    question: '얼마나 자주 요리하세요?',
    options: [
      { value: 'rarely', label: '거의 안 해요' },
      { value: 'monthly', label: '한 달에 몇 번' },
      { value: 'weekly', label: '일주일에 몇 번' },
      { value: 'daily', label: '거의 매일' },
    ],
  },
  {
    id: 'canCook',
    question: '혼자 만들 수 있는 요리는?',
    options: [
      { value: 'ramen', label: '라면·계란프라이 정도' },
      { value: 'basic', label: '볶음밥·찌개' },
      { value: 'recipe', label: '레시피 보면 웬만한 한식' },
      { value: 'improvise', label: '레시피 없이도 응용 가능' },
    ],
  },
  {
    id: 'knife',
    question: '칼질은 어느 정도 하세요?',
    options: [
      { value: 'never', label: '거의 안 해 봤어요' },
      { value: 'slow', label: '썰 수는 있지만 느려요' },
      { value: 'can', label: '채썰기·다지기 가능해요' },
      { value: 'skilled', label: '익숙해요' },
    ],
  },
  {
    id: 'heatSeasoning',
    question: '불 조절이나 간 맞추기는 어때요?',
    options: [
      { value: 'struggle', label: '자주 태우거나 싱거워요' },
      { value: 'recipe', label: '레시피대로만 맞춰요' },
      { value: 'taste', label: '맛 보면서 조절할 수 있어요' },
    ],
  },
];

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function getRef() {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('not-signed-in');
  }
  return doc(getFirestore(auth.app), 'users', user.uid, 'profile', 'skillCheck');
}

// 저장된 답을 읽습니다. 아직 실력 확인을 하지 않았으면 null.
export async function loadSkillCheckAnswers() {
  const snapshot = await withTimeout(getDoc(getRef()), TIMEOUT_MS);
  return snapshot.exists() ? snapshot.data().answers ?? {} : null;
}

export async function saveSkillCheck(answers) {
  const result = getSkillResult(answers);
  await withTimeout(
    setDoc(getRef(), {
      answers,
      score: result.score,
      level: result.level,
      completedAt: serverTimestamp(),
    }),
    TIMEOUT_MS
  );
}

// ----- 점수와 결과 -----
// 보기 순서대로 0점부터: 1~3번은 0~3점, 4번은 0~2점. 총 11점.
// 0~3 입문(1단계부터, 기초 스킬 먼저 추천) / 4~7 초급(2단계까지 미리 열기) / 8~11 중급(3단계까지 열고 레시피 따라 만들기 추천)
export const MAX_SKILL_SCORE = 11;
export const SKILL_LEVELS = {
  beginner: {
    label: '입문 요리사',
    emoji: '🌱',
    startLevel: 1,
    message: '기초 요리 스킬부터 차근차근 익혀 봐요. 요리는 모두 1단계부터 시작해요.',
  },
  novice: {
    label: '초급 요리사',
    emoji: '🍳',
    startLevel: 2,
    message: '재료별 요리를 2단계까지 미리 열어 뒀어요.',
  },
  intermediate: {
    label: '중급 요리사',
    emoji: '👨‍🍳',
    startLevel: 3,
    message: '재료별 요리를 3단계까지 미리 열어 뒀어요. 레시피 따라 만들기도 추천해요!',
  },
};

function optionScore(questionId, value) {
  const question = SKILL_QUESTIONS.find((q) => q.id === questionId);
  const index = question ? question.options.findIndex((option) => option.value === value) : -1;
  return Math.max(0, index);
}

// 돌려주는 값 예: { score: 8, level: 'novice', label: '초급 요리사', startLevel: 2,
//   recommendedSkills: ['skill-knife'], recommendedGoal: null, recommendBasicSkills: false, ... }
export function getSkillResult(answers = {}) {
  const knifeScore = optionScore('knife', answers.knife);
  const heatScore = optionScore('heatSeasoning', answers.heatSeasoning);
  const score =
    optionScore('frequency', answers.frequency) +
    optionScore('canCook', answers.canCook) +
    knifeScore +
    heatScore;

  const level = score <= 3 ? 'beginner' : score <= 7 ? 'novice' : 'intermediate';

  // 칼질 0~1점이면 '칼질 기본', 불 조절·간 맞추기 0점이면 '불 조절'·'간 맞추기'를 추천합니다.
  const recommendedSkills = [];
  if (answers.knife !== undefined && knifeScore <= 1) {
    recommendedSkills.push('skill-knife');
  }
  if (answers.heatSeasoning !== undefined && heatScore === 0) {
    recommendedSkills.push('skill-heat', 'skill-seasoning');
  }

  return {
    score,
    level,
    ...SKILL_LEVELS[level],
    recommendedSkills,
    // '오늘은 무엇을 하고 싶나요?'에서 추천할 버튼: 입문은 배우기, 중급은 레시피 따라 만들기
    recommendedGoal: level === 'beginner' ? 'learn' : level === 'intermediate' ? 'recipe' : null,
    // '무엇을 배워 볼까요?'에서 기초 스킬을 추천할지
    recommendBasicSkills: level === 'beginner',
  };
}

// 지금 로그인한 사용자의 결과. App.js가 로그인 후·실력 확인 후 정합니다. 없으면 null.
let currentResult = null;

export function setCurrentSkillResult(result) {
  currentResult = result;
}

export function getCurrentSkillResult() {
  return currentResult;
}
