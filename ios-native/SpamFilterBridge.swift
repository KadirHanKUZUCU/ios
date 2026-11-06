import Foundation
import CallKit
import React

@objc(SpamFilterBridge)
class SpamFilterBridge: NSObject {

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(saveRulesToSharedStorage:resolver:rejecter:)
    func saveRulesToSharedStorage(
        _ rulesJson: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let data = rulesJson.data(using: .utf8),
              let rules = try? JSONDecoder().decode(FilterRules.self, from: data) else {
            reject("INVALID_JSON", "Kural verisi ayrıştırılamadı.", nil)
            return
        }

        SharedDataManager.shared.saveRules(rules)
        resolve(true)
    }

    @objc(syncCallDirectory:resolver:rejecter:)
    func syncCallDirectory(
        _ rulesJson: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        // Önce kuralları kaydet
        if let data = rulesJson.data(using: .utf8),
           let rules = try? JSONDecoder().decode(FilterRules.self, from: data) {
            SharedDataManager.shared.saveRules(rules)
        }

        // CallKit extension'ını yeniden yükle
        CXCallDirectoryManager.sharedInstance.reloadExtension(
            withIdentifier: AppGroupConstants.callDirectoryExtensionId
        ) { error in
            if let error = error {
                reject("RELOAD_ERROR", error.localizedDescription, error)
            } else {
                resolve(["message": "Kurallar başarıyla CallKit sistemine yüklendi."])
            }
        }
    }

    @objc(getCallDirectoryStatus:rejecter:)
    func getCallDirectoryStatus(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension(
            withIdentifier: AppGroupConstants.callDirectoryExtensionId
        ) { status, error in
            if let error = error {
                reject("STATUS_ERROR", error.localizedDescription, error)
                return
            }

            switch status {
            case .enabled:
                resolve("enabled")
            case .disabled:
                resolve("disabled")
            case .unknown:
                resolve("unknown")
            @unknown default:
                resolve("unknown")
            }
        }
    }
}

