import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterRules } from '../types';
import { RuleStorage } from './RuleStorage';
import { AuditLogger } from './AuditLogger';

export interface ThreatFeedMetadata {
  lastUpdated: string | null;
  totalThreatsInDatabase: number;
  newlyAddedCount: number;
}

const THREAT_SYNC_KEY = '@spam_filter_threat_metadata_v1';

// Bulut sunucusundan periyodik çekilen en güncel 2026 tehdit havuzu simülasyonu
const REMOTE_LATEST_THREATS = {
  keywords: [
    "grandpashabet",
    "sahabet",
    "onwin",
    "tipobet",
    "deneme bonusu verene",
    "cevrimsiz bonus",
    "rulet taktik",
    "sweet bonanza",
    "gates of olympus",
    "aviator giris",
    "t.me/bahisguncel",
    "t.me/casinotr"
  ],
  regexPatterns: [
    "https?:\\/\\/(cutt\\.ly|clck\\.ru|v\\.gd|is\\.gd)\\/[a-zA-Z0-9_-]+",
    "(?i)(yatırım|havale|papara)\\s*ile\\s*(bonus|freespin)",
    "(?i)(kayıp\\s*bonusu|discount\\s*oranı)\\s*%\\d+"
  ],
  prefixes: [
    "90375",
    "90729",
    "90850375",
    "90850729",
    "90212999" // Sanal agresif arama santralleri
  ],
  numbers: [
    "903759990011",
    "907291110022",
    "908503751234",
    "908507299876"
  ]
};

export class CloudThreatSyncService {
  /**
   * Bulut senkronizasyon meta verilerini okur
   */
  public static async getMetadata(): Promise<ThreatFeedMetadata> {
    try {
      const data = await AsyncStorage.getItem(THREAT_SYNC_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    return {
      lastUpdated: null,
      totalThreatsInDatabase: 1250,
      newlyAddedCount: 0,
    };
  }

  /**
   * En yeni bulut tehdit istihbaratını çeker ve yerel kurallarla birleştirir
   */
  public static async fetchAndMergeLatestThreats(
    currentRules: FilterRules,
    onUpdateRules?: (newRules: FilterRules) => void
  ): Promise<{ success: boolean; addedCount: number; message: string }> {
    let addedCount = 0;
    const updated = { ...currentRules };

    // 1. Yeni kara liste kelimelerini birleştir
    for (const kw of REMOTE_LATEST_THREATS.keywords) {
      if (!updated.blacklistKeywords.includes(kw)) {
        updated.blacklistKeywords.push(kw);
        addedCount++;
      }
    }

    // 2. Yeni regex desenlerini birleştir
    for (const rg of REMOTE_LATEST_THREATS.regexPatterns) {
      if (!updated.regexPatterns.includes(rg)) {
        updated.regexPatterns.push(rg);
        addedCount++;
      }
    }

    // 3. Yeni ön ek bloklarını birleştir
    for (const pf of REMOTE_LATEST_THREATS.prefixes) {
      if (!updated.blockedNumberPrefixes.includes(pf)) {
        updated.blockedNumberPrefixes.push(pf);
        addedCount++;
      }
    }

    // 4. Yeni özel numaraları birleştir
    for (const num of REMOTE_LATEST_THREATS.numbers) {
      if (!updated.customBlockedNumbers.includes(num)) {
        updated.customBlockedNumbers.push(num);
        addedCount++;
      }
    }

    // Değişiklikleri kaydet
    await RuleStorage.saveRules(updated);
    if (onUpdateRules) {
      onUpdateRules(updated);
    }

    // Meta veriyi güncelle
    const metadata: ThreatFeedMetadata = {
      lastUpdated: new Date().toISOString(),
      totalThreatsInDatabase: 1250 + addedCount,
      newlyAddedCount: addedCount,
    };
    await AsyncStorage.setItem(THREAT_SYNC_KEY, JSON.stringify(metadata));

    // Denetim kaydı oluştur
    await AuditLogger.logEvent(
      'SMS',
      'BULUT-GÜNCELLEME',
      'FLAGGED',
      `Bulut Tehdit Veritabanı senkronize edildi. ${addedCount} yeni kural eklendi.`
    );

    return {
      success: true,
      addedCount,
      message: addedCount > 0
        ? `Bulut güncellemesi başarılı! ${addedCount} yeni bahis ve spam kuralı kalkanınıza eklendi.`
        : 'Filtreleriniz zaten en güncel bulut tehdit veritabanı ile senkronize.',
    };
  }
}
