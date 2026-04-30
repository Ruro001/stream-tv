import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ruro.tv',
  appName: 'RuroTV',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
