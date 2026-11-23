import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { auth } from './src/firebase';
import { colors } from './src/theme';
import CookingScreen from './src/screens/CookingScreen';
import { MyPageContext } from './src/components/UserMenu';
import DishScreen from './src/screens/DishScreen';
import HomeScreen from './src/screens/HomeScreen';
import IngredientScreen from './src/screens/IngredientScreen';
import LoginScreen from './src/screens/LoginScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import SignUpScreen from './src/screens/SignUpScreen';

export default function App() {
  // undefined: 아직 확인 중, null: 로그아웃 상태, 객체: 로그인한 사용자
  const [user, setUser] = useState(auth ? undefined : null);
  const [screen, setScreen] = useState('login');
  // 재료 선택 화면에서 고른 재료 id 목록 (예: ['egg', 'tuna'])
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  // 음식 선택 화면에서 고른 요리 id (예: 'boiled-egg')
  const [selectedDishId, setSelectedDishId] = useState(null);
  // 마이페이지에서 뒤로 가면 돌아갈 화면
  const [screenBeforeMyPage, setScreenBeforeMyPage] = useState('ingredients');
  // 방금 완료한 요리 기록 (사진 화면에서 사용) 예: { id: 'abc', dishName: '삶은 계란' }
  const [justCooked, setJustCooked] = useState(null);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }
    // 로그인/로그아웃/회원가입이 일어날 때마다 Firebase가 알려 줍니다.
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // 로그인하면 환영 화면부터, 로그아웃하면 로그인 화면부터 시작합니다.
      setScreen(currentUser ? 'welcome' : 'login');
    });
  }, []);

  // 환영 화면에 2초 동안 머물러 있을 때만 재료 선택으로 넘어갑니다.
  // (그 사이 마이페이지를 열었다면 그대로 둡니다.)
  const goToIngredients = useCallback(
    () => setScreen((current) => (current === 'welcome' ? 'ingredients' : current)),
    []
  );

  const openMyPage = useCallback(() => {
    // 환영 화면에서 열었다면 돌아올 때는 재료 선택 화면으로 갑니다.
    setScreenBeforeMyPage(screen === 'welcome' ? 'ingredients' : screen);
    setScreen('mypage');
  }, [screen]);

  function handleIngredientsNext(selectedIds) {
    setSelectedIngredients(selectedIds);
    setScreen('dishes');
  }

  function handleSelectDish(dish) {
    setSelectedDishId(dish.id);
    setScreen('cooking');
  }

  let content;
  if (user === undefined) {
    content = (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  } else if (user && screen === 'mypage') {
    content = <MyPageScreen user={user} onBack={() => setScreen(screenBeforeMyPage)} />;
  } else if (user && screen === 'cooking') {
    // 나가기(✕)를 누르면 음식 선택 화면으로, 완료하면 사진 찍기 화면으로 갑니다.
    content = (
      <CookingScreen
        dishId={selectedDishId}
        onExit={() => setScreen('dishes')}
        onFinish={(cookedId, dishName) => {
          setJustCooked({ id: cookedId, dishName });
          setScreen('photo');
        }}
      />
    );
  } else if (user && screen === 'photo') {
    // 사진을 저장하거나 건너뛰면 음식 선택 화면으로 돌아갑니다.
    content = (
      <PhotoScreen
        cookedId={justCooked?.id}
        dishName={justCooked?.dishName}
        onDone={() => setScreen('dishes')}
      />
    );
  } else if (user && screen === 'dishes') {
    content = (
      <DishScreen
        selectedIds={selectedIngredients}
        onBack={() => setScreen('ingredients')}
        onSelectDish={handleSelectDish}
      />
    );
  } else if (user && screen === 'ingredients') {
    content = (
      <IngredientScreen initialSelected={selectedIngredients} onNext={handleIngredientsNext} />
    );
  } else if (user) {
    content = <HomeScreen user={user} onDone={goToIngredients} />;
  } else if (screen === 'signup') {
    content = <SignUpScreen onGoToLogin={() => setScreen('login')} />;
  } else {
    content = <LoginScreen onGoToSignUp={() => setScreen('signup')} />;
  }

  return (
    <SafeAreaProvider>
      <MyPageContext.Provider value={openMyPage}>{content}</MyPageContext.Provider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
