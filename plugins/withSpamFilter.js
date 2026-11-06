const { withAndroidManifest, withEntitlementsPlist, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: Android İzinleri, CallScreeningService ve SmsReceiver ekler
 * iOS tarafında ise App Groups entitlements tanımlar.
 */
function withSpamFilterPlugin(config) {
  // 1. Android Manifest Yapılandırması
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // İzinler
    const permissions = [
      'android.permission.RECEIVE_SMS',
      'android.permission.READ_PHONE_STATE',
      'android.permission.ANSWER_PHONE_CALLS',
      'android.permission.CALL_SCREENING_APP',
    ];

    if (!config.modResults.manifest['uses-permission']) {
      config.modResults.manifest['uses-permission'] = [];
    }

    permissions.forEach((perm) => {
      const exists = config.modResults.manifest['uses-permission'].some(
        (p) => p.$['android:name'] === perm
      );
      if (!exists) {
        config.modResults.manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    });

    // CallScreeningService Tanımı
    if (!mainApplication.service) mainApplication.service = [];
    const hasScreeningService = mainApplication.service.some(
      (s) => s.$['android:name'] === '.SpamCallScreeningService'
    );
    if (!hasScreeningService) {
      mainApplication.service.push({
        $: {
          'android:name': '.SpamCallScreeningService',
          'android:permission': 'android.permission.BIND_SCREENING_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: { 'android:name': 'android.telecom.CallScreeningService' },
              },
            ],
          },
        ],
      });
    }

    // SmsReceiver Tanımı
    if (!mainApplication.receiver) mainApplication.receiver = [];
    const hasSmsReceiver = mainApplication.receiver.some(
      (r) => r.$['android:name'] === '.SpamSmsReceiver'
    );
    if (!hasSmsReceiver) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.SpamSmsReceiver',
          'android:permission': 'android.permission.BROADCAST_SMS',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            $: { 'android:priority': '999' },
            action: [
              {
                $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  // 2. iOS App Groups Entitlements Yapılandırması
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      'group.com.app.spamfilter',
    ];
    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(withSpamFilterPlugin, 'withSpamFilter', '1.0.0');

