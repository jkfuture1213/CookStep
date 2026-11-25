// 닉네임은 Firebase 계정 정보(displayName)에 저장합니다.
// 바꾸면 환영 화면·마이페이지가 바로 새 닉네임을 보여 주도록 알려 줍니다.
import { updateProfile } from 'firebase/auth';
import { useEffect, useState } from 'react';

export const NICKNAME_MAX = 12;

const listeners = new Set();

// 닉네임이 없는(닉네임 기능 전에 가입한) 계정은 이메일 @ 앞부분을 보여 줍니다.
export function getNickname(user) {
  return user?.displayName?.trim() || user?.email?.split('@')[0] || '자취생';
}

// 입력한 닉네임이 괜찮은지 봅니다. 문제가 있으면 오류 문구, 없으면 ''.
export function checkNickname(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return '닉네임을 입력해 주세요.';
  }
  if (trimmed.length > NICKNAME_MAX) {
    return `닉네임은 ${NICKNAME_MAX}자 이하로 정해 주세요.`;
  }
  return '';
}

export async function saveNickname(user, name) {
  await updateProfile(user, { displayName: name.trim() });
  listeners.forEach((listener) => listener());
}

// 화면에서 쓰는 닉네임. 저장되면 자동으로 새 값으로 바뀝니다.
export function useNickname(user) {
  const [nickname, setNickname] = useState(() => getNickname(user));
  useEffect(() => {
    const update = () => setNickname(getNickname(user));
    update();
    listeners.add(update);
    return () => listeners.delete(update);
  }, [user]);
  return nickname;
}
