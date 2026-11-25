import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemedStyles } from '../theme';

// 하단 탭의 '커뮤니티' 화면. 아직 기능이 없어 준비 중 안내만 보여 줍니다.
export default function CommunityScreen({ onBack }) {
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>‹ 돌아가기</Text>
        </Pressable>
      </View>
      <View style={styles.center}>
        <Text style={styles.emoji}>👥</Text>
        <Text style={styles.title}>커뮤니티 준비 중이에요</Text>
        <Text style={styles.text}>곧 다른 자취생들과 요리 사진과 팁을 나눌 수 있어요.</Text>
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
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    back: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 32,
      paddingBottom: 48,
    },
    emoji: {
      fontSize: 56,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    text: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
