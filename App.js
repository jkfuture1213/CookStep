import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { auth } from './src/firebase';
import { setStartLevel } from './src/progress';
import {
  getSkillResult,
  loadSkillCheckAnswers,
  saveSkillCheck,
  setCurrentSkillResult,
} from './src/skillCheck';
import { ThemeProvider, useColors, useTheme, useThemedStyles } from './src/theme';
import CookingScreen from './src/screens/CookingScreen';
import ScreenTransition from './src/components/ScreenTransition';
import UserMenu, { TABS } from './src/components/UserMenu';
import DishScreen from './src/screens/DishScreen';
import EvaluationScreen from './src/screens/EvaluationScreen';
import GoalScreen from './src/screens/GoalScreen';
import HomeScreen from './src/screens/HomeScreen';
import IngredientScreen from './src/screens/IngredientScreen';
import LearnTypeScreen from './src/screens/LearnTypeScreen';
import LoginScreen from './src/screens/LoginScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import PhotoScreen from './src/screens/PhotoScreen';
import RecipePickScreen from './src/screens/RecipePickScreen';
import SkillScreen from './src/screens/SkillScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import AiEvalScreen from './src/screens/AiEvalScreen';
import FreeEvalScreen from './src/screens/FreeEvalScreen';
import SkillCheckScreen from './src/screens/SkillCheckScreen';

// 실력 확인 결과를 앱 전체에 알립니다: 처음부터 열어 둘 단계 수와 추천 표시
function applySkillResult(result) {
  setCurrentSkillResult(result);
  setStartLevel(result?.startLevel ?? 1);
}

// 하단 탭 화면들(커뮤니티 · AI 평가 · 설정 · 마이페이지)
const TAB_SCREENS = new Set(TABS.map((tab) => tab.key));

// 아래쪽 탭 바를 보여 주는 화면들: 아래 목록 + 탭 화면들
const MENU_SCREENS = new Set([
  ...TAB_SCREENS,
  'welcome',
  'skillCheck',
  'goal',
  'learnType',
  'skills',
  'ingredients',
  'dishes',
  'recipes',
]);

