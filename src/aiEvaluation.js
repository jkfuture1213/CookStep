import { AIError, getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai';

import { AI_ATTEMPTS, AI_ATTEMPT_TIMEOUT_MS, AI_TOTAL_TIMEOUT_MS } from './config/aiConfig';
import { RECIPES } from './data/recipes';
import { auth } from './firebase';

// AI가 돌려줄 평가 결과의 모양: 평점(1~5), 간단한 평가, 개선 사항 목록
const EVALUATION_SCHEMA = Schema.object({
  properties: {
    score: Schema.integer({ description: '1~5점 평점' }),
    summary: Schema.string({ description: '2~3문장의 간단한 평가' }),
    improvements: Schema.array({
      items: Schema.string(),
      description: '다음에 더 잘 만들기 위한 개선 사항 1~3개, 각각 한 문장',
    }),
  },
});

// 레시피 없이 올린 사진(AI 평가 탭의 '사진 찍기')용: 요리 이름도 함께 돌려받습니다.
const FREE_EVALUATION_SCHEMA = Schema.object({
  properties: {
    dishName: Schema.string({ description: '사진 속 요리 이름(한국어, 짧게). 사용자가 알려 준 이름이 있으면 그대로' }),
    score: Schema.integer({ description: '1~5점 평점' }),
    summary: Schema.string({ description: '2~3문장의 간단한 평가' }),
    improvements: Schema.array({
      items: Schema.string(),
      description: '다음에 더 잘 만들기 위한 개선 사항 1~3개, 각각 한 문장',
    }),
  },
});

const SYSTEM_PROMPT = `당신은 요리를 처음 배우는 1인 가구 사용자를 돕는 친절한 요리 선생님입니다.
사용자가 레시피를 따라 만든 요리의 완성 사진을 보고, 레시피대로 잘 만들어졌는지 평가합니다.

평가 방법:
- 사진에서 실제로 보이는 것만 근거로 삼으세요. 사진으로 알 수 없는 맛이나 간은 추측하지 마세요.
- 레시피의 결과물과 비교해 익힘 정도, 모양, 상태가 어떤지 봅니다.
- score는 1~5점입니다. 5: 레시피대로 아주 잘 됨, 4: 잘 됨, 3: 보통, 2: 아쉬움이 큼, 1: 레시피와 많이 다름.
- 기초 요리 스킬 연습 사진이면 요리 대신 연습 결과물(썬 재료의 크기·모양, 계량한 양, 익힘 정도 등)을 연습 방법과 비교합니다.
- 사진에 해당 요리가 보이지 않거나 판단하기 어려우면 score를 1로 하고, summary에 그 이유를 말하고 다시 찍어 보라고 안내하세요.
- summary는 2~3문장, improvements는 1~3개의 짧은 한 문장입니다. 초보자가 바로 따라 할 수 있게 구체적으로 쓰세요.
- 모든 문장은 다정한 존댓말 한국어로 씁니다.`;

let ai = null;
const models = {};

// 모델 이름(과 응답 모양)마다 한 번만 만들어 두고 다시 씁니다.
function getModel(name, free = false) {
  const cacheKey = `${name}${free ? ':free' : ''}`;
  if (!ai) {
    ai = getAI(auth.app, { backend: new GoogleAIBackend() });
  }
  if (!models[cacheKey]) {
    models[cacheKey] = getGenerativeModel(ai, {
      model: name,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: free ? FREE_EVALUATION_SCHEMA : EVALUATION_SCHEMA,
      },
    });
  }
  return models[cacheKey];
}

