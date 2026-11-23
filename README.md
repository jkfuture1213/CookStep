# CookStep

1인 가구를 위한 단계별 요리 학습 앱 (Expo SDK 58, 관리형 워크플로)

## Expo Go로 실행하기

1. 휴대폰에 **Expo Go** 앱을 설치합니다 (App Store / Google Play).
2. 컴퓨터에 Node.js(LTS)를 설치한 뒤, 이 폴더에서:
   ```bash
   npm install
   npx expo start
   ```
3. 터미널에 나온 QR 코드를 스캔합니다.
   - iPhone: 기본 카메라 앱으로 스캔
   - Android: Expo Go 앱의 "Scan QR code"로 스캔
4. 휴대폰과 컴퓨터가 같은 Wi‑Fi에 있어야 합니다. 연결이 안 되면 `npx expo start --tunnel`을 사용하세요.

## 구조

- `App.js` : 앱 진입점, 로그인 화면을 보여줌
- `src/screens/LoginScreen.js` : 로그인 화면 (제목, 로그인 버튼, 회원가입 버튼)
  - 버튼 동작은 아직 비어 있음 (`handleLogin`, `handleSignUp`)
