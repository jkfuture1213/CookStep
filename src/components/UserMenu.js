import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNickname } from '../nickname';
import { useThemedStyles } from '../theme';
import GlassSurface from './GlassSurface';

// 화면 아래쪽 리퀴드 글래스 탭 바: 커뮤니티 · AI 평가 · 학습 · 설정 · 마이페이지(닉네임)
// '학습' 탭은 "오늘은 무엇을 하고 싶나요?" 화면(screen 'goal')을 엽니다.
// - 탭을 누르면 그 화면으로 갑니다.
// - 바 위에서 손가락을 좌우로 밀면 유리 렌즈가 손가락을 따라 움직이고, 손을 떼면 가장 가까운 탭으로 붙으며 그 화면이 열립니다.
// App.js가 화면 아래에 붙입니다. activeTab: 지금 열린 탭 key(탭 화면이 아니면 null)
export const TABS = [
  { key: 'community', icon: '👥', label: '커뮤니티' },
  { key: 'aiEval', icon: '✨', label: 'AI 평가' },
  { key: 'goal', icon: '📚', label: '학습' },
  { key: 'settings', icon: '⚙️', label: '설정' },
  { key: 'mypage', icon: '👤', label: null }, // 이름 대신 닉네임을 보여 줍니다.
];

const BAR_HEIGHT = 64;
const LENS_INSET = 4;
const TAP_SLOP = 6; // 이만큼 안 움직이면 '누르기'로 봅니다.

export default function UserMenu({ user, activeTab, onSelectTab }) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const nickname = useNickname(user);
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth / TABS.length;
  const activeIndex = TABS.findIndex((tab) => tab.key === activeTab);

  // 렌즈 위치(왼쪽 x), 보이는 정도, 크기
  const lensX = useRef(new Animated.Value(0)).current;
  const lensOpacity = useRef(new Animated.Value(activeIndex >= 0 ? 1 : 0)).current;
  const lensScale = useRef(new Animated.Value(1)).current;
  const [dragIndex, setDragIndex] = useState(null); // 끄는 동안 렌즈 아래에 있는 탭

  // 최신 값을 PanResponder 안에서 쓰기 위해 ref에 담아 둡니다.
  const latest = useRef({});
  latest.current = { tabWidth, activeIndex, onSelectTab };
  const dragStart = useRef(0);

  // 탭 화면이 바뀌면 렌즈를 그 탭으로 옮기고, 탭 화면이 아니면 숨깁니다.
  useEffect(() => {
    if (!tabWidth) {
      return;
    }
    if (activeIndex >= 0) {
      Animated.parallel([
        Animated.spring(lensX, { toValue: activeIndex * tabWidth, useNativeDriver: true, friction: 8 }),
        Animated.timing(lensOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(lensOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [activeIndex, tabWidth, lensX, lensOpacity]);

  const panResponder = useMemo(() => {
    const clampLeft = (x) => {
      const { tabWidth: w } = latest.current;
      return Math.min(Math.max(x - w / 2, 0), w * (TABS.length - 1));
    };
    const indexAt = (left) => {
      const { tabWidth: w } = latest.current;
      return Math.min(TABS.length - 1, Math.max(0, Math.round(left / w)));
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => {
        const left = clampLeft(event.nativeEvent.locationX);
        dragStart.current = left + latest.current.tabWidth / 2;
        lensX.stopAnimation();
        lensX.setValue(left);
        setDragIndex(indexAt(left));
        Animated.parallel([
          Animated.timing(lensOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.spring(lensScale, { toValue: 1.12, useNativeDriver: true, friction: 6 }),
        ]).start();
      },
      onPanResponderMove: (_, gesture) => {
        const left = clampLeft(dragStart.current + gesture.dx);
        lensX.setValue(left);
        setDragIndex(indexAt(left));
      },
      onPanResponderRelease: (_, gesture) => {
        const { tabWidth: w, onSelectTab: select } = latest.current;
        const moved = Math.abs(gesture.dx) > TAP_SLOP;
        const left = clampLeft(dragStart.current + (moved ? gesture.dx : 0));
        const index = indexAt(left);
        setDragIndex(null);
        Animated.parallel([
          Animated.spring(lensX, { toValue: index * w, useNativeDriver: true, friction: 7 }),
          Animated.spring(lensScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
        ]).start();
        select?.(TABS[index].key);
      },
      onPanResponderTerminate: () => {
        const { tabWidth: w, activeIndex: active } = latest.current;
        setDragIndex(null);
        Animated.spring(lensScale, { toValue: 1, useNativeDriver: true }).start();
        if (active >= 0) {
          Animated.spring(lensX, { toValue: active * w, useNativeDriver: true }).start();
        } else {
          Animated.timing(lensOpacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        }
      },
    });
  }, [lensX, lensOpacity, lensScale]);

  const highlighted = dragIndex ?? activeIndex;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <GlassSurface style={styles.bar}>
        <View
          style={styles.inner}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          {tabWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.lens,
                {
                  width: tabWidth - LENS_INSET * 2,
                  opacity: lensOpacity,
                  transform: [{ translateX: lensX }, { scale: lensScale }],
                },
              ]}
            >
              <GlassSurface style={styles.lensGlass} interactive>
                <View style={styles.lensTint} />
              </GlassSurface>
            </Animated.View>
          ) : null}

          {TABS.map((tab, index) => {
            const on = index === highlighted;
            const label = tab.key === 'mypage' ? nickname : tab.label;
            return (
              <View
                key={tab.key}
                style={styles.tab}
                // 터치는 모두 바(inner)가 받도록 해서 손가락 위치(locationX)를 바 기준으로 읽습니다.
                pointerEvents="none"
                accessible
                accessibilityRole="tab"
                accessibilityLabel={tab.key === 'mypage' ? `마이페이지 ${nickname}` : tab.label}
                accessibilityState={{ selected: index === activeIndex }}
                onAccessibilityTap={() => onSelectTab?.(tab.key)}
              >
                <Text style={styles.icon}>{tab.icon}</Text>
                <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </GlassSurface>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: colors.background,
    },
    bar: {
      height: BAR_HEIGHT,
      borderRadius: BAR_HEIGHT / 2,
    },
    inner: {
      flex: 1,
      flexDirection: 'row',
    },
    lens: {
      position: 'absolute',
      top: LENS_INSET,
      bottom: LENS_INSET,
      left: LENS_INSET,
    },
    lensGlass: {
      flex: 1,
      borderRadius: (BAR_HEIGHT - LENS_INSET * 2) / 2,
    },
    lensTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.orangeSoft,
      opacity: 0.55,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      paddingHorizontal: 4,
    },
    icon: {
      fontSize: 22,
      lineHeight: 26,
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
    },
    labelOn: {
      color: colors.orange,
      fontWeight: '800',
    },
  });
