import Foundation

/// SMS metinlerini normalleştiren, Türkçe karakter ve leetspeak temizliği yapan motor
public struct MessageNormalizer {
    
    // Leetspeak harita tablosu
    private static let leetMap: [Character: Character] = [
        "0": "o",
        "1": "i",
        "!": "i",
        "|": "i",
        "3": "e",
        "4": "a",
        "@": "a",
        "5": "s",
        "$": "s",
        "7": "t",
        "8": "b"
    ]
    
    // Türkçe özel karakter dönüştürme tablosu (ASCII eşleniğine indirgeme)
    private static let turkishDiacriticsMap: [Character: Character] = [
        "ç": "c", "Ç": "c",
        "ğ": "g", "Ğ": "g",
        "ı": "i", "I": "i",
        "İ": "i", "i": "i",
        "ö": "o", "Ö": "o",
        "ş": "s", "Ş": "s",
        "ü": "u", "Ü": "u"
    ]
    
    /// Verilen metni adım adım normalleştirerek spam analizine hazır hale getirir
    public static func normalize(_ text: String) -> String {
        guard !text.isEmpty else { return "" }
        
        // 1. Adım: Görünmez ve sıfır genişlikli karakterleri (zero-width spaces vb.) kaldır
        var cleaned = stripZeroWidthCharacters(text)
        
        // 2. Adım: Türkçe yerel ayarıyla küçült
        cleaned = cleaned.lowercased(with: Locale(identifier: "tr_TR"))
        
        // 3. Adım: Türkçe aksan ve yumuşak karakterleri sadeleştir
        cleaned = stripTurkishDiacritics(cleaned)
        
        // 4. Adım: Harfler arasına gizlenmiş ayraçları temizle (örnek: "f-r-e-e-s-p-i-n" -> "freespin")
        cleaned = collapseSpacedOrHyphenatedWords(cleaned)
        
        // 5. Adım: Leetspeak dönüşümlerini uygula ("b0nus" -> "bonus", "c4sino" -> "casino")
        cleaned = replaceLeetspeak(cleaned)
        
        return cleaned
    }
    
    /// Görünmez karakterleri ve gereksiz unicode kontrol sembollerini temizler
    private static func stripZeroWidthCharacters(_ text: String) -> String {
        let invisibleCharacters: [Character] = [
            "\u{200B}", // Zero-width space
            "\u{200C}", // Zero-width non-joiner
            "\u{200D}", // Zero-width joiner
            "\u{FEFF}", // Zero-width no-break space
            "\u{00AD}", // Soft hyphen
            "\u{2060}"  // Word joiner
        ]
        return text.filter { !invisibleCharacters.contains($0) }
    }
    
    /// Türkçe karakterleri sadeleştirir
    private static func stripTurkishDiacritics(_ text: String) -> String {
        var result = ""
        result.reserveCapacity(text.count)
        for char in text {
            if let mapped = turkishDiacriticsMap[char] {
                result.append(mapped)
            } else {
                result.append(char)
            }
        }
        return result
    }
    
    /// Harf aralarına kasıtlı konulan tire, nokta, alt çizgi veya boşlukları birleştirir
    /// Örn: "f-r-e-e-s-p-i-n", "b.o.n.u.s", "c a s i n o"
    private static func collapseSpacedOrHyphenatedWords(_ text: String) -> String {
        // Regex: Tek harfler arasına gelen tekil ayraç kalıbını tespit edip birleştirir
        // Örn: (?<=[a-z0-9])[ \.\-\_\*](?=[a-z0-9])
        let pattern = #"(?<=[a-z0-9])[ \.\-\_\*\~](?=[a-z0-9])"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: []) else {
            return text
        }
        
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        // İki harf arasındaki tek ayraçları silerek kelimeyi bitişik hale getiriyoruz
        return regex.stringByReplacingMatches(in: text, options: [], range: range, withTemplate: "")
    }
    
    /// Leetspeak karakterlerini harfe çevirir ("b0nus" -> "bonus", "c4sino" -> "casino")
    private static func replaceLeetspeak(_ text: String) -> String {
        var result = ""
        result.reserveCapacity(text.count)
        for char in text {
            if let mapped = leetMap[char] {
                result.append(mapped)
            } else {
                result.append(char)
            }
        }
        return result
    }
}

