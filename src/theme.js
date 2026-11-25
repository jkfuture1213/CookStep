// 앱 색상과 다크 모드 설정입니다.
// 화면에서는 useThemedStyles(createStyles)로 지금 모드에 맞는 스타일을, useColors()로 색을 받아 씁니다.
// 모드: 'system'(기기 설정 따르기, 기본) · 'light' · 'dark'. 마이페이지에서 바꿀 수 있고, 기기에 저장됩니다.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const lightColors = {
  orange: '#F26B3A',
  background: '#FFF8F2',
  surface: '#FFFFFF', // 카드·버튼 바탕
  text: '#2B2B2B',
  textMuted: '#7A6F68',
  placeholder: '#B5AAA2',
  border: '#EADFD6',
  error: '#D93025',
  onOrange: '#FFFFFF', // 주황 바탕 위 글자·표시
  orangeSoft: '#FDE3D7', // 연한 주황 배지
  orangeTint: '#FFF0E8', // 선택된 카드 바탕
  orangeDisabled: '#F5B9A2', // 눌리지 않는 주황 버튼
  disabledBg: '#EFE7E1',
  disabledText: '#A99D95',
  disabledBadge: '#E2D8D1',
  shadow: '#7A4A30',
};

export const darkColors = {
  orange: '#F57A4C',
  background: '#181412',
  surface: '#26201D',
  text: '#F3ECE6',
  textMuted: '#B5A9A1',
  placeholder: '#7D716A',
  border: '#3D3430',
  error: '#FF6B5E',
  onOrange: '#FFFFFF',
  orangeSoft: '#4A2C20',
  orangeTint: '#3A251C',
  orangeDisabled: '#6E3F2D',
  disabledBg: '#2F2926',
  disabledText: '#7D716A',
  disabledBadge: '#3A3330',
  shadow: '#000000',
};

// 예전 코드(축하 화면 등)가 쓰는 고정 색. 주황 위주라 두 모드에서 똑같이 보입니다.
export const colors = lightColors;

const STORAGE_KEY = 'cookstep.themeMode';
export const THEME_MODES = [
  { value: 'system', label: '기기 설정' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

const ThemeContext = createContext({
  mode: 'system',
  setMode: () => {},
  scheme: 'light',
  colors: lightColors,
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState('system');

  // 저장해 둔 모드를 불러옵니다. 못 읽으면 기기 설정을 따릅니다.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      })
      .catch((e) => console.warn('화면 모드 불러오기 오류', e));
  }, []);

  const value = useMemo(() => {
    const scheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
    return {
      mode,
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      setMode: (next) => {
        setModeState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch((e) => console.warn('화면 모드 저장 오류', e));
      },
    };
  }, [mode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// { mode, setMode, scheme: 'light' | 'dark', colors }
export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}

// createStyles: (colors) => StyleSheet.create({...}). 모드가 바뀔 때만 스타일을 새로 만듭니다.
export function useThemedStyles(createStyles) {
  const { colors: current } = useContext(ThemeContext);
  return useMemo(() => createStyles(current), [createStyles, current]);
}
