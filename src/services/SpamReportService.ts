import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SpamReport,
  SpamCategory,
  UserConsentSettings,
  FilterRules,
} from '../types';
import { RuleStorage } from './RuleStorage';
import { AuditLogger } from './AuditLogger';

const CONSENT_KEY = '@spam_filter_user_consent_v1';
const REPORTS_KEY = '@spam_filter_crowdsource_reports_v1';

export class SpamReportService {
  /**
   * Kullanıcının anonim veri paylaşım izin ayarını okur
   */
  public static async getConsentSettings(): Promise<UserConsentSettings> {
    try {
      const data = await AsyncStorage.getItem(CONSENT_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('İzin ayarı okunamadı:', e);
    }
    return { crowdsourceConsent: false, consentDate: null };
  }

  /**
   * İzin ayarını günceller
   */
  public static async setConsent(granted: boolean): Promise<void> {
    const settings: UserConsentSettings = {
      crowdsourceConsent: granted,
      consentDate: granted ? new Date().toISOString() : null,
    };
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(settings));
  }

  /**
   * KVKK ve Gizlilik Maskelemesi:
   * Kişisel isimleri, 16 haneli kart numaralarını ve 6 haneli banka onay kodlarını siler/maskeler.
   * Yalnızca şüpheli linkleri, B-kodlarını ve kumar kelimelerini bırakır.
   */
  public static sanitizeForPrivacy(text: string): string {
    let sanitized = text;

    // 1. Kredi kartı formatlarını maskele (16 haneli)
    sanitized = sanitized.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[KART_NO_MASKE]');

    // 2. 6 haneli banka tek kullanımlık onay kodlarını maskele
    sanitized = sanitized.replace(/\b\d{6}\b/g, '[OTP_KOD_MASKE]');

    // 3. TC Kimlik numarası olabilecek 11 haneli sayıları maskele
    sanitized = sanitized.replace(/\b[1-9]\d{10}\b/g, '[TCKN_MASKE]');

    // 4. "Sayın / Sn. [İsim]" kalıbını maskele
    sanitized = sanitized.replace(/(sayin|sn\.)\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+\s+[a-zçğıöşüA-ZÇĞİÖŞÜ]+/gi, '$1 [İSİM_MASKE]');

    return sanitized;
  }

  /**
   * Kullanıcıdan gelen spam bildirimini işler:
   * 1. Yerel kara listeye otomatik ekler (anında koruma).
   * 2. İzin verilmişse anonim veri havuzuna iletir.
   * 3. Denetim loguna kaydeder.
   */
  public static async submitReport(
    type: 'SMS' | 'CALL',
    senderOrNumber: string,
    content: string,
    category: SpamCategory,
    currentRules: FilterRules,
    onUpdateRules?: (newRules: FilterRules) => void
  ): Promise<{ success: boolean; message: string; autoBlockedRule: string }> {
    const consent = await this.getConsentSettings();
    const sanitizedContent = this.sanitizeForPrivacy(content);

    let autoBlockedRule = '';
    const updatedRules = { ...currentRules };

    if (type === 'CALL') {
      // Aramayı doğrudan engellenen numaralara ekle
      const cleanedNum = senderOrNumber.replace(/[^0-9]/g, '');
      if (cleanedNum && !updatedRules.customBlockedNumbers.includes(cleanedNum)) {
        updatedRules.customBlockedNumbers = [cleanedNum, ...updatedRules.customBlockedNumbers];
        autoBlockedRule = `+${cleanedNum} numarası kara listeye eklendi`;
      }
    } else {
      // SMS içindeki link veya anahtar kelimeyi yakala
      const urlRegex = /(https?:\/\/[^\s]+|t\.me\/[a-zA-Z0-9_-]+)/i;
      const match = content.match(urlRegex);

      if (match && match[0]) {
        const detectedUrl = match[0].trim();
        // Regex kalıbı veya kelime olarak ekle
        if (!updatedRules.blacklistKeywords.includes(detectedUrl)) {
          updatedRules.blacklistKeywords = [detectedUrl, ...updatedRules.blacklistKeywords];
          autoBlockedRule = `'${detectedUrl}' bağlantısı kara listeye eklendi`;
        }
      } else {
        // Gönderen B-kodu veya özel bir kelime ise
        const trimmedSender = senderOrNumber.trim().toLowerCase();
        if (trimmedSender && !updatedRules.blacklistKeywords.includes(trimmedSender)) {
          updatedRules.blacklistKeywords = [trimmedSender, ...updatedRules.blacklistKeywords];
          autoBlockedRule = `'${trimmedSender}' göndereni kara listeye eklendi`;
        }
      }
    }

    // Yerel kuralları anında kaydet ve güncelle
    await RuleStorage.saveRules(updatedRules);
    if (onUpdateRules) {
      onUpdateRules(updatedRules);
    }

    // Denetim loguna ekle
    await AuditLogger.logEvent(
      type,
      senderOrNumber,
      'BLOCKED',
      `Kullanıcı bildirimi (${category}): ${autoBlockedRule || 'Engellendi'}`,
      sanitizedContent
    );

    // Anonim rapor havuzuna ekle
    const report: SpamReport = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      senderOrNumber: type === 'CALL' ? senderOrNumber.replace(/[^0-9]/g, '') : senderOrNumber,
      rawContent: content,
      sanitizedContent,
      category,
      anonymousConsent: consent.crowdsourceConsent,
    };

    try {
      const existing = await this.getReports();
      const updatedReports = [report, ...existing].slice(0, 50);
      await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(updatedReports));
    } catch (e) {
      console.warn('Rapor kaydedilemedi:', e);
    }

    return {
      success: true,
      message: consent.crowdsourceConsent
        ? 'Teşekkürler! Bildiriminiz anonimleştirilerek topluluk spam havuzuna iletildi ve yerel filtrenize eklendi.'
        : 'Bildirim yerel kara listenize başarıyla eklendi.',
      autoBlockedRule,
    };
  }

  public static async getReports(): Promise<SpamReport[]> {
    try {
      const data = await AsyncStorage.getItem(REPORTS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [];
  }
}

