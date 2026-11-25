import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { loadCookedDishes } from '../cookingHistory';
import { colors } from '../theme';
import { getCookingTitle } from '../titles';
import EasterEgg from './EasterEgg';
import LogoutButton from './LogoutButton';

// App.js가 "마이페이지 열기" 함수를 여기에 넣어 주면, 어느 화면에서든 꺼내 쓸 수 있습니다.
export const MyPageContext = createContext(() => {});

// 칭호 배지를 이 횟수만큼, 누를 때마다 이 시간 안에 이어서 누르면 이스터에그가 열립니다.
const EASTER_EGG_TAPS = 10;
const EASTER_EGG_GAP_MS = 700;

// 화면 오른쪽 위에 놓는 메뉴: 위에는 칭호와 마이페이지 버튼, 아래에는 로그아웃 버튼.
export default function UserMenu() {
  const openMyPage = useContext(MyPageContext);
  // null이면 기록을 불러오는 중이라 칭호를 아직 보여 주지 않습니다.
  const [title, setTitle] = useState(null);
  const [showEgg, setShowEgg] = useState(false);
  const taps = useRef({ count: 0, last: 0 });

  function handleBadgePress() {
    const now = Date.now();
    const tapState = taps.current;
    tapState.count = now - tapState.last <= EASTER_EGG_GAP_MS ? tapState.count + 1 : 1;
    tapState.last = now;
    if (tapState.count >= EASTER_EGG_TAPS) {
      tapState.count = 0;
      setShowEgg(true);
    }
  }

  // 화면이 바뀔 때마다 이 메뉴가 새로 그려지므로, 그때마다 기록을 다시 읽어 칭호를 정합니다.
  useEffect(() => {
    let active = true;
    loadCookedDishes()
      .then((records) => active && setTitle(getCookingTitle(records)))
      .catch((e) => {
        console.warn('칭호용 요리 기록 불러오기 오류', e);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.menu}>
      <EasterEgg visible={showEgg} onClose={() => setShowEgg(false)} />
      <View style={styles.row}>
        {title ? (
          <Pressable onPress={handleBadgePress} style={styles.badge} accessibilityLabel={`칭호 ${title}`}>
            <Text style={styles.badgeText}>{title}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="마이페이지"
          onPress={openMyPage}
          hitSlop={6}
          style={({ pressed }) => [styles.myPage, pressed && styles.pressed]}
        >
          <Text style={styles.icon}>👤</Text>
        </Pressable>
      </View>
      <LogoutButton />
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    alignItems: 'flex-end',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.orange,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  myPage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  pressed: {
    opacity: 0.75,
  },
});
