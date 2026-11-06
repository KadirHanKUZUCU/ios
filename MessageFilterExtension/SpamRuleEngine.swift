import Foundation
import IdentityLookup

/// Gelen SMS'i analiz eden ve whitelist/blacklist/regex kontrolleriyle spam kararı veren motor
public struct SpamRuleEngine {
    
    public enum Verdict {
        case allow(reason: String)
        case junk(reason: String)
    }
    
    /// Verilen mesaj gövdesi ve gönderen bilgisine göre aksiyon belirler
    public static func evaluate(
        sender: String?,
        messageBody: String?,
        rules: FilterRules
    ) -> Verdict {
        guard let body = messageBody, !body.isEmpty else {
            return .allow(reason: "Boş mesaj gövdesi")
        }
        
        let rawNormalizedBody = body.lowercased(with: Locale(identifier: "tr_TR"))
        let fullyNormalizedBody = MessageNormalizer.normalize(body)
        let senderLower = sender?.lowercased(with: Locale(identifier: "tr_TR")) ?? ""
        
        // MARK: - 1. AŞAMA: İSTİSNALAR (WHITELIST KONTROLÜ)
        // Bankacılık, onay kodları, şifre ve kritik bildirimler ASLA junk yapılmaz.
        for whiteWord in rules.whitelistKeywords {
            let normalizedWhite = whiteWord.lowercased(with: Locale(identifier: "tr_TR"))
            if rawNormalizedBody.contains(normalizedWhite) || fullyNormalizedBody.contains(normalizedWhite) {
                return .allow(reason: "Whitelist kelimesi eşleşti: '\(whiteWord)'")
            }
        }
        
        // Gönderen bilinen güvenilir banka/kurum adıysa izin ver
        let trustedSenders = ["garanti", "isbank", "akbank", "ziraat", "yapikredi", "qnb", "vakifbank", "halkbank", "teb", "enpara"]
        if trustedSenders.contains(where: { senderLower.contains($0) }) {
            // Şifre veya onay içeren banka mesajları doğrudan onaylanır
            return .allow(reason: "Güvenilir kurumsal gönderen: '\(sender ?? "")'")
        }
        
        // MARK: - 2. AŞAMA: KARA LİSTE KELİME KONTROLÜ
        for keyword in rules.blacklistKeywords {
            let normalizedKeyword = MessageNormalizer.normalize(keyword)
            guard !normalizedKeyword.isEmpty else { continue }
            
            // Hem düz metinde hem de leetspeak temizlenmiş metinde ara
            if rawNormalizedBody.contains(keyword.lowercased(with: Locale(identifier: "tr_TR"))) ||
               fullyNormalizedBody.contains(normalizedKeyword) {
                return .junk(reason: "Kara liste kelime eşleşti: '\(keyword)'")
            }
        }
        
        // MARK: - 3. AŞAMA: KISALTILMIŞ URL & ÖZEL REGEX DESENLERİ
        for pattern in rules.regexPatterns {
            if let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) {
                let range = NSRange(body.startIndex..<body.endIndex, in: body)
                if regex.firstMatch(in: body, options: [], range: range) != nil {
                    return .junk(reason: "Regex kuralı eşleşti: '\(pattern)'")
                }
                
                // Normalleştirilmiş metin üzerinde de dene
                let normRange = NSRange(fullyNormalizedBody.startIndex..<fullyNormalizedBody.endIndex, in: fullyNormalizedBody)
                if regex.firstMatch(in: fullyNormalizedBody, options: [], range: normRange) != nil {
                    return .junk(reason: "Normalleştirilmiş metinde Regex eşleşti: '\(pattern)'")
                }
            }
        }
        
        // MARK: - 4. AŞAMA: B-KODU VE BAHİS TERİMLERİ KOMBİNASYONU
        // Türkiye'deki ticari SMS operatör kodları (örn: B001, B002, B214, B250...)
        // B-kodu varlığı tek başına spam değildir ancak kumar/bahis terimiyle birleştiğinde %99 spamdir.
        let bCodePattern = #"\bB\d{3}\b"#
        if let bCodeRegex = try? NSRegularExpression(pattern: bCodePattern, options: [.caseInsensitive]) {
            let range = NSRange(body.startIndex..<body.endIndex, in: body)
            let hasBCode = bCodeRegex.firstMatch(in: body, options: [], range: range) != nil
            
            if hasBCode {
                let bettingKeywords = ["oran", "kupon", "yatirim", "cevrim", "canli", "giris", "bonus", "kazanc"]
                for term in bettingKeywords {
                    if fullyNormalizedBody.contains(term) {
                        return .junk(reason: "B-kodu ve bahis terimi tespit edildi: '\(term)'")
                    }
                }
            }
        }
        
        // Eşleşme yoksa temiz mesaj
        return .allow(reason: "Herhangi bir spam kuralıyla eşleşmedi")
    }
}