// 붐빔(500, 503), 한도 초과(429), 모델 없음(404), 시간 초과면 다음 시도로 넘어갑니다.
function shouldTryAgain(error) {
  if (error?.message === 'ai-timeout') {
    return true;
  }
  const status = error instanceof AIError ? error.customErrorData?.status : undefined;
  return [404, 429, 500, 503].includes(status);
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('ai-timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// "오믈렛을", "계란말이를"처럼 받침에 맞는 조사를 붙입니다.
function withObjectParticle(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasFinal ? '을' : '를'}`;
}

// AI가 끝내 답하지 못할 때 보여 주는 기본 평가입니다. 사진은 보지 않고 레시피의 요령을 알려 줍니다.
export function getBasicEvaluation(dishId) {
  const recipe = RECIPES[dishId];
  return {
    score: 3,
    summary: `${withObjectParticle(recipe?.name ?? '요리')} 끝까지 완성했어요! 지금은 AI가 바빠서 사진 대신 레시피를 바탕으로 기본 평가를 드려요.`,
    improvements: (recipe?.tips ?? ['레시피의 시간과 불 세기를 지키며 한 번 더 만들어 보세요.']).slice(0, 3),
    source: 'basic',
  };
}

function describeRecipe(dishId) {
  const recipe = RECIPES[dishId];
  if (!recipe) {
    return '';
  }
  const steps = recipe.steps.map((step, i) => `${i + 1}. ${step.text}`).join('\n');
  if (recipe.kind === 'skill') {
    // 기초 요리 스킬은 완성 요리가 아니라 연습 결과물 사진을 평가합니다.
    return `기초 요리 스킬: ${recipe.name}\n준비물: ${recipe.ingredients.join(', ')}\n연습 방법:\n${steps}\n사진에 찍혀 있어야 할 것: ${recipe.photoGuide}`;
  }
  return `요리 이름: ${recipe.name}\n재료: ${recipe.ingredients.join(', ')}\n만드는 방법:\n${steps}`;
}

// 완성 사진(JPEG base64)과 레시피를 Gemini에게 보내 평가를 받습니다.
// 돌려주는 값 예: { score: 4, summary: '...', improvements: ['...'] }
export async function evaluateDish(dishId, photoBase64) {
  if (!auth) {
    throw new Error('no-firebase');
  }

  const intro =
    RECIPES[dishId]?.kind === 'skill'
      ? '아래 기초 요리 스킬을 연습한 결과물 사진입니다. 연습 방법대로 잘 했는지 평가해 주세요.'
      : '아래 레시피대로 만든 요리의 완성 사진입니다. 평가해 주세요.';
  const request = [
    { inlineData: { mimeType: 'image/jpeg', data: photoBase64 } },
    { text: `${intro}\n\n${describeRecipe(dishId)}` },
  ];
  const parsed = await generate(request, false);
  return toEvaluation(parsed);
}

// AI 평가 탭에서 레시피 없이 올린 사진을 평가합니다. dishNameHint는 사용자가 적은 요리 이름(없으면 '').
// 돌려주는 값 예: { dishName: '김치볶음밥', evaluation: { score, summary, improvements, source: 'ai' } }
export async function evaluateFreePhoto(photoBase64, dishNameHint = '') {
  if (!auth) {
    throw new Error('no-firebase');
  }
  const hint = dishNameHint.trim();
  const text = hint
    ? `사용자가 직접 만든 "${hint}" 사진입니다. 정해진 레시피는 없으니, 일반적으로 잘 만든 ${hint}와 비교해 평가해 주세요. dishName은 "${hint}"로 하세요.`
    : '사용자가 직접 만든 요리 사진입니다. 정해진 레시피는 없습니다. 먼저 어떤 요리인지 알아보고 dishName에 적은 뒤, 일반적으로 잘 만든 그 요리와 비교해 평가해 주세요. 요리를 알아볼 수 없으면 dishName을 "알 수 없는 요리"로 하세요.';
  const request = [{ inlineData: { mimeType: 'image/jpeg', data: photoBase64 } }, { text }];
  const parsed = await generate(request, true);
  return {
    dishName: String(parsed.dishName || hint || '알 수 없는 요리').slice(0, 30),
    evaluation: toEvaluation(parsed),
  };
}

function toEvaluation(parsed) {
  return {
    score: Math.min(5, Math.max(1, Math.round(Number(parsed.score) || 1))),
    summary: String(parsed.summary ?? ''),
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [],
    source: 'ai',
  };
}

// 모델 목록(AI_ATTEMPTS) 순서대로 시도해 JSON 답을 받아 옵니다.
async function generate(request, free) {
  // 빠른 결과를 위해 시도마다 짧게 기다리고, 전체 시간이 지나면 멈춥니다.
  const deadline = Date.now() + AI_TOTAL_TIMEOUT_MS;
  let result;
  let lastError;
  for (const name of AI_ATTEMPTS) {
    const remaining = deadline - Date.now();
    if (remaining < 1500) {
      break;
    }
    try {
      result = await withTimeout(getModel(name, free).generateContent(request), Math.min(AI_ATTEMPT_TIMEOUT_MS, remaining));
      break;
    } catch (e) {
      lastError = e;
      if (!shouldTryAgain(e)) {
        throw e;
      }
      await wait(500);
    }
  }
  if (!result) {
    throw lastError ?? new Error('ai-timeout');
  }

  return JSON.parse(result.response.text());
}

export function getEvaluationErrorMessage(error) {
  if (error instanceof AIError) {
    if (error.code === 'api-not-enabled') {
      return 'Firebase 콘솔에서 AI Logic이 아직 켜져 있지 않아요. 안내에 따라 켜 주세요.';
    }
    const status = error.customErrorData?.status;
    if (status === 429) {
      return '무료 사용량(분당 한도)을 잠시 다 썼어요. 1분쯤 뒤에 다시 시도해 주세요.';
    }
    if (status === 500 || status === 503) {
      return 'Gemini 서버가 지금 붐벼요. 잠시 후 다시 시도해 주세요.';
    }
    if (status === 404) {
      return 'AI 모델을 찾을 수 없어요. src/config/aiConfig.js의 모델 이름을 확인해 주세요.';
    }
    if (error.code === 'fetch-error' && !error.customErrorData?.status) {
      return '인터넷 연결을 확인해 주세요.';
    }
  }
  if (error?.message === 'ai-timeout') {
    return 'AI 답변이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.';
  }
  if (error instanceof SyntaxError) {
    return 'AI 답변을 읽지 못했어요. 다시 평가받기를 눌러 주세요.';
  }
  return 'AI 평가를 받지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

// 화면 아래에 작게 보여 줄 실제 오류 내용 (문제를 찾을 때 이 글자를 알려 주세요)
export function getEvaluationErrorDetail(error) {
  const status = error?.customErrorData?.status;
  const parts = [error?.code || error?.name, status && `HTTP ${status}`, error?.message].filter(Boolean);
  return parts.join(' · ').slice(0, 300);
}
