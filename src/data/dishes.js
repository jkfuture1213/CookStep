// 재료별 요리 목록입니다. enabled가 true인 요리만 누를 수 있습니다.
// 아직 요리가 정해지지 않은 재료는 빈 배열로 두면 화면에 "준비 중"으로 보입니다.
export const DISHES_BY_INGREDIENT = {
  egg: [
    { id: 'boiled-egg', name: '삶은 계란', enabled: true },
    { id: 'fried-egg', name: '계란후라이', enabled: false },
    { id: 'scrambled-egg', name: '스크램블 에그', enabled: false },
    { id: 'rolled-omelette', name: '계란말이', enabled: false },
    { id: 'omelette', name: '오믈렛', enabled: false },
  ],
  kimchi: [],
  tuna: [],
  pasta: [],
};
