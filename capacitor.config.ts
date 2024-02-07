import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "eth.brume.wallet",
  appName: "Brume Wallet",
  webDir: "dist/android",
  android: {
    path: "apps/android"
  },
  server: {
    androidScheme: "https",
  }
};

export default config;
