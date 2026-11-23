// 요리별 학습 단계입니다. 한 단계가 학습 화면 한 장입니다.
// picture: 단계 그림(이모지 조합). 나중에 사진으로 바꾸려면 image: require('../../assets/파일.jpg')를 넣으세요.
// pictureCaption: 그림 아래 작은 글씨(선택)
export const RECIPES = {
  'boiled-egg': {
    name: '삶은 계란',
    ingredients: ['계란', '물', '소금 1큰술'],
    steps: [
      {
        picture: ['🍲', '💧', '🧂'],
        text: '냄비에 계란이 잠길 만큼의 물을 넣고, 소금을 한 큰술 넣는다.',
      },
      {
        picture: ['🥚', '💧', '🔥'],
        text: '찬 물에 계란을 넣고 불을 켠다.',
      },
      {
        picture: ['♨️', '➡️', '🔥'],
        pictureCaption: '끓으면 중불로',
        text: '물이 끓으면 불을 중불로 줄인다.',
      },
      {
        picture: ['⏱️'],
        pictureCaption: '반숙 6~7분 · 완숙 12~13분',
        text: '물이 끓은 시점부터 6~7분 가량은 반숙, 12~13분 가량은 완숙으로 익힐 수 있다.',
      },
      {
        picture: ['🥚', '🧊', '💧'],
        text: '다 익은 계란을 찬물에 넣어 식힌다.',
      },
    ],
  },
};
