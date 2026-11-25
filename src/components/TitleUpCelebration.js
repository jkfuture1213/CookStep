import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { CONFETTI_COLORS, CONFETTI_COUNT, ConfettiPiece } from './LevelUpCelebration';

// 칭호가 올라갔을 때 띄우는 축하 화면입니다. (단계 해제 축하 화면과 같은 느낌)
// title: 새 칭호 { name, emoji, next: 다음 칭호 또는 null } (src/titles.js의 findTitleUp)
export default function TitleUpCelebration({ visible, title, onClose }) {
  const { width, height } = Dimensions.get('window');
  const badgePop = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const shine = useRef(new Animated.Value(0)).current;

  const confetti = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        key: `${i}-${visible}`,
        x: Math.random() * width,
        size: 10 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        delay: Math.random() * 900,
        duration: 2200 + Math.random() * 1400,
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
      })),
    [visible, width]
  );

  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    badgePop.setValue(0);
    textIn.setValue(0);
    shine.setValue(0);

    // 1) 칭호 그림이 튀어나오고 2) 칭호 배지가 반짝 3) 글자가 올라옵니다.
    Animated.sequence([
      Animated.spring(badgePop, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.spring(shine, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(textIn, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, badgePop, textIn, pulse, shine]);

  if (!title) {
    return null;
  }

  const emojiScale = Animated.multiply(badgePop, pulse);
  const emojiRotate = badgePop.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] });
  const textTranslate = textIn.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {confetti.map((piece) => (
            <ConfettiPiece key={piece.key} piece={piece} height={height} />
          ))}
        </View>

        <View style={styles.center}>
          <Animated.Text style={[styles.bigEmoji, { transform: [{ scale: emojiScale }, { rotate: emojiRotate }] }]}>
            {title.emoji}
          </Animated.Text>

          <Animated.View style={[styles.badge, { transform: [{ scale: shine }] }]}>
            <Text style={styles.badgeText}>{title.name}</Text>
          </Animated.View>

          <Animated.View style={[styles.texts, { opacity: textIn, transform: [{ translateY: textTranslate }] }]}>
            <Text style={styles.headline}>칭호 상승!</Text>
            <Text style={styles.message}>
              이제 <Text style={styles.bold}>{title.name}</Text>(이)에요
            </Text>
            <Text style={styles.sub}>
              {title.next
                ? `다음 칭호 ${title.next.emoji} ${title.next.name}: ${title.next.condition}`
                : '최고 칭호를 얻었어요! 👏'}
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: textIn }]}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>좋아요!</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.orange,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  bigEmoji: {
    fontSize: 120,
  },
  badge: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.orange,
  },
  texts: {
    alignItems: 'center',
    marginTop: 24,
    gap: 10,
  },
  headline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bold: {
    fontWeight: '900',
  },
  sub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.orange,
  },
  pressed: {
    opacity: 0.8,
  },
});
