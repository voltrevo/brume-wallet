import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "eth.brume.wallet",
  appName: "Brume Wallet",
  webDir: "dist/website",
  ios: {
    path: "dist/ios"
  },
  android: {
    path: "dist/android"
  },
  server: {
    androidScheme: "https",
  }
};

export default config;
