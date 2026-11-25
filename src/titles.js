// 요리 기록을 보고 사용자 칭호를 정합니다.
// 아래 목록은 낮은 칭호부터 높은 칭호 순서이고, 조건을 채운 것 중 가장 높은 칭호가 적용됩니다.
import { DISHES_BY_INGREDIENT } from './data/dishes';
import { getUnlockedLevel } from './progress';

const MAX_LEVEL = 5;

// 재료별로 열린 단계 수. 아직 요리가 없는(업데이트 예정) 재료는 빼고 셉니다.
function getLevels(records) {
  return Object.values(DISHES_BY_INGREDIENT)
    .filter((dishes) => dishes.length > 0)
    .map((dishes) => getUnlockedLevel(dishes, records));
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
    check: (records) => getLevels(records).some((level) => level >= 3),
  },
  {
    name: '중급 요리사',
    emoji: '🔪',
    condition: '한 재료라도 5단계를 열면',
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

// 지금 칭호의 순서(0 = 평범한 자취생)
export function getCookingTitleIndex(records) {
  const list = records ?? [];
  for (let i = TITLES.length - 1; i > 0; i -= 1) {
    if (TITLES[i].check(list)) {
      return i;
    }
  }
  return 0;
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
