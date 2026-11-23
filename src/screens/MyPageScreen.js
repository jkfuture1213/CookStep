import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getLoadErrorMessage, loadCookedDishes, loadCookedPhoto } from '../cookingHistory';
import { colors } from '../theme';

// 날짜를 "2026. 11. 23." 처럼 보여 줍니다.
function formatDate(date) {
  if (!date) {
    return '';
  }
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

// 상세 화면용: "2026년 11월 23일 오후 7:05"
function formatDateTime(date) {
  if (!date) {
    return '';
  }
  const hour = date.getHours();
  const ampm = hour < 12 ? '오전' : '오후';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${ampm} ${hour12}:${minute}`;
}

// 목록에서 요리를 누르면 보이는 상세 화면: 만든 날짜와 완성 사진
function CookedDishDetail({ item, onBack }) {
  const [photo, setPhoto] = useState(undefined); // undefined: 불러오는 중, null: 사진 없음
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!item.hasPhoto) {
      setPhoto(null);
      return undefined;
    }
    loadCookedPhoto(item.id)
      .then((uri) => active && setPhoto(uri))
      .catch(() => {
        if (active) {
          setError('사진을 불러오지 못했습니다.');
          setPhoto(null);
        }
      });
    return () => {
      active = false;
    };
  }, [item]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="목록으로"
          onPress={onBack}
          hitSlop={12}
          style={styles.side}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.email} numberOfLines={1}>
          {item.dishName}
        </Text>
        <View style={styles.side} />
      </View>

      <View style={styles.detail}>
        <Text style={styles.detailLabel}>만든 날짜</Text>
        <Text style={styles.detailDate}>{formatDateTime(item.completedAt)}</Text>

        <View style={styles.photoBox}>
          {photo === undefined ? (
            <ActivityIndicator color={colors.orange} />
          ) : photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <Text style={styles.noPhoto}>{error || '사진을 찍지 않았어요 📷'}</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// 마이페이지: 위에는 이메일, 아래에는 지금까지 만든 요리 목록(요리 이름, 만든 날짜).
export default function MyPageScreen({ user, onBack }) {
  const [dishes, setDishes] = useState(null); // null이면 불러오는 중
  const [error, setError] = useState('');
  const [openedItem, setOpenedItem] = useState(null); // 상세 화면으로 연 요리 기록

  useEffect(() => {
    let active = true;
    loadCookedDishes()
      .then((list) => active && setDishes(list))
      .catch((e) => {
        if (active) {
          setError(getLoadErrorMessage(e));
          setDishes([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (openedItem) {
    return <CookedDishDetail item={openedItem} onBack={() => setOpenedItem(null)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로 가기"
          onPress={onBack}
          hitSlop={12}
          style={styles.side}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
        <View style={styles.side} />
      </View>

      <Text style={styles.sectionTitle}>내가 만든 요리</Text>

      {dishes === null ? (
        <ActivityIndicator style={styles.loading} size="large" color={colors.orange} />
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍳</Text>
              <Text style={styles.emptyText}>
                {error || '아직 만든 요리가 없어요.\n첫 요리에 도전해 보세요!'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpenedItem(item)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Text style={styles.dishName}>
                {item.dishName}
                {item.hasPhoto ? '  📷' : ''}
              </Text>
              <Text style={styles.date}>{formatDate(item.completedAt)}  ›</Text>
            </Pressable>
          )}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  side: {
    width: 32,
  },
  back: {
    fontSize: 32,
    lineHeight: 34,
    color: colors.textMuted,
  },
  email: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.orange,
  },
  loading: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 58,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dishName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 15,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.75,
  },
  detail: {
    paddingHorizontal: 24,
    gap: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
  },
  detailDate: {
    fontSize: 17,
    color: colors.text,
  },
  photoBox: {
    marginTop: 18,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  noPhoto: {
    fontSize: 16,
    color: colors.textMuted,
  },
  empty: {
    marginTop: 48,
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
