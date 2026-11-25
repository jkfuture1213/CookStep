import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { evaluateFreePhoto, getEvaluationErrorDetail, getEvaluationErrorMessage } from '../aiEvaluation';
import { getSaveErrorMessage, saveFreeEvaluation } from '../cookingHistory';
import { useColors, useThemedStyles } from '../theme';
import { cropToSquare } from './PhotoScreen';

// AI 평가 탭의 '사진 찍기'로 여는 화면입니다. 레시피 없이 아무 요리 사진이나 평가받을 수 있습니다.
// 1) 사진 찍기 / 사진 가져오기 고르기 → 2) 요리 이름 적기(선택, 비우면 AI가 알아봄) → 3) AI 평가 → 4) 결과 저장
// onDone: 끝나거나 나가면 AI 평가 탭으로 돌아갑니다.
export default function FreeEvalScreen({ onDone }) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const [photo, setPhoto] = useState(null); // { uri, base64 }
  const [dishName, setDishName] = useState('');
  const [busy, setBusy] = useState(''); // '' | 'picking' | 'evaluating' | 'saving'
  const [result, setResult] = useState(null); // { dishName, evaluation }
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState('');

  async function pick(fromCamera) {
    setError('');
    setErrorDetail('');
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(
          fromCamera
            ? '카메라 권한이 없어요. 설정에서 카메라 접근을 허용해 주세요.'
            : '사진 보관함 권한이 없어요. 설정에서 사진 접근을 허용해 주세요.'
        );
        return;
      }
      const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
      const picked = fromCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (picked.canceled || !picked.assets?.length) {
        return;
      }
      setBusy('picking');
      const asset = picked.assets[0];
      setPhoto(await cropToSquare({ uri: asset.uri, width: asset.width, height: asset.height }));
    } catch (e) {
      console.warn('사진 가져오기 오류', e);
      setError('사진을 가져오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy('');
    }
  }

  async function save(nextResult) {
    setBusy('saving');
    setError('');
    try {
      await saveFreeEvaluation(nextResult.dishName, nextResult.evaluation, photo.base64);
      setSaved(true);
    } catch (e) {
      console.warn('사진 평가 저장 오류', e);
      setError(getSaveErrorMessage(e));
    } finally {
      setBusy('');
    }
  }

  async function handleEvaluate() {
    setBusy('evaluating');
    setError('');
    setErrorDetail('');
    let nextResult;
    try {
      nextResult = await evaluateFreePhoto(photo.base64, dishName);
    } catch (e) {
      console.warn('사진 AI 평가 오류', e);
      setError(getEvaluationErrorMessage(e));
      setErrorDetail(getEvaluationErrorDetail(e));
      setBusy('');
      return;
    }
    setResult(nextResult);
    // 평가를 받으면 바로 저장합니다.
    await save(nextResult);
  }

  function reset() {
    setPhoto(null);
    setDishName('');
    setResult(null);
    setSaved(false);
    setError('');
    setErrorDetail('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" onPress={onDone} hitSlop={8} disabled={Boolean(busy)}>
          <Text style={styles.back}>‹ AI 평가</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{result ? result.dishName : '사진으로 평가받기'}</Text>
          <Text style={styles.subtitle}>
            {result
              ? saved
                ? 'AI 평가 탭에 저장했어요.'
                : 'AI 평가 결과예요.'
              : '직접 만든 요리 사진을 AI가 평가해 줘요.'}
          </Text>

          {/* 1) 사진 고르기 */}
          {!photo ? (
            <View style={styles.choices}>
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(busy)}
                onPress={() => pick(true)}
                style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
              >
                <Text style={styles.choiceEmoji}>📷</Text>
                <Text style={styles.choiceLabel}>사진 찍기</Text>
                <Text style={styles.choiceText}>카메라로 지금 바로 찍어요</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(busy)}
                onPress={() => pick(false)}
                style={({ pressed }) => [styles.choice, pressed && styles.pressed]}
              >
                <Text style={styles.choiceEmoji}>🖼️</Text>
                <Text style={styles.choiceLabel}>사진 가져오기</Text>
                <Text style={styles.choiceText}>앨범에 있는 사진을 골라요</Text>
              </Pressable>
              {busy === 'picking' ? <ActivityIndicator color={colors.orange} /> : null}
            </View>
          ) : (
            <Image source={{ uri: photo.uri }} style={styles.photo} />
          )}

          {/* 2) 요리 이름 + 평가 받기 */}
          {photo && !result ? (
            <View style={styles.form}>
              <Text style={styles.inputLabel}>어떤 요리인가요? (선택)</Text>
              <TextInput
                value={dishName}
                onChangeText={setDishName}
                placeholder="비워 두면 AI가 알아서 알아봐요"
                placeholderTextColor={colors.placeholder}
                maxLength={30}
                editable={!busy}
                style={styles.input}
                returnKeyType="done"
              />
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(busy)}
                onPress={handleEvaluate}
                style={({ pressed }) => [styles.primary, busy && styles.primaryBusy, pressed && styles.pressed]}
              >
                {busy === 'evaluating' ? (
                  <ActivityIndicator color={colors.onOrange} />
                ) : (
                  <Text style={styles.primaryText}>AI 평가 받기</Text>
                )}
              </Pressable>
              <Pressable accessibilityRole="button" disabled={Boolean(busy)} onPress={reset} hitSlop={8}>
                <Text style={styles.link}>다른 사진 고르기</Text>
              </Pressable>
            </View>
          ) : null}

          {/* 3) 결과 */}
          {result ? (
            <View style={styles.form}>
              <EvaluationCard evaluation={result.evaluation} />
              {!saved ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={Boolean(busy)}
                  onPress={() => save(result)}
                  style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
                >
                  {busy === 'saving' ? (
                    <ActivityIndicator color={colors.orange} />
                  ) : (
                    <Text style={styles.secondaryText}>다시 저장하기</Text>
                  )}
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(busy)}
                onPress={onDone}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>완료</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={Boolean(busy)} onPress={reset} hitSlop={8}>
                <Text style={styles.link}>다른 사진도 평가받기</Text>
              </Pressable>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {errorDetail ? <Text style={styles.errorDetail}>{errorDetail}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
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
    content: {
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    title: {
      marginTop: 16,
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      marginTop: 6,
      marginBottom: 20,
      fontSize: 15,
      color: colors.textMuted,
    },
    choices: {
      gap: 14,
    },
    choice: {
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.orange,
      backgroundColor: colors.surface,
      paddingVertical: 22,
      alignItems: 'center',
      gap: 4,
    },
    choiceEmoji: {
      fontSize: 40,
      lineHeight: 48,
    },
    choiceLabel: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.orange,
    },
    choiceText: {
      fontSize: 14,
      color: colors.textMuted,
    },
    photo: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 20,
      backgroundColor: colors.disabledBg,
    },
    form: {
      marginTop: 20,
      gap: 12,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    input: {
      height: 50,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
    },
    primary: {
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.orange,
    },
    primaryBusy: {
      backgroundColor: colors.orangeDisabled,
    },
    primaryText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.onOrange,
    },
    secondary: {
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.orange,
      backgroundColor: colors.surface,
    },
    secondaryText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.orange,
    },
    link: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: colors.textMuted,
      paddingVertical: 6,
    },
    error: {
      marginTop: 16,
      fontSize: 14,
      lineHeight: 20,
      color: colors.error,
      textAlign: 'center',
    },
    errorDetail: {
      marginTop: 4,
      fontSize: 11,
      color: colors.placeholder,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.75,
    },
  });
