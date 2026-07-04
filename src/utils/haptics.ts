import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative } from '../services/filesystem';

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
  if (isNative) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      console.warn("Haptics not available", e);
    }
  }
};