// 다크 모드 설정(ThemeProvider)으로 앱 전체를 감쌉니다.
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { scheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  // undefined: 아직 확인 중, null: 로그아웃 상태, 객체: 로그인한 사용자
  const [user, setUser] = useState(auth ? undefined : null);
  const [screen, setScreen] = useState('login');
  // 재료 선택 화면에서 고른 재료 id 목록 (예: ['egg', 'tuna'])
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  // 음식 선택 화면에서 고른 요리 id (예: 'boiled-egg')
  const [selectedDishId, setSelectedDishId] = useState(null);
  // 탭 화면(커뮤니티·AI 평가·설정·마이페이지)에서 돌아가기를 누르면 돌아갈 화면
  const [screenBeforeTab, setScreenBeforeTab] = useState('goal');
  // 요리를 마치거나 나갈 때 돌아갈 화면: 재료별 배우기 'dishes', 레시피 따라 하기 'recipes', 기초 스킬 'skills'
  const [dishListScreen, setDishListScreen] = useState('dishes');
  // 방금 완료한 요리 기록 (사진·평가 화면에서 사용) 예: { id: 'abc', dishId: 'boiled-egg', dishName: '삶은 계란' }
  const [justCooked, setJustCooked] = useState(null);
  // 방금 찍은 완성 사진 { uri, base64 } (평가 화면에서 사용)
  const [justPhoto, setJustPhoto] = useState(null);
  // 요리 실력 확인(첫 로그인 질문)을 해야 하는지. undefined: 확인 중, true: 아직 안 함, false: 이미 함
  const [needsSkillCheck, setNeedsSkillCheck] = useState(undefined);
  // 환영 화면 2초가 지났는지
  const [welcomeDone, setWelcomeDone] = useState(false);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }
    // 로그인/로그아웃/회원가입이 일어날 때마다 Firebase가 알려 줍니다.
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // 로그인하면 환영 화면부터, 로그아웃하면 로그인 화면부터 시작합니다.
      setScreen(currentUser ? 'welcome' : 'login');
      setWelcomeDone(false);
      setNeedsSkillCheck(undefined);
      applySkillResult(null);
      if (currentUser) {
        // 실력 확인 기록이 없으면(처음 로그인) 환영 화면 다음에 질문 화면을 보여 줍니다.
        // 기록이 있으면 그 결과로 시작 단계와 추천을 정합니다.
        // 기록을 못 읽으면 앱 사용을 막지 않도록 질문을 건너뜁니다(1단계부터).
        loadSkillCheckAnswers()
          .then((answers) => {
            if (answers) {
              applySkillResult(getSkillResult(answers));
            }
            setNeedsSkillCheck(!answers);
          })
          .catch((e) => {
            console.warn('실력 확인 기록 불러오기 오류', e);
            setNeedsSkillCheck(false);
          });
      }
    });
  }, []);

  // 환영 화면 2초가 지나면, 처음 로그인이면 요리 실력 확인 화면으로, 아니면 "오늘은 무엇을 하고 싶나요?" 화면으로 갑니다.
  // (그 사이 마이페이지를 열었다면 그대로 둡니다. 실력 확인 기록을 아직 읽는 중이면 다 읽을 때까지 기다립니다.)
  const finishWelcome = useCallback(() => setWelcomeDone(true), []);
  useEffect(() => {
    if (screen === 'welcome' && welcomeDone && needsSkillCheck !== undefined) {
      setScreen(needsSkillCheck ? 'skillCheck' : 'goal');
    }
  }, [screen, welcomeDone, needsSkillCheck]);

  function handleSkillCheckDone(answers) {
    applySkillResult(getSkillResult(answers));
    setNeedsSkillCheck(false);
    setScreen('goal');
    // 저장에 실패하면 다음 로그인 때 질문을 다시 보여 줍니다.
    saveSkillCheck(answers).catch((e) => console.warn('실력 확인 저장 오류', e));
  }

  // 하단 탭을 고르면 그 화면으로 갑니다. 탭 화면끼리 옮길 때는 처음 떠나온 화면을 그대로 기억합니다.
  // 환영 화면에서 열었다면 돌아올 때는 실력 확인 화면(처음 로그인) 또는 "오늘은 무엇을 하고 싶나요?" 화면으로 갑니다.
  const openTab = useCallback(
    (key) => {
      // '학습' 탭(goal)은 앱의 시작 화면이기도 해서, 여기서 다른 탭을 열면 돌아올 곳으로 기억합니다.
      if (!TAB_SCREENS.has(screen) || screen === 'goal') {
        setScreenBeforeTab(screen === 'welcome' ? (needsSkillCheck ? 'skillCheck' : 'goal') : screen);
      }
      setScreen(key);
    },
    [screen, needsSkillCheck]
  );
  const closeTab = () => setScreen(screenBeforeTab);

  function handleIngredientsNext(selectedIds) {
    setSelectedIngredients(selectedIds);
    setScreen('dishes');
  }

  function handleSelectDish(dish) {
    setSelectedDishId(dish.id);
    setDishListScreen('dishes');
    setScreen('cooking');
  }

  function handleSelectSkill(skill) {
    setSelectedDishId(skill.id);
    setDishListScreen('skills');
    setScreen('cooking');
  }

  function handleSelectRecipe(dish) {
    setSelectedDishId(dish.id);
    setDishListScreen('recipes');
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
    content = <MyPageScreen user={user} onBack={closeTab} />;
  } else if (user && screen === 'settings') {
    content = <SettingsScreen user={user} onBack={closeTab} />;
  } else if (user && screen === 'community') {
    content = <CommunityScreen onBack={closeTab} />;
  } else if (user && screen === 'aiEval') {
    content = <AiEvalScreen onBack={closeTab} onTakePhoto={() => setScreen('freeEval')} />;
  } else if (user && screen === 'freeEval') {
    // AI 평가 탭의 '사진 찍기': 끝나거나 나가면 AI 평가 탭으로 돌아가 새 평가가 목록에 보입니다.
    content = <FreeEvalScreen onDone={() => setScreen('aiEval')} />;
  } else if (user && screen === 'cooking') {
    // 나가기(✕)를 누르면 들어온 목록 화면(음식 선택 또는 레시피 선택)으로, 완료하면 사진 찍기 화면으로 갑니다.
    content = (
      <CookingScreen
        dishId={selectedDishId}
        onExit={() => setScreen(dishListScreen)}
        onFinish={(cookedId, dishName) => {
          setJustCooked({ id: cookedId, dishId: selectedDishId, dishName });
          setScreen('photo');
        }}
      />
    );
  } else if (user && screen === 'photo') {
    // 사진만 저장하거나 건너뛰면 음식 선택 화면으로, 음식 평가를 누르면 평가 화면으로 갑니다.
    content = (
      <PhotoScreen
        cookedId={justCooked?.id}
        dishName={justCooked?.dishName}
        onDone={() => setScreen(dishListScreen)}
        onEvaluate={(photo) => {
          setJustPhoto(photo);
          setScreen('evaluation');
        }}
      />
    );
  } else if (user && screen === 'evaluation') {
    // AI 평가를 보고 완료를 누르면 음식 선택 화면으로 돌아갑니다.
    content = (
      <EvaluationScreen
        cookedId={justCooked?.id}
        dishId={justCooked?.dishId}
        dishName={justCooked?.dishName}
        photo={justPhoto}
        onDone={() => setScreen(dishListScreen)}
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
  } else if (user && screen === 'recipes') {
    content = (
      <RecipePickScreen onBack={() => setScreen('goal')} onSelectDish={handleSelectRecipe} />
    );
  } else if (user && screen === 'ingredients') {
    content = (
      <IngredientScreen
        initialSelected={selectedIngredients}
        onBack={() => setScreen('learnType')}
        onNext={handleIngredientsNext}
      />
    );
  } else if (user && screen === 'skills') {
    content = <SkillScreen onBack={() => setScreen('learnType')} onSelectSkill={handleSelectSkill} />;
  } else if (user && screen === 'learnType') {
    content = (
      <LearnTypeScreen
        onBack={() => setScreen('goal')}
        onBasicSkills={() => setScreen('skills')}
        onIngredientDishes={() => setScreen('ingredients')}
      />
    );
  } else if (user && screen === 'skillCheck') {
    content = <SkillCheckScreen onDone={handleSkillCheckDone} />;
  } else if (user && screen === 'goal') {
    content = (
      <GoalScreen
        onLearn={() => setScreen('learnType')}
        onFollowRecipe={() => setScreen('recipes')}
      />
    );
  } else if (user) {
    content = <HomeScreen user={user} onDone={finishWelcome} />;
  } else if (screen === 'signup') {
    content = <SignUpScreen onGoToLogin={() => setScreen('login')} />;
  } else {
    content = <LoginScreen onGoToSignUp={() => setScreen('signup')} />;
  }

  // 화면이 바뀔 때마다 key가 달라져 ScreenTransition의 등장 애니메이션이 다시 실행됩니다.
  let screenKey;
  if (user === undefined) {
    screenKey = 'loading';
  } else if (user) {
    screenKey = screen;
  } else {
    screenKey = screen === 'signup' ? 'signup' : 'login';
  }

  return (
    // 화면이 서서히 나타나는 동안 뒤에 비치는 바탕도 앱 배경색으로 맞춥니다.
    <SafeAreaProvider style={styles.root}>
      <ScreenTransition key={screenKey}>{content}</ScreenTransition>
      {user && MENU_SCREENS.has(screenKey) ? (
        <UserMenu
          user={user}
          activeTab={TAB_SCREENS.has(screenKey) ? screenKey : null}
          onSelectTab={openTab}
        />
      ) : null}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
