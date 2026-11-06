import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuietHoursSettings {
  isEnabled: boolean;
  startTime: string; // "22:00"
  endTime: string;   // "08:00"
  blockAllUnknownCorporate: boolean;
}

const QUIET_HOURS_KEY = '@spam_filter_quiet_hours_v1';

export class QuietHoursService {
  public static async getSettings(): Promise<QuietHoursSettings> {
    try {
      const data = await AsyncStorage.getItem(QUIET_HOURS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    return {
      isEnabled: true,
      startTime: '22:00',
      endTime: '08:00',
      blockAllUnknownCorporate: true,
    };
  }

  public static async saveSettings(settings: QuietHoursSettings): Promise<void> {
    await AsyncStorage.setItem(QUIET_HOURS_KEY, JSON.stringify(settings));
  }

  /**
   * Şu anki saatin Gece Koruma aralığında olup olmadığını kontrol eder
   */
  public static isCurrentlyQuietHours(settings: QuietHoursSettings): boolean {
    if (!settings.isEnabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = settings.startTime.split(':').map(Number);
    const [endH, endM] = settings.endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Örn: 22:00 - 08:00 (gece yarısını aşan aralık)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  }
}

