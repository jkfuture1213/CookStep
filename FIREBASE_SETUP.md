# Firebase 로그인 설정 방법

## 1. Firebase 프로젝트 만들기
1. https://console.firebase.google.com 에 구글 계정으로 로그인합니다.
2. **프로젝트 만들기(또는 "Firebase 프로젝트 시작하기")**를 누르고 이름을 `CookStep`으로 입력합니다.
3. Google 애널리틱스는 꺼도 됩니다. **프로젝트 만들기**를 누르고 완료될 때까지 기다립니다.

## 2. 이메일/비밀번호 로그인 켜기
1. 왼쪽 메뉴 **빌드(Build) > Authentication**을 누르고 **시작하기**를 누릅니다.
2. **로그인 방법(Sign-in method)** 탭에서 **이메일/비밀번호**를 고릅니다.
3. 맨 위 **사용 설정**만 켜고 **저장**합니다. (아래 "이메일 링크"는 꺼 둡니다.)

## 3. 설정값 복사하기
1. 왼쪽 위 톱니바퀴 > **프로젝트 설정**으로 갑니다.
2. 아래 **내 앱** 칸에서 웹 아이콘 **`</>`**를 누릅니다. (Expo Go 앱은 웹 SDK를 쓰므로 iOS/Android 아이콘이 아니라 웹을 고릅니다.)
3. 앱 닉네임에 `CookStep`을 입력하고 **앱 등록**을 누릅니다. Firebase 호스팅은 체크하지 않습니다.
4. 화면에 나오는 `const firebaseConfig = { ... }` 안의 6개 값(apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)을 복사합니다.
5. `src/config/firebaseConfig.js`를 열어 같은 이름의 칸 따옴표 안에 붙여 넣고 저장합니다. 예: `apiKey: 'AIzaSy...',`
   (measurementId가 있어도 넣지 않아도 됩니다.)

## 4. 패키지 설치와 실행 (PowerShell)
```powershell
cd C:\Users\jkfut\Desktop\CookStep
npm install
npx expo start
```
휴대폰 Expo Go 앱으로 QR 코드를 찍어 실행합니다.

## 5. 확인
- 회원가입 화면에서 이메일과 6자 이상 비밀번호로 가입하면 "환영해요!" 홈 화면이 나옵니다.
- Firebase 콘솔 **Authentication > 사용자** 탭에 방금 가입한 이메일이 보이면 성공입니다.
- 로그아웃 후 같은 이메일로 로그인해 봅니다. 앱을 껐다 켜도 로그인이 유지됩니다.

## 6. 요리 기록 저장(Firestore) 켜기
요리 학습을 끝내고 **완료**를 누르면 Firestore 데이터베이스에 기록이 저장됩니다. 처음 한 번만 켜 주면 됩니다.

1. Firebase 콘솔 왼쪽 메뉴 **빌드(Build) > Firestore Database**를 누르고 **데이터베이스 만들기**를 누릅니다.
2. 위치는 `asia-northeast3 (서울)`을 고릅니다. (한 번 정하면 바꿀 수 없습니다.)
3. **프로덕션 모드에서 시작**을 고르고 **만들기**를 누릅니다.
4. 만들어지면 위쪽 **규칙(Rules)** 탭을 누르고, 안의 내용을 모두 지운 뒤 아래 내용을 붙여 넣고 **게시**를 누릅니다.
   (로그인한 사람이 자기 기록만 읽고 쓸 수 있게 하는 규칙입니다.)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. 앱에서 삶은 계란을 끝까지 따라 하고 **완료**를 누른 뒤, 콘솔 **데이터** 탭에서
   `users > (내 uid) > cookedDishes` 아래에 요리 이름과 완료 시각이 생겼는지 확인합니다.
