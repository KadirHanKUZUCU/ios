import Foundation
import CallKit

/// CallKit için telefon numarası hazırlayan, sıralayan ve tekilleştiren sağlayıcı
public struct SpamNumberProvider {
    
    public struct IdentificationEntry {
        public let phoneNumber: CXCallDirectoryPhoneNumber
        public let label: String
    }
    
    // MARK: - Bilinen Spam ve Sanal Santral Blokları
    // Not: CallKit her numarayı Int64 olarak ve kesin artan sırada (strictly ascending) bekler.
    // CallKit bellek limiti (~15-20 MB) nedeniyle milyonlarca numarayı tek seferde bellekte tutmak
    // yerine en yaygın tespit edilen spam blokları ve kullanıcı tanımlı numaralar birleştirilir.
    
    private static let knownSpamPhoneNumbers: [CXCallDirectoryPhoneNumber] = [
        // +90 375 XXX XX XX Sanal santral spam örnekleri (90375...)
        903750000001,
        903750000002,
        903750000010,
        903751234567,
        903759998877,
        903759999999,
        
        // +90 729 XXX XX XX Sahte / Yasadışı bahis arama blokları (90729...)
        907290000001,
        907290000055,
        907291112233,
        907295554433,
        907299998899,
        907299999999,
        
        // Bilinen agresif robot arama (IVR) numaraları
        908503750001,
        908503750002,
        908507290001,
        908509990000
    ]
    
    /// Engellenecek tüm numaraları hazırlar (Tekilleştirilmiş ve KESİN ARTAN SIRALI)
    public static func getBlockingPhoneNumbers(from rules: FilterRules) -> [CXCallDirectoryPhoneNumber] {
        var numberSet = Set<CXCallDirectoryPhoneNumber>()
        
        // 1. Statik bilinen spam numaraları ekle
        for num in knownSpamPhoneNumbers {
            numberSet.insert(num)
        }
        
        // 2. Kullanıcının doğrudan eklediği özel kara liste numaralarını dönüştür ve ekle
        for rawNumber in rules.customBlockedNumbers {
            if let validInt = parsePhoneNumber(rawNumber) {
                numberSet.insert(validInt)
            }
        }
        
        // 3. Kullanıcı ön eklerinden (örn: 90375, 90729) üretilen blok numaralarını ekle
        for prefix in rules.blockedNumberPrefixes {
            let sanitizedPrefix = SharedDataManager.shared.sanitizePhoneNumber(prefix)
            // Eğer tam bir numara ise doğrudan ekle
            if let directNum = Int64(sanitizedPrefix), sanitizedPrefix.count >= 10 {
                numberSet.insert(directNum)
            } else if sanitizedPrefix.count >= 5 {
                // Ön ek 5 hane veya daha fazlaysa (örn: 90375), bilinen tehlikeli alt blokları türet
                if let basePrefix = Int64(sanitizedPrefix) {
                    let multiplier = Int64(pow(10.0, Double(12 - sanitizedPrefix.count)))
                    if multiplier > 0 {
                        let start = basePrefix * multiplier
                        // Aşırı bellek tüketimini önlemek için kontrol edilebilir alt aralık ekle
                        for i: Int64 in 0...20 {
                            numberSet.insert(start + i)
                        }
                    }
                }
            }
        }
        
        // CALLKIT KRİTİK KURALI: Mutlaka küçükten büyüğe sıralı (sorted) olmalı!
        return numberSet.sorted()
    }
    
    /// Bilinen arayan kimliği (Caller ID) etiketlerini hazırlar (KESİN ARTAN SIRALI)
    public static func getIdentificationEntries() -> [IdentificationEntry] {
        var entries: [CXCallDirectoryPhoneNumber: String] = [
            903750000001: "⚠️ Şüpheli Sanal Santral",
            903750000002: "⚠️ Şüpheli Sanal Santral",
            903751234567: "🎰 Yasadışı Bahis / Kumar",
            907290000001: "🚫 Sahte Çağrı Merkezi",
            907291112233: "🎰 Yasadışı Bahis Robotu",
            908503750001: "⚠️ Agresif Pazarlama / IVR",
            908507290001: "⚠️ Otomatik Arama / Bot"
        ]
        
        // Sıralı olarak IdentificationEntry dizisine dönüştür
        return entries.keys
            .sorted()
            .compactMap { phone in
                guard let label = entries[phone] else { return nil }
                return IdentificationEntry(phoneNumber: phone, label: label)
            }
    }
    
    /// String haldeki telefon numarasını CallKit uyumlu Int64 değerine çevirir
    public static func parsePhoneNumber(_ input: String) -> CXCallDirectoryPhoneNumber? {
        let cleaned = SharedDataManager.shared.sanitizePhoneNumber(input)
        guard let value = Int64(cleaned), value > 0 else { return nil }
        return value
    }
}

