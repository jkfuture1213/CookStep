import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSaveErrorMessage, saveCookedPhoto } from '../cookingHistory';
import { colors } from '../theme';

// 저장할 사진 크기(정사각형 한 변, 픽셀)와 압축 정도. 작게 줄여야 Firestore에 저장할 수 있습니다.
const PHOTO_SIZE = 720;
const PHOTO_QUALITY = 0.5;

// 찍은 사진에서 화면의 네모 칸과 같은 가운데 정사각형만 잘라 작게 줄입니다.
async function cropToSquare(photo) {
  const side = Math.min(photo.width, photo.height);
  const context = ImageManipulator.manipulate(photo.uri);
  context
    .crop({
      originX: Math.round((photo.width - side) / 2),
      originY: Math.round((photo.height - side) / 2),
      width: side,
      height: side,
    })
    .resize({ width: PHOTO_SIZE, height: PHOTO_SIZE });
  const image = await context.renderAsync();
  return image.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG, base64: true });
}

// 요리를 다 만든 뒤 완성 사진을 찍는 화면입니다.
// onEvaluate(photo): 사진을 저장한 뒤 AI 평가 화면으로 넘어갈 때 부릅니다.
export default function PhotoScreen({ cookedId, dishName, onDone, onEvaluate }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photo, setPhoto] = useState(null); // { uri, base64 }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleShoot() {
    if (!cameraRef.current || !cameraReady) {
      return;
    }
    setError('');
    setBusy(true);
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setPhoto(await cropToSquare(picture));
    } catch (e) {
      setError('사진을 찍지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  // 사진을 Firebase에 저장합니다. evaluate가 true면 저장 후 AI 평가 화면으로 갑니다.
  async function handleSave(evaluate) {
    setError('');
    setBusy(true);
    try {
      await saveCookedPhoto(cookedId, photo.base64);
      if (evaluate) {
        onEvaluate(photo);
      } else {
        onDone();
      }
    } catch (e) {
      setError(getSaveErrorMessage(e));
      setBusy(false);
    }
  }

  let frameContent;
  if (photo) {
    frameContent = <Image source={{ uri: photo.uri }} style={styles.fill} />;
  } else if (!permission) {
    frameContent = <ActivityIndicator color={colors.orange} />;
  } else if (!permission.granted) {
    frameContent = (
      <View style={styles.permission}>
        <Text style={styles.permissionText}>사진을 찍으려면 카메라 권한이 필요해요.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={requestPermission}
          style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
        >
          <Text style={styles.smallButtonText}>카메라 허용하기</Text>
        </Pressable>
      </View>
    );
  } else {
    frameContent = (
      <CameraView
        ref={cameraRef}
        style={styles.fill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>완성된 요리 사진을 찍어 주세요</Text>
        <Text style={styles.subtitle}>{dishName} 요리가 네모 칸 안에 들어오게 맞춰 주세요</Text>
      </View>

      <View style={styles.body}>
        {/* 이 네모 칸에 보이는 모습 그대로 사진이 저장됩니다. */}
        <View style={styles.frame}>{frameContent}</View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.footer}>
        {photo ? (
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPhoto(null)}
              disabled={busy}
              style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}
            >
              <Text style={[styles.buttonText, styles.secondaryText]}>다시 찍기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => handleSave(true)}
              disabled={busy}
              style={({ pressed }) => [styles.button, styles.primary, styles.grow, pressed && styles.pressed]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.primaryText]}>음식 평가</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="사진 찍기"
            onPress={handleShoot}
            disabled={busy || !cameraReady}
            style={({ pressed }) => [
              styles.shutter,
              (busy || !cameraReady) && styles.shutterDisabled,
              pressed && styles.pressed,
            ]}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <View style={styles.shutterInner} />}
          </Pressable>
        )}

        {photo ? (
          <Pressable accessibilityRole="button" onPress={() => handleSave(false)} disabled={busy} hitSlop={8}>
            <Text style={styles.skip}>평가 없이 사진만 저장하기</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={onDone} disabled={busy} hitSlop={8}>
            <Text style={styles.skip}>사진 없이 넘어가기</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  frame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.orange,
    backgroundColor: '#2B2B2B',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  permission: {
    alignItems: 'center',
    gap: 14,
    padding: 24,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  smallButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.orange,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    backgroundColor: '#F5B9A2',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  skip: {
    fontSize: 15,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  grow: {
    flex: 1,
  },
  primary: {
    backgroundColor: colors.orange,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.orange,
  },
  pressed: {
    opacity: 0.75,
  },
});
