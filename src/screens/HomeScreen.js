import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNickname } from '../nickname';
import { useThemedStyles } from '../theme';

const WELCOME_DURATION_MS = 2000;

// 로그인 직후 잠깐 보이는 환영 화면입니다. 2초 뒤 onDone을 부릅니다(처음 로그인이면 실력 확인, 아니면 "오늘은 무엇을 하고 싶나요?" 화면으로).
export default function HomeScreen({ user, onDone }) {
  const styles = useThemedStyles(createStyles);
  // 막 가입했을 때는 닉네임 저장이 조금 늦게 끝나도 저장되는 즉시 바뀝니다.
  const nickname = useNickname(user);
  useEffect(() => {
    const timer = setTimeout(onDone, WELCOME_DURATION_MS);
    // 2초가 지나기 전에 로그아웃하면 타이머를 취소합니다.
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>환영해요!</Text>
        <Text style={styles.nickname}>{nickname}님</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.orange,
  },
  nickname: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
