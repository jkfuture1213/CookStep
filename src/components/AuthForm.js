import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isFirebaseConfigured } from '../firebase';
import { getAuthErrorMessage } from '../authErrors';
import { checkNickname, NICKNAME_MAX } from '../nickname';
import { colors } from '../theme';

// 로그인 화면과 회원가입 화면이 함께 쓰는 입력 양식입니다.
// mode가 'signup'이면 닉네임 칸과 비밀번호 확인 칸이 더 나오고, onSubmit(이메일, 비밀번호, 닉네임)을 부릅니다.
export default function AuthForm({
  mode,
  subtitle,
  submitLabel,
  onSubmit,
  switchLabel,
  onSwitch,
}) {
  const isSignUp = mode === 'signup';
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');

    if (!isFirebaseConfigured) {
      setError('src/config/firebaseConfig.js에 Firebase 설정값을 먼저 넣어 주세요.');
      return;
    }
    const nicknameError = isSignUp ? checkNickname(nickname) : '';
    if (nicknameError) {
      setError(nicknameError);
      return;
    }
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    if (isSignUp && password !== passwordConfirm) {
      setError('비밀번호가 서로 다릅니다.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(email.trim(), password, nickname.trim());
      // 성공하면 App.js가 로그인 상태 변화를 감지해서 홈 화면으로 바꿉니다.
    } catch (e) {
      setError(getAuthErrorMessage(e));
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>CookStep</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.form}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder={`닉네임 (${NICKNAME_MAX}자 이하)`}
              placeholderTextColor={colors.placeholder}
              value={nickname}
              onChangeText={setNickname}
              maxLength={NICKNAME_MAX}
              autoCapitalize="none"
              textContentType="nickname"
              editable={!loading}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder={isSignUp ? '비밀번호 (6자 이상)' : '비밀번호'}
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            textContentType={isSignUp ? 'newPassword' : 'password'}
            editable={!loading}
          />
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="비밀번호 확인"
              placeholderTextColor={colors.placeholder}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              autoCapitalize="none"
              textContentType="newPassword"
              editable={!loading}
            />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.buttonText, styles.primaryText]}>{submitLabel}</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onSwitch}
            disabled={loading}
            style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
          >
            <Text style={[styles.buttonText, styles.secondaryText]}>{switchLabel}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.orange,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  form: {
    gap: 12,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.orange,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  pressed: {
    opacity: 0.75,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.orange,
  },
});
