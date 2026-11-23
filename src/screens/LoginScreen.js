import { signInWithEmailAndPassword } from 'firebase/auth';

import AuthForm from '../components/AuthForm';
import { auth } from '../firebase';

export default function LoginScreen({ onGoToSignUp }) {
  return (
    <AuthForm
      mode="login"
      subtitle="이메일로 로그인하세요"
      submitLabel="로그인"
      onSubmit={(email, password) => signInWithEmailAndPassword(auth, email, password)}
      switchLabel="회원가입"
      onSwitch={onGoToSignUp}
    />
  );
}
