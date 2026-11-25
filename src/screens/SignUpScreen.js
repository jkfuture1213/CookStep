import { createUserWithEmailAndPassword } from 'firebase/auth';

import AuthForm from '../components/AuthForm';
import { auth } from '../firebase';
import { saveNickname } from '../nickname';

// 가입하면서 받은 닉네임은 Firebase 계정의 displayName에 저장합니다(마이페이지에 표시).
async function signUp(email, password, nickname) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await saveNickname(user, nickname);
  } catch (e) {
    // 닉네임 저장만 실패해도 가입은 된 상태라 계속 진행합니다(마이페이지에는 이메일 앞부분이 보임).
    console.warn('닉네임 저장 오류', e);
  }
}

export default function SignUpScreen({ onGoToLogin }) {
  return (
    <AuthForm
      mode="signup"
      subtitle="새 계정을 만드세요"
      submitLabel="가입하기"
      onSubmit={signUp}
      switchLabel="이미 계정이 있어요 (로그인)"
      onSwitch={onGoToLogin}
    />
  );
}
