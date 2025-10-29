import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kidstoys.bangladesh',
  appName: 'KidsToys Bangladesh',
  webDir: 'out',
  server: {
    // For production, use your actual domain
    // For development, you can use localhost or your dev server IP
    androidScheme: 'https',
    cleartext: true, // Allow HTTP for local testing
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#14B8A6', // Teal primary color
      showSpinner: false,
      androidSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'light', // Light text on dark status bar
      backgroundColor: '#14B8A6', // Teal primary color
    },
  },
};

export default config;
