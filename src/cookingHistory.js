import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { auth } from './firebase';

const SAVE_TIMEOUT_MS = 10000;
const PHOTO_SAVE_TIMEOUT_MS = 20000;

// 저장 위치
// - 요리 기록: users/{uid}/cookedDishes/{기록 id}  → { dishId, dishName, completedAt, hasPhoto }
// - 요리 사진: users/{uid}/cookedPhotos/{기록 id}  → { data: JPEG base64 문자열, createdAt }
// - AI 평가: 요리 기록의 evaluation 필드 → { score, summary, improvements, evaluatedAt }
// 사진은 목록을 불러올 때마다 같이 받으면 느려지므로 따로 저장하고, 볼 때만 불러옵니다.

function getContext() {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('not-signed-in');
  }
  return { db: getFirestore(auth.app), uid: user.uid };
}

// Firestore가 아직 켜져 있지 않거나 인터넷이 끊기면 저장이 끝나지 않고 기다리기만 할 수 있어서
// 정해진 시간이 지나면 실패로 처리합니다.
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]);
}

// 사용자가 요리를 끝까지 따라 했을 때 기록을 남기고, 기록 id를 돌려줍니다.
export async function saveCookedDish(dishId, dishName) {
  const { db, uid } = getContext();
  const ref = await withTimeout(
    addDoc(collection(db, 'users', uid, 'cookedDishes'), {
      dishId,
      dishName,
      completedAt: serverTimestamp(),
      hasPhoto: false,
    }),
    SAVE_TIMEOUT_MS
  );
  return ref.id;
}

// 완성 요리 사진(JPEG base64)을 요리 기록에 연결해서 저장합니다.
export async function saveCookedPhoto(cookedId, base64) {
  const { db, uid } = getContext();
  await withTimeout(
    setDoc(doc(db, 'users', uid, 'cookedPhotos', cookedId), {
      data: base64,
      createdAt: serverTimestamp(),
    }),
    PHOTO_SAVE_TIMEOUT_MS
  );
  await withTimeout(
    updateDoc(doc(db, 'users', uid, 'cookedDishes', cookedId), { hasPhoto: true }),
    SAVE_TIMEOUT_MS
  );
}

// AI 평가 결과를 요리 기록에 저장합니다.
export async function saveEvaluation(cookedId, evaluation) {
  const { db, uid } = getContext();
  await withTimeout(
    updateDoc(doc(db, 'users', uid, 'cookedDishes', cookedId), {
      evaluation: { ...evaluation, evaluatedAt: serverTimestamp() },
    }),
    SAVE_TIMEOUT_MS
  );
}

// 요리 기록 하나를 지웁니다. 평가는 기록 안에 있어서 같이 지워지고, 사진 문서도 함께 지웁니다.
export async function deleteCookedDish(cookedId) {
  const { db, uid } = getContext();
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', uid, 'cookedDishes', cookedId));
  batch.delete(doc(db, 'users', uid, 'cookedPhotos', cookedId));
  await withTimeout(batch.commit(), SAVE_TIMEOUT_MS);
}

// ----- AI 평가 탭에서 레시피 없이 올린 사진의 평가 -----
// 저장 위치: users/{uid}/freeEvaluations/{id} → { dishName, evaluation, createdAt, hasPhoto }
//            users/{uid}/freePhotos/{id}      → { data: JPEG base64, createdAt }
// 요리 기록(cookedDishes)과 따로 두어 칭호·단계 해제에는 영향을 주지 않습니다.
export async function saveFreeEvaluation(dishName, evaluation, base64) {
  const { db, uid } = getContext();
  const ref = doc(collection(db, 'users', uid, 'freeEvaluations'));
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid, 'freePhotos', ref.id), { data: base64, createdAt: serverTimestamp() });
  batch.set(ref, {
    dishName,
    evaluation: { ...evaluation, evaluatedAt: serverTimestamp() },
    hasPhoto: true,
    createdAt: serverTimestamp(),
  });
  await withTimeout(batch.commit(), PHOTO_SAVE_TIMEOUT_MS);
  return ref.id;
}

// 돌려주는 값 예: [{ id, dishName, evaluation, createdAt: Date, hasPhoto }] (최신순)
export async function loadFreeEvaluations() {
  const { db, uid } = getContext();
  const snapshot = await withTimeout(
    getDocs(query(collection(db, 'users', uid, 'freeEvaluations'), orderBy('createdAt', 'desc'))),
    SAVE_TIMEOUT_MS
  );
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      dishName: data.dishName,
      evaluation: data.evaluation,
      hasPhoto: Boolean(data.hasPhoto),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
    };
  });
}

export async function loadFreePhoto(id) {
  const { db, uid } = getContext();
  const snapshot = await getDoc(doc(db, 'users', uid, 'freePhotos', id));
  const data = snapshot.exists() ? snapshot.data().data : null;
  return data ? `data:image/jpeg;base64,${data}` : null;
}

// 요리 기록에 연결된 사진을 불러옵니다. 사진이 없으면 null.
export async function loadCookedPhoto(cookedId) {
  const { db, uid } = getContext();
  const snapshot = await getDoc(doc(db, 'users', uid, 'cookedPhotos', cookedId));
  const data = snapshot.exists() ? snapshot.data().data : null;
  return data ? `data:image/jpeg;base64,${data}` : null;
}

export function getSaveErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return '저장 권한이 없습니다. Firestore 보안 규칙을 확인해 주세요.';
  }
  if (error?.message === 'timeout' || error?.code === 'unavailable') {
    return '저장하지 못했습니다. 인터넷 연결과 Firestore 설정을 확인해 주세요.';
  }
  return '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

// 지금까지 만든 요리 기록을 최근 것부터 가져옵니다.
// 돌려주는 값 예: [{ id: 'abc', dishId: 'boiled-egg', dishName: '삶은 계란', completedAt: Date, hasPhoto: true, evaluation: {...} }]
export async function loadCookedDishes() {
  const user = auth?.currentUser;
  if (!user) {
    return [];
  }
  const db = getFirestore(auth.app);
  const q = query(
    collection(db, 'users', user.uid, 'cookedDishes'),
    orderBy('completedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      dishId: data.dishId,
      dishName: data.dishName,
      completedAt: data.completedAt?.toDate ? data.completedAt.toDate() : null,
      hasPhoto: Boolean(data.hasPhoto),
      evaluation: data.evaluation ?? null,
    };
  });
}

export function getLoadErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return '기록을 볼 권한이 없습니다. Firestore 보안 규칙을 확인해 주세요.';
  }
  return '기록을 불러오지 못했습니다. 인터넷 연결과 Firestore 설정을 확인해 주세요.';
}
