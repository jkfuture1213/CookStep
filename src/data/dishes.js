// 재료별 요리 목록입니다. 배열 순서가 곧 단계입니다(첫 번째 = 1단계).
// 1단계는 처음부터 열려 있고, 그 앞 단계 요리에서 별 4개 이상 평가를 받으면 다음 단계가 열립니다.
// 레시피(src/data/recipes.js)가 없는 요리는 열려도 "레시피 준비 중"으로 보입니다.
// emoji: 레시피 선택 화면(3x3 타일)에 보이는 그림입니다.
// 아직 요리가 정해지지 않은 재료는 빈 배열로 두면 화면에 "준비 중"으로 보입니다.
export const DISHES_BY_INGREDIENT = {
  egg: [
    { id: 'boiled-egg', name: '삶은 계란', emoji: '🥚' },
    { id: 'fried-egg', name: '계란후라이', emoji: '🍳' },
    { id: 'scrambled-egg', name: '스크램블 에그', emoji: '🧈' },
    { id: 'rolled-omelette', name: '계란말이', emoji: '🌯' },
    { id: 'omelette', name: '오믈렛', emoji: '🫔' },
  ],
  kimchi: [
    { id: 'stir-fried-kimchi', name: '볶은 김치', emoji: '🥬' },
    { id: 'kimchi-fried-rice', name: '김치볶음밥', emoji: '🍚' },
    { id: 'braised-kimchi', name: '김치찜', emoji: '🥘' },
    { id: 'kimchi-bean-sprout-soup', name: '김치콩나물국', emoji: '🍲' },
    { id: 'kimchi-stew', name: '김치찌개', emoji: '🫕' },
    { id: 'kimchi-pancake', name: '김치전', emoji: '🥞' },
    { id: 'geotjeori', name: '겉절이', emoji: '🥗' },
  ],
  tuna: [],
  pasta: [
    { id: 'tomato-pasta', name: '토마토 파스타', emoji: '🍅' },
    { id: 'aglio-olio', name: '알리오 올리오', emoji: '🧄' },
    { id: 'arrabbiata', name: '아라비아따', emoji: '🌶️' },
    { id: 'carbonara', name: '까르보나라', emoji: '🥓' },
    { id: 'gnocchi', name: '뇨끼', emoji: '🥔' },
    { id: 'fresh-pasta', name: '수제 생면', emoji: '🍝' },
    { id: 'mentaiko-pasta', name: '명란 오일 파스타', emoji: '🐟' },
  ],
};
