import { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import LogoutButton from './LogoutButton';

// App.js가 "마이페이지 열기" 함수를 여기에 넣어 주면, 어느 화면에서든 꺼내 쓸 수 있습니다.
export const MyPageContext = createContext(() => {});

// 화면 오른쪽 위에 놓는 메뉴: 위에는 마이페이지 버튼, 아래에는 로그아웃 버튼.
export default function UserMenu() {
  const openMyPage = useContext(MyPageContext);

  return (
    <View style={styles.menu}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="마이페이지"
        onPress={openMyPage}
        hitSlop={6}
        style={({ pressed }) => [styles.myPage, pressed && styles.pressed]}
      >
        <Text style={styles.icon}>👤</Text>
      </Pressable>
      <LogoutButton />
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    alignItems: 'flex-end',
    gap: 8,
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
