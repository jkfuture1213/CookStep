import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

import { useThemedStyles } from '../theme';

const DURATION_MS = 280;
const SLIDE_DISTANCE = 24;

// 화면이 바뀔 때 새 화면이 살짝 오른쪽에서 밀려 들어오며 서서히 나타나게 합니다.
// App.js에서 화면마다 다른 key를 주면, 화면이 바뀔 때마다 이 컴포넌트가 새로 그려지며 애니메이션이 다시 실행됩니다.
// React Native 기본 Animated만 써서 Expo Go에서 추가 설치 없이 동작합니다.
export default function ScreenTransition({ children }) {
  const styles = useThemedStyles(createStyles);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SLIDE_DISTANCE, 0],
  });

  return (
    <Animated.View style={[styles.container, { opacity: progress, transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
