import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getShareErrorMessage, sharePhoto } from '../sharePhoto';
import { colors } from '../theme';

// "인스타그램에 공유" 버튼. 누르면 휴대폰 공유 창이 열리고, 거기서 인스타그램을 고릅니다.
// photo: 파일 주소 또는 사진 데이터(src/sharePhoto.js 참고)
export default function ShareButton({ photo, dishName }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');

  const share = async () => {
    setError('');
    setSharing(true);
    try {
      await sharePhoto(photo, dishName);
    } catch (e) {
      console.warn('사진 공유 오류', e);
      setError(getShareErrorMessage(e));
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        onPress={share}
        disabled={sharing || !photo}
        style={({ pressed }) => [styles.button, (pressed || sharing) && styles.pressed]}
      >
        {sharing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.text}>📸 인스타그램에 공유</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>공유 창에서 Instagram을 골라 주세요</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C13584',
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
