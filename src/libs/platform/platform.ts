declare const IS_WEBSITE: boolean
declare const IS_CHROME: boolean
declare const IS_FIREFOX: boolean
declare const IS_SAFARI: boolean
declare const IS_ANDROID: boolean
declare const IS_APPLE: boolean

const IS_DEV = process.env.NODE_ENV === "development"
const IS_PROD = process.env.NODE_ENV === "production"

export function isDev() {
  return IS_DEV
}

export function isProd() {
  return !IS_DEV
}

export function isWebsite() {
  return IS_DEV || (IS_WEBSITE)
}

export function isProdWebsite() {
  return IS_PROD && (IS_WEBSITE)
}

export function isExtension() {
  return IS_PROD && (IS_CHROME || IS_FIREFOX || IS_SAFARI)
}

export function isChromeExtension() {
  return IS_PROD && (IS_CHROME)
}

export function isFirefoxExtension() {
  return IS_PROD && (IS_FIREFOX)
}

export function isSafariExtension() {
  return IS_PROD && (IS_SAFARI)
}

export function isAndroidApp() {
  return IS_PROD && (IS_ANDROID)
}

export function isAppleApp() {
  return IS_PROD && (IS_APPLE)
}

export function isIpad() {
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 0
}