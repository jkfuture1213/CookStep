// 요리 단계가 어디까지 열렸는지 계산합니다.

// 다음 단계를 여는 데 필요한 별 개수
export const UNLOCK_SCORE = 4;

// AI가 바쁠 때 나오는 "기본 평가"(항상 별 4개)도 단계 해제로 인정할지 정합니다.
// false면 AI가 사진을 보고 매긴 평가만 인정합니다.
export const UNLOCK_ACCEPTS_BASIC_EVALUATION = false;

// 이 기록이 단계 해제 조건(별 4개 이상)을 채웠는지
export function passesUnlock(record) {
  const evaluation = record?.evaluation;
  if (!evaluation || !(evaluation.score >= UNLOCK_SCORE)) {
    return false;
  }
  return UNLOCK_ACCEPTS_BASIC_EVALUATION || evaluation.source !== 'basic';
}

// 요리 실력 확인 결과로 처음부터 열어 두는 단계 수입니다(입문 1, 초급 2, 중급 3).
// App.js가 로그인 후 실력 확인 기록을 읽고 setStartLevel로 정합니다.
let startLevel = 1;

export function setStartLevel(level) {
  startLevel = Math.max(1, Math.floor(Number(level) || 1));
}

// dishes: 단계 순서대로 놓인 요리 목록, records: 요리 기록 목록
// first: 처음부터 열려 있는 단계 수(기본값은 실력 확인 결과). 그 위로는 앞 단계에서 별 4개 이상을 받아야 열립니다.
// 돌려주는 값: 열린 단계 수(1 이상). 예: 2면 1단계와 2단계가 열림.
export function getUnlockedLevel(dishes, records, first = startLevel) {
  let unlocked = Math.max(1, Math.min(first, dishes.length));
  while (unlocked < dishes.length) {
    const topDishId = dishes[unlocked - 1].id;
    const passed = records.some((record) => record.dishId === topDishId && passesUnlock(record));
    if (!passed) {
      break;
    }
    unlocked += 1;
  }
  return unlocked;
}

// 이 요리가 속한 단계 목록(같은 재료의 요리들)을 찾습니다.
export function findDishLadder(dishesByIngredient, dishId) {
  return Object.values(dishesByIngredient).find((list) => list.some((dish) => dish.id === dishId)) ?? null;
}

// 방금 받은 평가로 새 단계가 열렸는지 봅니다.
// records: 이번 기록을 포함한 요리 기록, cookedId/evaluation: 이번 기록과 평가
// 돌려주는 값: 새로 열린 요리({ id, name, level }) 또는 null
export function findNewlyUnlockedDish(ladder, records, cookedId, evaluation) {
  if (!ladder) {
    return null;
  }
  const others = records.filter((record) => record.id !== cookedId);
  const thisRecord = records.find((record) => record.id === cookedId);
  const before = getUnlockedLevel(ladder, others);
  const after = getUnlockedLevel(ladder, [...others, { ...thisRecord, id: cookedId, evaluation }]);
  if (after <= before) {
    return null;
  }
  return { ...ladder[after - 1], level: after };
}
