declare const IS_WEBSITE: boolean
declare const IS_CHROME: boolean
declare const IS_FIREFOX: boolean
declare const IS_SAFARI: boolean
declare const IS_ANDROID: boolean
declare const IS_APPLE: boolean

const IS_DEV = process.env.NODE_ENV === "development"

export function isWebsite() {
  return IS_DEV || (IS_WEBSITE)
}

export function isExtension() {
  return !IS_DEV && (IS_CHROME || IS_FIREFOX || IS_SAFARI)
}

export function isChromeExt() {
  return !IS_DEV && (IS_CHROME)
}

export function isFirefoxExt() {
  return !IS_DEV && (IS_FIREFOX)
}

export function isSafariExt() {
  return !IS_DEV && (IS_SAFARI)
}

export function isAndroidApp() {
  return !IS_DEV && (IS_ANDROID)
}

export function isAppleApp() {
  return !IS_DEV && (IS_APPLE)
}
