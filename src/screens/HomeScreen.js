import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import UserMenu from '../components/UserMenu';
import { colors } from '../theme';

const WELCOME_DURATION_MS = 2000;

// 로그인 직후 잠깐 보이는 환영 화면입니다. 2초 뒤 onDone을 불러 재료 선택 화면으로 넘어갑니다.
export default function HomeScreen({ user, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, WELCOME_DURATION_MS);
    // 2초가 지나기 전에 로그아웃하면 타이머를 취소합니다.
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <UserMenu />
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>환영해요!</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  email: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
