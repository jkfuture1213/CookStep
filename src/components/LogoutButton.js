import { signOut } from 'firebase/auth';
import { Pressable, StyleSheet, Text } from 'react-native';

import { auth } from '../firebase';
import { colors } from '../theme';

// 화면 오른쪽 위에 두는 작은 로그아웃 버튼입니다.
export default function LogoutButton() {
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

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: '#FFFFFF',
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
