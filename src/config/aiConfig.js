// AI 평가 설정입니다. Firebase AI Logic으로 Google의 Gemini 모델을 씁니다.
// API 키는 필요 없습니다. Firebase 콘솔에서 AI Logic을 한 번 켜 두기만 하면 됩니다.
// 모델 이름은 Firebase 문서의 "지원 모델" 목록에서 확인할 수 있습니다:
// https://firebase.google.com/docs/ai-logic/models

// 시도할 순서입니다. 가볍고 빠른 모델을 먼저, 여러 번 시도합니다.
export const AI_ATTEMPTS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];

// 한 번 시도할 때 기다리는 최대 시간(밀리초)
export const AI_ATTEMPT_TIMEOUT_MS = 10000;

// 전체 평가에 쓰는 최대 시간(밀리초). 이 시간이 지나면 앱 안의 기본 평가를 보여 줍니다.
export const AI_TOTAL_TIMEOUT_MS = 20000;
