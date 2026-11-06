import Foundation
import IdentityLookup
import os.log

/// IdentityLookup framework'ü ile gelen SMS'leri filtreleyen sistem extension'ı
final class MessageFilterExtension: ILMessageFilterExtension, ILMessageFilterQueryHandling {
    
    private let logger = Logger(subsystem: "com.app.spamfilter.MessageFilter", category: "SMSFilter")
    
    // MARK: - ILMessageFilterQueryHandling
    
    /// iOS tarafından her SMS alındığında tetiklenen ana metot
    func handle(
        _ queryRequest: ILMessageFilterQueryRequest,
        context: ILMessageFilterExtensionContext,
        completion: @escaping (ILMessageFilterQueryResponse) -> Void
    ) {
        let sender = queryRequest.sender
        let messageBody = queryRequest.messageBody
        
        logger.info("SMS filtresi tetiklendi. Gönderen: \(sender ?? "Bilinmiyor", privacy: .public)")
        
        // 1. App Group üzerinden güncel kural setini yükle
        let rules = SharedDataManager.shared.loadRules()
        
        // 2. Kural motorunda analiz et
        let verdict = SpamRuleEngine.evaluate(
            sender: sender,
            messageBody: messageBody,
            rules: rules
        )
        
        // 3. Yanıtı hazırla
        let response = ILMessageFilterQueryResponse()
        
        switch verdict {
        case .junk(let reason):
            logger.notice("SPAM TESPİT EDİLDİ [JUNK] -> Sebep: \(reason, privacy: .public)")
            response.action = .junk
            
        case .allow(let reason):
            logger.info("TEMİZ MESAJ [NONE] -> Sebep: \(reason, privacy: .public)")
            response.action = .none
        }
        
        completion(response)
    }
}

