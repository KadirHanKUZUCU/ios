#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SpamFilterBridge, NSObject)

RCT_EXTERN_METHOD(saveRulesToSharedStorage:(NSString *)rulesJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(syncCallDirectory:(NSString *)rulesJson
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCallDirectoryStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

