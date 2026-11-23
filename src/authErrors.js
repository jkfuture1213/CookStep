// Firebase 오류 코드를 사용자에게 보여 줄 한국어 문장으로 바꿉니다.
const MESSAGES = {
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다.',
  'auth/missing-email': '이메일을 입력해 주세요.',
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
  'auth/email-already-in-use': '이미 가입된 이메일입니다. 로그인해 주세요.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않습니다.',
  'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않습니다.',
  'auth/user-not-found': '이메일 또는 비밀번호가 맞지 않습니다.',
  'auth/user-disabled': '사용이 중지된 계정입니다.',
  'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  'auth/network-request-failed': '인터넷 연결을 확인해 주세요.',
  'auth/operation-not-allowed':
    'Firebase 콘솔에서 이메일/비밀번호 로그인이 아직 켜져 있지 않습니다.',
  'auth/invalid-api-key': 'Firebase 설정값(apiKey)이 올바르지 않습니다.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
    'Firebase 설정값(apiKey)이 올바르지 않습니다.',
};

export function getAuthErrorMessage(error) {
  return MESSAGES[error?.code] ?? '문제가 생겼습니다. 잠시 후 다시 시도해 주세요.';
}
