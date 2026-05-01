import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Utility service to provide haptic feedback on mobile devices.
 * Safely checks if the app is running on a native platform.
 */
class HapticsService {
  private isNative = Capacitor.isNativePlatform();

  async impactLight() {
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  }

  async impactMedium() {
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  }

  async impactHeavy() {
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }

  async vibrate() {
    if (this.isNative) {
      await Haptics.vibrate();
    }
  }

  async selectionClick() {
    if (this.isNative) {
      await Haptics.selectionChanged();
    }
  }
}

export const hapticsService = new HapticsService();
