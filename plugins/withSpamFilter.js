const {
  withAndroidManifest,
  withEntitlementsPlist,
  withDangerousMod,
  withXcodeProject,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withSpamFilterPlugin(config) {
  // ==========================================
  // 1. ANDROID MANIFEST & KOTLIN DOSYALARI
  // ==========================================
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];

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
    const hasScreening = mainApplication.service.some(
      (s) => s.$['android:name'] === '.SpamCallScreeningService'
    );
    if (!hasScreening) {
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
    const hasReceiver = mainApplication.receiver.some(
      (r) => r.$['android:name'] === '.SpamSmsReceiver'
    );
    if (!hasReceiver) {
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

  // Android Kotlin Dosyalarını Hedef Projeye Kopyalama
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const androidSrc = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/com/app/spamfilter'
      );
      const localAndroidNative = path.join(config.modRequest.projectRoot, 'android-native');

      if (fs.existsSync(localAndroidNative)) {
        fs.mkdirSync(androidSrc, { recursive: true });
        const files = fs.readdirSync(localAndroidNative);
        for (const file of files) {
          fs.copyFileSync(
            path.join(localAndroidNative, file),
            path.join(androidSrc, file)
          );
        }
      }
      return config;
    },
  ]);

  // ==========================================
  // 2. iOS APP GROUPS & EXTENSION DOSYALARI
  // ==========================================
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      'group.com.app.spamfilter',
    ];
    return config;
  });

  // iOS Extension Dosyalarını ios/ Dizinine Kopyalama
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;
      const projectRoot = config.modRequest.projectRoot;

      const extensions = ['MessageFilterExtension', 'CallDirectoryExtension'];

      for (const ext of extensions) {
        const srcExt = path.join(projectRoot, ext);
        const destExt = path.join(iosRoot, ext);

        if (fs.existsSync(srcExt)) {
          fs.mkdirSync(destExt, { recursive: true });
          const files = fs.readdirSync(srcExt);
          for (const file of files) {
            fs.copyFileSync(path.join(srcExt, file), path.join(destExt, file));
          }

          // Shared klasöründeki yardımcıları extension içine de kopyala
          const sharedDir = path.join(projectRoot, 'SpamFilter/Shared');
          if (fs.existsSync(sharedDir)) {
            const sharedFiles = fs.readdirSync(sharedDir);
            for (const sFile of sharedFiles) {
              fs.copyFileSync(path.join(sharedDir, sFile), path.join(destExt, sFile));
            }
          }
        }
      }

      return config;
    },
  ]);

  return config;
}

module.exports = createRunOncePlugin(withSpamFilterPlugin, 'withSpamFilter', '1.0.0');
