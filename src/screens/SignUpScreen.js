import { createUserWithEmailAndPassword } from 'firebase/auth';

import AuthForm from '../components/AuthForm';
import { auth } from '../firebase';

export default function SignUpScreen({ onGoToLogin }) {
  return (
    <AuthForm
      mode="signup"
      subtitle="새 계정을 만드세요"
      submitLabel="가입하기"
      onSubmit={(email, password) => createUserWithEmailAndPassword(auth, email, password)}
      switchLabel="이미 계정이 있어요 (로그인)"
      onSwitch={onGoToLogin}
    />
  );
}
