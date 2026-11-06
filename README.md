# SpamFilter - Cross-Platform (Expo + iOS CallKit & IdentityLookup + Android CallScreening)

Bu proje; **Windows bilgisayar** üzerinden geliştirilip hem **iPhone (iOS)** hem de **Android (Google Play)** cihazlarda aktif istenmeyen çağrı ve SMS engellemesi yapacak şekilde hibrit/çapraz platform (Cross-Platform) mimaride tasarlanmıştır.

---

## ⚡ Windows'ta Olup iPhone'da Çalıştırmanın Sırrı: EAS Build

Apple, sistem düzeyinde arama ve SMS engellemeyi (`CallKit` ve `IdentityLookup`) yalnızca **yerel sistem eklentileri (App Extensions)** ile destekler. Bu sebeple standart **Expo Go** içinde bu eklentiler çalışamaz (Expo Go'nun içinde CallKit derlenmemiştir).

**Fakat Windows kullanmanız buna engel değildir!**
Expo'nun **EAS Build (Expo Application Services)** bulut derleme altyapısı sayesinde:
- Windows'tan kodunuzu yazarsınız.
- Mac satın almanıza veya sanal makine kurmanıza gerek kalmaz.
- Tek bir komutla (`eas build --platform ios`) projeniz buluttaki macOS sunucularında derlenir.
- Oluşan QR kodu kendi **fiziksel iPhone'unuzun kamerasıyla** okutarak uygulamayı doğrudan telefonunuza kurarsınız!

Aynı şekilde `eas build --platform android` ile Google Play Store için doğrudan `.aab` veya test için `.apk` çıktısı alırsınız.

---

## 🏗 Mimari Yapı

```
iphoneADS/
├── App.tsx                              # React Native / Expo Ana Arayüz (5 Sekmeli Tasarım)
├── app.json                             # Expo & Plugin yapılandırması
├── eas.json                             # iOS ve Android bulut derleme profilleri
├── package.json                         # Bağımlılıklar (React Native 0.76, Expo 52)
│
├── src/                                 # Çapraz Platform Uygulama Katmanı
│   ├── types/index.ts                   # Kural modelleri ve varsayılan ayarlar
│   ├── services/
│   │   ├── MessageNormalizer.ts         # Türkçe karakter ve Leetspeak temizleme motoru
│   │   └── RuleStorage.ts               # AsyncStorage & Native Bridge köprüsü
│   └── screens/
│       ├── KeywordsScreen.tsx           # Kara Liste ve Güvenli Liste (Whitelist)
│       ├── RegexScreen.tsx              # Kısa linkler ve regex deseni yönetimi
│       ├── PhoneNumbersScreen.tsx       # Ön ekler (+90375, +90729) ve özel numaralar
│       ├── SimulatorScreen.tsx          # Canlı SMS & Leetspeak Test Laboratuvarı
│       └── SyncScreen.tsx               # Sistem senkronizasyonu ve izin rehberi
│
├── plugins/
│   └── withSpamFilter.js                # Expo Config Plugin (Android manifest & iOS App Groups)
│
├── CallDirectoryExtension/              # iOS CallKit Eklentisi (Swift)
│   ├── CallDirectoryHandler.swift       # CXCallDirectoryProvider (Kesin artan sıralı Int64)
│   ├── SpamNumberProvider.swift         # Numara tekilleştirme ve bellek yönetimi
│   └── Info.plist                       # com.apple.callkit.call-directory
│
├── MessageFilterExtension/              # iOS SMS Filtresi Eklentisi (Swift)
│   ├── MessageFilterExtension.swift     # ILMessageFilterQueryHandling (Junk / Allow)
│   ├── MessageNormalizer.swift          # Swift tabanlı Leetspeak motoru
│   └── Info.plist                       # com.apple.identitylookup.message-filter
│
├── android-native/                      # Android Sistem Servisleri (Kotlin)
│   ├── SpamCallScreeningService.kt      # Android CallScreeningService (Aramaları meşgule atma)
│   ├── SpamSmsReceiver.kt               # Gelen SMS BroadcastReceiver ve uyarı motoru
│   └── SpamFilterBridgeModule.kt        # React Native köprüsü
│
└── ios-native/                          # iOS React Native Köprüsü
    ├── SpamFilterBridge.swift           # reloadExtension & UserDefaults tetikleyicisi
    └── SpamFilterBridge.m               # Objective-C export modülü
```

---

## 🚀 Windows Üzerinden Geliştirme ve Test Adımları

### 1. Arayüzü ve Kural Test Laboratuvarını Hemen Başlatma
Proje dizininde:
```bash
npm.cmd start
```
- Tarayıcıda test etmek için terminalde `w` (Web) tuşuna basabilirsiniz.
- Expo Go ile iPhone'unuzda test etmek için ekrandaki QR kodu Expo Go uygulamasıyla okutabilirsiniz. (Arayüz, kural ekleme/çıkarma ve **Test Laboratuvarı** sekmesindeki simülasyon Expo Go'da anında çalışır!)

### 2. iPhone'a Gerçek CallKit & SMS Filtresiyle Kurulum (EAS Build)
Windows bilgisayarınızda bir defaya mahsus:

1. Ücretsiz bir Expo hesabı açın (expo.dev).
2. EAS CLI ile giriş yapın:
   ```bash
   npx.cmd eas-cli login
   ```
3. Projeyi yapılandırın:
   ```bash
   npx.cmd eas-cli project:init
   ```
4. iOS Development Build başlatın:
   ```bash
   npx.cmd eas-cli build --profile development --platform ios
   ```
5. Derleme tamamlandığında terminalde bir link ve QR kod çıkacaktır. iPhone'unuzun kamerasıyla QR kodu okutup uygulamayı cihazınıza yükleyin!

### 3. Android / Google Play İçin Derleme Alma
- Test APK'sı almak için:
  ```bash
  npx.cmd eas-cli build --profile preview --platform android
  ```
- Google Play Store için AAB paketi almak için:
  ```bash
  npx.cmd eas-cli build --profile production --platform android
  ```

---

## 📱 Cihazlarda Etkinleştirme Rehberi

### iPhone (iOS):
1. **SMS Filtresi:** `Ayarlar > Mesajlar > Bilinmeyen ve İstenmeyen > SpamFilter` seçin ve açın.
2. **Çağrı Engelleme:** `Ayarlar > Telefon > Arama Engelleme ve No. Belirleme > SpamFilter` anahtarını aktif edin.
3. Uygulamayı açıp **Senkron** sekmesinden **"Kuralları Senkronize Et"** butonuna basın.

### Android (Google Play):
1. Uygulamayı açın ve **Senkron** sekmesine gidin.
2. **"Arama Filtresi Yetkisini Ayarla"** butonuna basarak uygulamayı varsayılan `Çağrı Filtresi (Call Screening App)` olarak seçin.
3. SMS izin isteği çıktığında onaylayın.
