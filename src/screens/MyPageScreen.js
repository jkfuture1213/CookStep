import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import EvaluationCard from '../components/EvaluationCard';
import ShareButton from '../components/ShareButton';
import { deleteCookedDish, getLoadErrorMessage, loadCookedDishes, loadCookedPhoto } from '../cookingHistory';
import { checkNickname, NICKNAME_MAX, saveNickname, useNickname } from '../nickname';
import { useColors, useThemedStyles } from '../theme';
import { getCookingTitleIndex, TITLES } from '../titles';

// 가입한 날을 1일차로 셉니다. 예: 어제 가입했으면 2일차.
function getCookingDay(user) {
  const created = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
  if (!created || Number.isNaN(created.getTime())) {
    return 1;
  }
  const start = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.round((today - start) / 86400000) + 1);
}

// 마이페이지 위쪽: 프로필 사진, 이메일, 칭호, 요리 시작 N일차
function ProfileHeader({ user, dishes, onOpenTitles, onEditNickname }) {
  const styles = useThemedStyles(createStyles);
  const nickname = useNickname(user);
  return (
    <View style={styles.profile}>
      <View style={styles.avatar}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarEmoji}>👤</Text>
        )}
      </View>
      <Text style={styles.nickname} numberOfLines={1}>
        {nickname}
      </Text>
      <Text style={styles.profileEmail} numberOfLines={1}>
        {user.email}
      </Text>
      {dishes !== null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="칭호 안내 보기"
          onPress={onOpenTitles}
          hitSlop={6}
          style={({ pressed }) => [styles.titleBadge, pressed && styles.pressed]}
        >
          <Text style={styles.titleBadgeText}>
            {TITLES[getCookingTitleIndex(dishes)].name}  ⓘ
          </Text>
        </Pressable>
      ) : null}
      <Text style={styles.cookingDay}>
        요리 시작 <Text style={styles.cookingDayNumber}>{getCookingDay(user)}일차</Text>
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onEditNickname}
        style={({ pressed }) => [styles.nicknameButton, pressed && styles.pressed]}
      >
        <Text style={styles.nicknameButtonText}>✏️ 닉네임 변경</Text>
      </Pressable>
    </View>
  );
}

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
function CookedDishDetail({ item, onBack, onDeleted }) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const [photo, setPhoto] = useState(undefined); // undefined: 불러오는 중, null: 사진 없음
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const remove = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteCookedDish(item.id);
      onDeleted(item.id);
    } catch (e) {
      console.warn('요리 기록 삭제 오류', e);
      setDeleteError(
        e?.code === 'permission-denied'
          ? '삭제 권한이 없어요. Firestore 보안 규칙을 확인해 주세요.'
          : '삭제하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.'
      );
      setDeleting(false);
    }
  };

  // 실수로 지우지 않도록 한 번 더 물어봅니다.
  const confirmDelete = () => {
    Alert.alert('요리 기록 삭제', `${item.dishName} 기록을 삭제할까요?\n사진과 평가도 함께 지워지고 되돌릴 수 없어요.`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: remove },
    ]);
  };

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

      <ScrollView contentContainerStyle={styles.detail}>
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

        {photo ? (
          <View style={styles.share}>
            <ShareButton photo={photo} dishName={item.dishName} />
          </View>
        ) : null}

        {item.evaluation ? (
          <View style={styles.evaluation}>
            <EvaluationCard evaluation={item.evaluation} />
          </View>
        ) : null}

        {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={confirmDelete}
          disabled={deleting}
          style={({ pressed }) => [styles.deleteButton, (pressed || deleting) && styles.pressed]}
        >
          {deleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={styles.deleteText}>삭제</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// 닉네임 변경 화면: 새 닉네임을 입력하고 저장하면 마이페이지로 돌아갑니다.
function NicknameEdit({ user, onBack }) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const current = useNickname(user);
  const [name, setName] = useState(user.displayName ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const problem = checkNickname(name);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await saveNickname(user, name);
      onBack();
    } catch (e) {
      console.warn('닉네임 변경 오류', e);
      setError('닉네임을 바꾸지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="마이페이지로"
          onPress={onBack}
          disabled={saving}
          hitSlop={12}
          style={styles.side}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.email} numberOfLines={1}>
          닉네임 변경
        </Text>
        <View style={styles.side} />
      </View>

      <KeyboardAvoidingView
        style={styles.editBody}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.detailLabel}>지금 닉네임</Text>
        <Text style={styles.editCurrent}>{current}</Text>

        <Text style={[styles.detailLabel, styles.editLabel]}>새 닉네임</Text>
        <TextInput
          style={styles.editInput}
          placeholder={`닉네임 (${NICKNAME_MAX}자 이하)`}
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          maxLength={NICKNAME_MAX}
          autoFocus
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={save}
          editable={!saving}
        />
        <Text style={styles.editCount}>
          {name.trim().length}/{NICKNAME_MAX}
        </Text>
        {error ? <Text style={styles.deleteError}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}
        >
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>저장</Text>}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 칭호 배지를 누르면 보이는 안내 화면: 모든 칭호와 얻는 조건, 지금 칭호 강조
function TitleInfo({ dishes, onBack }) {
  const styles = useThemedStyles(createStyles);
  const currentIndex = getCookingTitleIndex(dishes);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="마이페이지로"
          onPress={onBack}
          hitSlop={12}
          style={styles.side}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.email} numberOfLines={1}>
          칭호 안내
        </Text>
        <View style={styles.side} />
      </View>

      <ScrollView contentContainerStyle={styles.titleList}>
        <Text style={styles.titleIntro}>
          요리를 만들고 단계를 열수록 칭호가 올라가요! 처음 받은 요리 실력 확인 점수로도 칭호를 바로 받을 수 있어요.
        </Text>
        {TITLES.map((title, index) => {
          const isCurrent = index === currentIndex;
          const earned = index <= currentIndex;
          return (
            <View
              key={title.name}
              style={[styles.titleCard, isCurrent && styles.titleCardCurrent, !earned && styles.titleCardLocked]}
            >
              <Text style={styles.titleEmoji}>{earned ? title.emoji : '🔒'}</Text>
              <View style={styles.titleTexts}>
                <View style={styles.titleNameRow}>
                  <Text style={styles.titleName}>{title.name}</Text>
                  {isCurrent ? (
                    <View style={styles.currentTag}>
                      <Text style={styles.currentTagText}>지금 칭호</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.titleCondition}>
                  {title.scoreCondition ? `${title.condition}\n${title.scoreCondition}` : title.condition}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// 마이페이지: 위에는 프로필 사진·이메일·칭호·요리 시작 N일차, 아래에는 지금까지 만든 요리 목록.
export default function MyPageScreen({ user, onBack }) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const [dishes, setDishes] = useState(null); // null이면 불러오는 중
  const [error, setError] = useState('');
  const [openedItem, setOpenedItem] = useState(null); // 상세 화면으로 연 요리 기록
  const [showTitles, setShowTitles] = useState(false); // 칭호 안내 화면을 열었는지
  const [editingNickname, setEditingNickname] = useState(false); // 닉네임 변경 화면을 열었는지

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

  if (editingNickname) {
    return <NicknameEdit user={user} onBack={() => setEditingNickname(false)} />;
  }

  if (showTitles) {
    return <TitleInfo dishes={dishes ?? []} onBack={() => setShowTitles(false)} />;
  }

  if (openedItem) {
    return (
      <CookedDishDetail
        item={openedItem}
        onBack={() => setOpenedItem(null)}
        onDeleted={(id) => {
          setDishes((list) => (list ?? []).filter((d) => d.id !== id));
          setOpenedItem(null);
        }}
      />
    );
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
          마이페이지
        </Text>
        <View style={styles.side} />
      </View>

      {dishes === null ? (
        <>
          <ProfileHeader
            user={user}
            dishes={dishes}
            onOpenTitles={() => setShowTitles(true)}
            onEditNickname={() => setEditingNickname(true)}
          />
          <ActivityIndicator style={styles.loading} size="large" color={colors.orange} />
        </>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <ProfileHeader
                user={user}
                dishes={dishes}
                onOpenTitles={() => setShowTitles(true)}
                onEditNickname={() => setEditingNickname(true)}
              />
              <Text style={styles.sectionTitle}>내가 만든 요리 {dishes.length}개</Text>
            </>
          }
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
                {item.evaluation ? `  ★${item.evaluation.score}` : ''}
              </Text>
              <Text style={styles.date}>{formatDate(item.completedAt)}  ›</Text>
            </Pressable>
          )}
        />
      )}
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
  profile: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  nickname: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  profileEmail: {
    marginTop: -6,
    fontSize: 15,
    color: colors.textMuted,
  },
  titleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.orange,
  },
  titleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onOrange,
  },
  nicknameButton: {
    marginTop: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: colors.surface,
  },
  nicknameButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
  },
  editBody: {
    paddingHorizontal: 24,
    gap: 6,
  },
  editCurrent: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  editLabel: {
    marginTop: 18,
  },
  editInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  editCount: {
    alignSelf: 'flex-end',
    fontSize: 13,
    color: colors.textMuted,
  },
  saveButton: {
    marginTop: 18,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onOrange,
  },
  titleList: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  titleIntro: {
    marginBottom: 6,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleCardCurrent: {
    borderWidth: 2,
    borderColor: colors.orange,
    backgroundColor: colors.orangeTint,
  },
  titleCardLocked: {
    opacity: 0.6,
  },
  titleEmoji: {
    fontSize: 32,
  },
  titleTexts: {
    flex: 1,
    gap: 4,
  },
  titleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  currentTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.orange,
  },
  currentTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onOrange,
  },
  titleCondition: {
    fontSize: 14,
    color: colors.textMuted,
  },
  cookingDay: {
    fontSize: 15,
    color: colors.textMuted,
  },
  cookingDayNumber: {
    fontWeight: '800',
    color: colors.orange,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 2,
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
    backgroundColor: colors.surface,
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
    paddingBottom: 32,
    gap: 6,
  },
  evaluation: {
    marginTop: 18,
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
  share: {
    marginTop: 14,
  },
  photoBox: {
    marginTop: 18,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: colors.surface,
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
  deleteButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  deleteText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.error,
  },
  deleteError: {
    marginTop: 16,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
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
