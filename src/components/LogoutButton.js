import { signOut } from 'firebase/auth';
import { Pressable, StyleSheet, Text } from 'react-native';

import { auth } from '../firebase';
import { useThemedStyles } from '../theme';

// (지금은 쓰지 않음) 예전에 화면 오른쪽 위에 두던 로그아웃 버튼입니다. 로그아웃은 UserMenu 하단 메뉴로 옮겼습니다.
export default function LogoutButton() {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => signOut(auth)}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>로그아웃</Text>
    </Pressable>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.75,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
  },
});
