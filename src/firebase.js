import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Platform } from 'react-native';

import { firebaseConfig } from './config/firebaseConfig';

// 설정값을 아직 넣지 않았으면 Firebase를 시작하지 않고, 화면에 안내를 보여 줍니다.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId);

function createAuth() {
  if (!isFirebaseConfigured) {
    return null;
  }

  // 앱을 새로 고칠 때 두 번 초기화되지 않도록 이미 만든 앱이 있으면 재사용합니다.
  if (getApps().length > 0) {
    return getAuth(getApp());
  }

  const app = initializeApp(firebaseConfig);

  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  // 휴대폰에서는 로그인 상태를 기기에 저장해서 앱을 껐다 켜도 로그인이 유지되게 합니다.
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth = createAuth();
