import Foundation
import CallKit
import os.log

/// CallKit framework'ü ile gelen çağrıları engelleyen ve tanımlayan extension sağlayıcısı
@objc(CallDirectoryHandler)
final class CallDirectoryHandler: CXCallDirectoryProvider {
    
    private let logger = Logger(subsystem: "com.app.spamfilter.CallDirectory", category: "CallProvider")
    
    // MARK: - CXCallDirectoryProvider Yaşam Döngüsü
    
    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self
        logger.info("CallDirectoryHandler istek başladı. isIncremental: \(context.isIncremental)")
        
        // App Groups üzerinden en güncel kuralları oku
        let rules = SharedDataManager.shared.loadRules()
        
        do {
            if context.isIncremental {
                // Artımlı güncelleme (incremental)
                try addOrRemoveIncrementalEntries(to: context, rules: rules)
            } else {
                // Sıfırdan tam senkronizasyon (full reload)
                try addAllBlockingPhoneNumbers(to: context, rules: rules)
                try addAllIdentificationPhoneNumbers(to: context)
            }
            
            logger.info("CallDirectoryHandler kuralları başarıyla yüklendi.")
            context.completeRequest()
            
        } catch {
            logger.error("CallDirectoryHandler hata ile karşılaştı: \(error.localizedDescription)")
            context.cancelRequest(withError: error)
        }
    }
    
    // MARK: - Tüm Engellenecek Numaraları Ekleme (Full Reload)
    
    private func addAllBlockingPhoneNumbers(
        to context: CXCallDirectoryExtensionContext,
        rules: FilterRules
    ) throws {
        let sortedNumbers = SpamNumberProvider.getBlockingPhoneNumbers(from: rules)
        logger.info("Engellenecek toplam numara adedi: \(sortedNumbers.count)")
        
        var lastPhoneNumber: CXCallDirectoryPhoneNumber = 0
        
        // Bellek sızıntılarını önlemek için autoreleasepool içinde döngü
        for phoneNumber in sortedNumbers {
            // CALLKIT KRİTİK KURALI: Sıralı ve eşsiz olmalı (phoneNumber > lastPhoneNumber)
            guard phoneNumber > lastPhoneNumber else {
                logger.warning("Atlandı (sıralama kuralı ihlali veya mükerrer): \(phoneNumber) <= \(lastPhoneNumber)")
                continue
            }
            
            context.addBlockingEntry(withNextSequentialPhoneNumber: phoneNumber)
            lastPhoneNumber = phoneNumber
        }
    }
    
    // MARK: - Arayan Kimliği Tanımlama (Caller ID)
    
    private func addAllIdentificationPhoneNumbers(
        to context: CXCallDirectoryExtensionContext
    ) throws {
        let identificationEntries = SpamNumberProvider.getIdentificationEntries()
        logger.info("Tanımlanacak (Caller ID) toplam numara adedi: \(identificationEntries.count)")
        
        var lastPhoneNumber: CXCallDirectoryPhoneNumber = 0
        
        for entry in identificationEntries {
            guard entry.phoneNumber > lastPhoneNumber else {
                logger.warning("Atlandı (kimlik sıralama ihlali veya mükerrer): \(entry.phoneNumber) <= \(lastPhoneNumber)")
                continue
            }
            
            context.addIdentificationEntry(
                withNextSequentialPhoneNumber: entry.phoneNumber,
                label: entry.label
            )
            lastPhoneNumber = entry.phoneNumber
        }
    }
    
    // MARK: - Artımlı Senkronizasyon (Incremental Updates)
    
    private func addOrRemoveIncrementalEntries(
        to context: CXCallDirectoryExtensionContext,
        rules: FilterRules
    ) throws {
        // Artımlı güncellemede basitlik ve veri bütünlüğü adına tüm engellemeleri ve kimlikleri
        // temizleyip güncel listeyi sıfırdan eklemek en kararlı yöntemdir.
        context.removeAllBlockingEntries()
        context.removeAllIdentificationEntries()
        
        try addAllBlockingPhoneNumbers(to: context, rules: rules)
        try addAllIdentificationPhoneNumbers(to: context)
    }
}

// MARK: - CXCallDirectoryExtensionContextDelegate

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {
        logger.error("CallDirectory extension isteği başarısız oldu: \(error.localizedDescription)")
    }
}

