import Foundation
import IdentityLookup
import os.log

/// IdentityLookup framework'ü ile gelen SMS'leri filtreleyen ve iOS 14+ alt kategorilerine ayıran sistem extension'ı
@objc(MessageFilterExtension)
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
        
        // iOS 14 ve üzeri için alt kategori (SubAction) belirleme:
        // Bu sayede Apple'ın 'Mesajlar' uygulamasında 'İşlemler (Banka)', 'Promosyonlar' ve 'İstenmeyen' sekmelerine ayrılır.
        switch verdict {
        case .junk(let reason):
            logger.notice("SPAM TESPİT EDİLDİ [JUNK] -> Sebep: \(reason, privacy: .public)")
            response.action = .junk
            
        case .allow(let reason):
            logger.info("TEMİZ MESAJ [NONE/ALLOW] -> Sebep: \(reason, privacy: .public)")
            
            // Eğer banka veya işlem mesajıysa iOS'un yerel "İşlemler / Transactions" klasörüne yönlendir
            if #available(iOS 14.0, *) {
                let lower = (messageBody ?? "").lowercased()
                if lower.contains("onay kodu") || lower.contains("sifre") || lower.contains("transfer") || lower.contains("ekstre") {
                    response.action = .transaction
                    if #available(iOS 16.0, *) {
                        response.subAction = .transactionalFinance
                    }
                } else if lower.contains("kargo") || lower.contains("teslim") || lower.contains("siparis") {
                    response.action = .transaction
                    if #available(iOS 16.0, *) {
                        response.subAction = .transactionalOrders
                    }
                } else if lower.contains("indirim") || lower.contains("firsat") || lower.contains("kampanya") {
                    response.action = .promotion
                    if #available(iOS 16.0, *) {
                        response.subAction = .promotionalOffers
                    }
                } else {
                    response.action = .none
                }
            } else {
                response.action = .none
            }
        }
        
        completion(response)
    }
}
