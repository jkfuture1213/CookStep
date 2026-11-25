// 요리 사진을 휴대폰 공유 창으로 보냅니다. 공유 창에서 인스타그램(피드·스토리·DM)을 고르면 됩니다.
// Expo Go에서는 인스타그램 앱을 바로 여는 전용 기능을 쓸 수 없어서, 휴대폰 기본 공유 창을 사용합니다.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// base64 글자를 바이트로 바꿉니다(파일로 저장하기 위해).
function base64ToBytes(base64) {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let index = 0;
  for (let i = 0; i < clean.length; i += 1) {
    buffer = (buffer << 6) | BASE64_CHARS.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[index] = (buffer >> bits) & 0xff;
      index += 1;
    }
  }
  return bytes.subarray(0, index);
}

// photo: 파일 주소(file://...) 또는 사진 데이터(data:image/jpeg;base64,... 또는 base64 글자)
export async function sharePhoto(photo, dishName) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('sharing-unavailable');
  }

  let uri = photo;
  if (!photo.startsWith('file:')) {
    // 저장된 사진은 글자(base64)로 되어 있어서, 공유하려면 잠깐 파일로 만들어야 합니다.
    const base64 = photo.startsWith('data:') ? photo.slice(photo.indexOf(',') + 1) : photo;
    const file = new File(Paths.cache, `cookstep-${Date.now()}.jpg`);
    file.create({ overwrite: true });
    file.write(base64ToBytes(base64));
    uri = file.uri;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/jpeg',
    UTI: 'public.jpeg',
    dialogTitle: dishName ? `${dishName} 사진 공유` : '요리 사진 공유',
  });
}

export function getShareErrorMessage(error) {
  if (error?.message === 'sharing-unavailable') {
    return '이 기기에서는 공유 기능을 쓸 수 없어요.';
  }
  return '사진을 공유하지 못했어요. 다시 시도해 주세요.';
}
