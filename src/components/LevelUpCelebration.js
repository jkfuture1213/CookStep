import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export const CONFETTI_COLORS = ['#FFFFFF', '#FFD23F', '#FF9F68', '#7ED957', '#5BC0EB', '#FF5D8F'];
export const CONFETTI_COUNT = 36;

// 하늘에서 떨어지는 색종이 한 조각
export function ConfettiPiece({ piece, height }) {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fall, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fall, piece]);

  const translateY = fall.interpolate({ inputRange: [0, 1], outputRange: [-40, height + 40] });
  const translateX = fall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, piece.drift, piece.drift * 0.4] });
  const rotate = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size * 0.45,
          backgroundColor: piece.color,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

// 별 4개 이상으로 다음 단계 요리가 열렸을 때 띄우는 축하 화면입니다.
// dish: 새로 열린 요리 { name, level }, score: 이번에 받은 별 개수
export default function LevelUpCelebration({ visible, dish, score, onClose }) {
  const { width, height } = Dimensions.get('window');
  const starPop = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const smallStars = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  // 색종이는 화면이 열릴 때마다 위치와 색을 새로 정합니다.
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
    starPop.setValue(0);
    textIn.setValue(0);
    smallStars.forEach((v) => v.setValue(0));

    // 1) 큰 별이 튀어나오고 2) 받은 별이 하나씩 톡톡 3) 글자가 올라옵니다.
    Animated.sequence([
      Animated.spring(starPop, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.stagger(
        120,
        smallStars.map((v) => Animated.spring(v, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }))
      ),
      Animated.timing(textIn, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();

    // 큰 별이 계속 살짝 두근거립니다.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, starPop, textIn, pulse, smallStars]);

  if (!dish) {
    return null;
  }

  const bigStarScale = Animated.multiply(starPop, pulse);
  const bigStarRotate = starPop.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] });
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
          <Animated.Text style={[styles.bigStar, { transform: [{ scale: bigStarScale }, { rotate: bigStarRotate }] }]}>
            ⭐
          </Animated.Text>

          <View style={styles.starRow}>
            {smallStars.map((v, i) => (
              <Animated.Text
                key={i}
                style={[styles.smallStar, i >= score && styles.smallStarEmpty, { transform: [{ scale: v }] }]}
              >
                ★
              </Animated.Text>
            ))}
          </View>

          <Animated.View style={[styles.texts, { opacity: textIn, transform: [{ translateY: textTranslate }] }]}>
            <Text style={styles.headline}>별 {score}개 달성!</Text>
            <Text style={styles.message}>
              {dish.level}단계 <Text style={styles.dishName}>{dish.name}</Text> 요리가 열렸어요
            </Text>
            <Text style={styles.sub}>다음 요리에도 도전해 볼까요? 🍳</Text>
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
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  bigStar: {
    fontSize: 120,
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  smallStar: {
    fontSize: 36,
    color: '#FFD23F',
  },
  smallStarEmpty: {
    color: 'rgba(255,255,255,0.35)',
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
  dishName: {
    fontWeight: '900',
  },
  sub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
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
