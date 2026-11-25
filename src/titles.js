// 요리 기록을 보고 사용자 칭호를 정합니다.
// 아래 목록은 낮은 칭호부터 높은 칭호 순서이고, 조건을 채운 것 중 가장 높은 칭호가 적용됩니다.
import { DISHES_BY_INGREDIENT } from './data/dishes';
import { getUnlockedLevel } from './progress';
import { getCurrentSkillResult } from './skillCheck';

const MAX_LEVEL = 5;

// 재료별로 열린 단계 수. 아직 요리가 없는(업데이트 예정) 재료는 빼고 셉니다.
// 칭호는 직접 통과한 단계로만 정하므로, 실력 확인으로 미리 열린 단계는 세지 않습니다(시작 단계 1).
function getLevels(records) {
  return Object.values(DISHES_BY_INGREDIENT)
    .filter((dishes) => dishes.length > 0)
    .map((dishes) => getUnlockedLevel(dishes, records, 1));
}

export const TITLES = [
  {
    name: '평범한 자취생',
    emoji: '🏠',
    condition: '아직 요리를 한 번도 만들지 않았어요',
    check: () => true,
  },
  {
    name: '요리 초보',
    emoji: '🍳',
    condition: '요리를 1개 완성하면',
    check: (records) => records.length > 0,
  },
  {
    name: '초급 요리사',
    emoji: '🥄',
    condition: '한 재료라도 3단계를 열면',
    // 요리 실력 확인 점수로 바로 받는 조건(src/skillCheck.js의 level)
    scoreLevel: 'novice',
    scoreCondition: '요리 실력 확인 4~7점',
    check: (records) => getLevels(records).some((level) => level >= 3),
  },
  {
    name: '중급 요리사',
    emoji: '🔪',
    condition: '한 재료라도 5단계를 열면',
    scoreLevel: 'intermediate',
    scoreCondition: '요리 실력 확인 8~11점',
    check: (records) => getLevels(records).some((level) => level >= MAX_LEVEL),
  },
  {
    name: '자취 요리 마스터',
    emoji: '👑',
    condition: '모든 재료의 5단계를 열면',
    check: (records) => {
      const levels = getLevels(records);
      return levels.length > 0 && levels.every((level) => level >= MAX_LEVEL);
    },
  },
];

// 요리 실력 확인 점수로 받는 칭호의 순서(초급 4~7점 → 초급 요리사, 중급 8~11점 → 중급 요리사, 그 외 0)
export function getScoreTitleIndex() {
  const level = getCurrentSkillResult()?.level;
  const index = TITLES.findIndex((title) => title.scoreLevel && title.scoreLevel === level);
  return Math.max(0, index);
}

// 지금 칭호의 순서(0 = 평범한 자취생). 요리 기록으로 얻은 칭호와 실력 확인 점수로 받은 칭호 중 높은 쪽입니다.
export function getCookingTitleIndex(records) {
  const list = records ?? [];
  let earned = 0;
  for (let i = TITLES.length - 1; i > 0; i -= 1) {
    if (TITLES[i].check(list)) {
      earned = i;
      break;
    }
  }
  return Math.max(earned, getScoreTitleIndex());
}

export function getCookingTitle(records) {
  return TITLES[getCookingTitleIndex(records)].name;
}

// 기록이 before에서 after로 바뀌면서 칭호가 올라갔다면 새 칭호를, 아니면 null을 돌려줍니다.
// 돌려주는 값 예: { name: '요리 초보', emoji: '🍳', condition: '...', next: { ...다음 칭호 } 또는 null }
export function findTitleUp(beforeRecords, afterRecords) {
  const before = getCookingTitleIndex(beforeRecords);
  const after = getCookingTitleIndex(afterRecords);
  if (after <= before) {
    return null;
  }
  return { ...TITLES[after], next: TITLES[after + 1] ?? null };
}
