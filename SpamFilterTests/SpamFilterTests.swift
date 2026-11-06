import XCTest
@testable import SpamFilter

final class SpamFilterTests: XCTestCase {
    
    // MARK: - 1. Metin Normalizasyonu ve Leetspeak Testleri
    
    func testTurkishDiacriticsRemoval() {
        let input = "ŞİFRE ÇIKIŞ ÖZEL GÜNCELLEME IĞDIR"
        let normalized = MessageNormalizer.normalize(input)
        XCTAssertEqual(normalized, "sifre cikis ozel guncelleme igdir")
    }
    
    func testLeetspeakDecoding() {
        let input = "b0nus ve c4sino ile 5lot oyunlari"
        let normalized = MessageNormalizer.normalize(input)
        XCTAssertTrue(normalized.contains("bonus"))
        XCTAssertTrue(normalized.contains("casino"))
        XCTAssertTrue(normalized.contains("slot"))
    }
    
    func testHyphenatedAndSpacedWordCollapsing() {
        let input = "f-r-e-e-s-p-i-n ve d.i.s.c.o.u.n.t firsati"
        let normalized = MessageNormalizer.normalize(input)
        XCTAssertTrue(normalized.contains("freespin"))
        XCTAssertTrue(normalized.contains("discount"))
    }
    
    func testZeroWidthSpaceStripping() {
        let invisibleChar: Character = "\u{200B}"
        let input = "b\(invisibleChar)o\(invisibleChar)n\(invisibleChar)u\(invisibleChar)s"
        let normalized = MessageNormalizer.normalize(input)
        XCTAssertEqual(normalized, "bonus")
    }
    
    // MARK: - 2. SMS Kural Motoru (SpamRuleEngine) Testleri
    
    func testWhitelistPriorityOverSpamKeywords() {
        let rules = FilterRules()
        // Mesajda hem spam benzeri kelimeler hem de onay kodu geçiyorsa whitelist kazanmalıdır
        let smsBody = "Banka Isleminiz: 894521 nolu onay kodu ile transfer tamamlanacaktir. Sifrenizi kimseyle paylasmayiniz."
        let verdict = SpamRuleEngine.evaluate(sender: "GARANTI", messageBody: smsBody, rules: rules)
        
        switch verdict {
        case .allow:
            XCTAssertTrue(true, "Banka onay kodu içeren mesaj başarıyla izin aldı.")
        case .junk(let reason):
            XCTFail("Banka doğrulama mesajı hatalı şekilde junk yapıldı! Sebep: \(reason)")
        }
    }
    
    func testBlacklistKeywordDetection() {
        let rules = FilterRules()
        let smsBody = "Hesabiniza 500 TL yatirima ek freespin tanimlandi! Hemen giris yap: norabahis"
        let verdict = SpamRuleEngine.evaluate(sender: "+905320000000", messageBody: smsBody, rules: rules)
        
        switch verdict {
        case .junk:
            XCTAssertTrue(true, "Spam kelimeleri içeren SMS başarıyla engellendi.")
        case .allow:
            XCTFail("Spam SMS yakalanamadı!")
        }
    }
    
    func testShortenedURLRegexDetection() {
        let rules = FilterRules()
        let smsBody = "Ödüllü turnuva basladi! Katilmak icin: https://bit.ly/turnuva2024"
        let verdict = SpamRuleEngine.evaluate(sender: "+905320000000", messageBody: smsBody, rules: rules)
        
        switch verdict {
        case .junk(let reason):
            XCTAssertTrue(reason.contains("Regex") || reason.contains("Kara liste"))
        case .allow:
            XCTFail("Kısaltılmış link regex'i yakalayamadı!")
        }
    }
    
    func testBCodeWithBettingTermsDetection() {
        let rules = FilterRules()
        let smsBody = "Gunun en yuksek kupon orani burada. B214"
        let verdict = SpamRuleEngine.evaluate(sender: "SMS-INFO", messageBody: smsBody, rules: rules)
        
        switch verdict {
        case .junk(let reason):
            XCTAssertTrue(reason.contains("B-kodu"))
        case .allow:
            XCTFail("B-kodu ve bahis terimi kombinasyonu yakalanamadı!")
        }
    }
    
    func testCleanNormalSMSIsNotJunk() {
        let rules = FilterRules()
        let smsBody = "Selam Ahmet, yarın öğlen yemekte buluşuyor muyuz?"
        let verdict = SpamRuleEngine.evaluate(sender: "+905551234567", messageBody: smsBody, rules: rules)
        
        switch verdict {
        case .allow:
            XCTAssertTrue(true, "Temiz arkadaş mesajına doğru şekilde izin verildi.")
        case .junk:
            XCTFail("Normal temiz SMS yanlışlıkla junk yapıldı!")
        }
    }
    
    // MARK: - 3. CallKit Sıralama ve Tekillik Testleri
    
    func testCallKitStrictlyAscendingOrder() {
        var rules = FilterRules()
        rules.customBlockedNumbers = [
            "905559998877",
            "903750000005",
            "907290000010",
            "903750000001",
            "905559998877" // Kasıtlı mükerrer
        ]
        
        let sortedNumbers = SpamNumberProvider.getBlockingPhoneNumbers(from: rules)
        
        // Boş olmamalı
        XCTAssertFalse(sortedNumbers.isEmpty)
        
        // Kesin artan sıra testi: n[i] < n[i+1]
        for i in 0..<(sortedNumbers.count - 1) {
            let current = sortedNumbers[i]
            let next = sortedNumbers[i + 1]
            XCTAssertLessThan(current, next, "CallKit kural ihlali: \(current) >= \(next). Liste kesin artan sırada olmalıdır!")
        }
    }
    
    func testPhoneNumberSanitization() {
        let raw = "+90 (532) 123-4567"
        let sanitized = SharedDataManager.shared.sanitizePhoneNumber(raw)
        XCTAssertEqual(sanitized, "905321234567")
        
        let localWithZero = "05321234567"
        let sanitizedLocal = SharedDataManager.shared.sanitizePhoneNumber(localWithZero)
        XCTAssertEqual(sanitizedLocal, "905321234567")
    }
}

