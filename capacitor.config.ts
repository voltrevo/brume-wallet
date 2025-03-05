import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = process.env.PLATFORM === "android" ? {
  appId: "money.brume.wallet",
  appName: "Brume Wallet",
  webDir: "dist/android",
  android: {
    path: "apps/android"
  },
  server: {
    androidScheme: "https",
  }
} : {
  appId: "money.brume.wallet",
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
