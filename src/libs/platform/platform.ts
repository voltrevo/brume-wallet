declare const IS_WEBSITE: boolean
declare const IS_CHROME: boolean
declare const IS_FIREFOX: boolean
declare const IS_SAFARI: boolean
declare const IS_ANDROID: boolean
declare const IS_IOS: boolean

export function isWebsite() {
  return IS_WEBSITE
}

export function isExtension() {
  return IS_CHROME || IS_FIREFOX || IS_SAFARI
}

export function isMobile() {
  return IS_ANDROID || IS_IOS
}

export function isChromeExt() {
  return IS_CHROME
}

export function isFirefoxExt() {
  return IS_FIREFOX
}

export function isSafariExt() {
  return IS_SAFARI
}

export function isAndroidApp() {
  return IS_ANDROID
}

export function isIosApp() {
  return IS_IOS
}