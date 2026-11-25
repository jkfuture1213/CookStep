import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme';

// 칭호 배지를 빠르게 10번 누르면 나오는 이스터에그 화면입니다. 아무 곳이나 한 번 누르면 닫힙니다.
export default function EasterEgg({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.screen}>
        <Text style={styles.heart}>💕</Text>
        <Text style={styles.body}>이 앱은 제가 많이 많이 사랑하는 여자친구가 만들어 줬습니다.</Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
    backgroundColor: colors.background,
  },
  heart: {
    fontSize: 72,
  },
  body: {
    fontSize: 22,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.orange,
    textAlign: 'center',
  },
});
