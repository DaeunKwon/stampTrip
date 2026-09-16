import { Capacitor } from '@capacitor/core'

/** Capacitor 로 감싼 iOS/Android 앱 안에서 실행 중인지 (브라우저·PWA 는 false) */
export const isNativeApp = Capacitor.isNativePlatform()

/** 'ios' | 'android' | 'web' */
export const nativePlatform = Capacitor.getPlatform()

/**
 * 소셜 로그인 후 앱으로 돌아올 딥링크. Supabase → Authentication → URL Configuration → Redirect URLs 에
 * 이 값을 그대로 등록해야 한다. (Android manifest / iOS Info.plist 의 URL scheme 과 일치)
 */
export const AUTH_DEEP_LINK = 'stamptrip://auth/callback'
