import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  type: 'SMS' | 'CALL';
  senderOrNumber: string;
  content?: string;
  action: 'BLOCKED' | 'FLAGGED';
  reason: string;
}

const AUDIT_LOGS_KEY = '@spam_filter_audit_logs_v1';
const MAX_LOGS = 100;

export class AuditLogger {
  /**
   * Tüm engellenen ve tespit edilen kayıtları getirir
   */
  public static async getLogs(): Promise<AuditLogEntry[]> {
    try {
      const data = await AsyncStorage.getItem(AUDIT_LOGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Loglar okunamadı:', e);
    }
    return [];
  }

  /**
   * Yeni bir engelleme/tespit kaydı ekler
   */
  public static async logEvent(
    type: 'SMS' | 'CALL',
    senderOrNumber: string,
    action: 'BLOCKED' | 'FLAGGED',
    reason: string,
    content?: string
  ): Promise<void> {
    try {
      const logs = await this.getLogs();
      const newEntry: AuditLogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        type,
        senderOrNumber,
        action,
        reason,
        content,
      };

      // En yeni loglar başta, maksimum 100 kayıt
      const updatedLogs = [newEntry, ...logs].slice(0, MAX_LOGS);
      await AsyncStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updatedLogs));
    } catch (e) {
      console.warn('Log kaydedilemedi:', e);
    }
  }

  /**
   * Tüm log geçmişini temizler
   */
  public static async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUDIT_LOGS_KEY);
    } catch (e) {
      console.warn('Loglar temizlenemedi:', e);
    }
  }
}

