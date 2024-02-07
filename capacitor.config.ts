import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = process.env.PLATFORM === "android" ? {
  appId: "eth.brume.wallet",
  appName: "Brume Wallet",
  webDir: "dist/android",
  android: {
    path: "apps/android"
  },
  server: {
    androidScheme: "https",
  }
} : {
  appId: "eth.brume.wallet",
  appName: "Brume Wallet",
  webDir: "dist/apple",
  ios: {
    path: "apps/ios",
    limitsNavigationsToAppBoundDomains: true
  },
  server: {
    iosScheme: "brume"
  }
}

export default config;
