import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FilterRules, SyncInfo, DEFAULT_RULES } from '../types';
import { RuleStorage } from '../services/RuleStorage';

interface Props {
  rules: FilterRules;
  onUpdateRules?: (newRules: FilterRules) => void;
}

export const SyncScreen: React.FC<Props> = ({ rules, onUpdateRules }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({
    lastSyncDate: null,
    lastSyncStatus: null,
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const info = await RuleStorage.getSystemStatus();
      setSyncInfo(info);
    } catch (e) {
      console.error('Senkronizasyon durumu alınamadı:', e);
    }
  };

  const handleSyncCallKit = async () => {
    setIsSyncing(true);
    try {
      const result = await RuleStorage.syncRules(rules);
      Alert.alert('✅ Sistem Eşitlendi', result.message || 'Kurallar Apple CallKit motoruna başarıyla aktarıldı.');
      await loadStatus();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'CallKit senkronizasyonu tamamlanamadı.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Varsayılanlara Sıfırla',
      'Tüm kara liste, engelli numaralar ve whitelist kuralları fabrika ayarlarına sıfırlanacak. Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            if (onUpdateRules) {
              onUpdateRules(DEFAULT_RULES);
            }
            await RuleStorage.saveRules(DEFAULT_RULES);
            Alert.alert('Tamamlandı', 'Kurallar varsayılan haline döndürüldü.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. KRİTİK iOS MESAJ FİLTRESİ AKTİF ETME REHBERİ */}
      <View style={styles.guideCard}>
        <View style={styles.guideHeader}>
          <Text style={styles.guideIcon}>📱</Text>
          <View style={styles.guideHeaderText}>
            <Text style={styles.guideTitle}>iOS Mesajlar Filtresini Açma Rehberi</Text>
            <Text style={styles.guideSub}>Apple Ayarlarından uygulamanızı aktif edin</Text>
          </View>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 <Text style={{ fontWeight: '800' }}>Apple Gizlilik Standardı:</Text> iOS kuralları gereği hiçbir 3. parti uygulama kişisel gelen kutunuza doğrudan erişemez. Filtreleme, Apple Mesajlar uygulamasının arka planında yerel olarak gerçekleşir.
          </Text>
        </View>

        {/* Adım Adım Kurulum */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Ayarlar ➔ Mesajlar Menüsüne Gidin</Text>
              <Text style={styles.stepDesc}>iPhone Ayarlar uygulamasını açın ve Mesajlar sayfasına girin.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Bilinmeyen ve İstenmeyen Bölümünü Açın</Text>
              <Text style={styles.stepDesc}>Sayfayı aşağı kaydırıp "Bilinmeyenleri Filtrele" seçeneğine dokunun.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>SpamFilter Seçeneğini İşaretleyin</Text>
              <Text style={styles.stepDesc}>SMS Filtreleme listesinde "SpamFilter" uygulamasını seçerek aktif edin.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Arama Engelleme İznini Verin</Text>
              <Text style={styles.stepDesc}>Ayarlar ➔ Telefon ➔ Arama Engelleme ve No. Belirleme sayfasından SpamFilter'ı açın.</Text>
            </View>
          </View>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipText}>
            💡 <Text style={{ fontWeight: '700' }}>Önemli Not:</Text> Uygulama yeni yüklendiğinde iOS eklentiyi tanımak için uygulamanın en az bir kez açılmış olmasını bekler. Eski sürüm varsa silip yeni IPA'yı kurmanız önerilir.
          </Text>
        </View>
      </View>

      {/* 2. CALLKIT VE SISTEM SENKRONIZASYONU */}
      <Text style={styles.sectionLabel}>APPLE ÇAĞRI VE KURAL EŞİTLEME</Text>
      <View style={styles.syncCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Son Sistem Eşitlemesi:</Text>
          <Text style={styles.statusValue}>
            {syncInfo.lastSyncDate
              ? new Date(syncInfo.lastSyncDate).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Henüz yapılmadı'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.syncBtn}
          onPress={handleSyncCallKit}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#090D16" />
          ) : (
            <Text style={styles.syncBtnText}>🔄 Apple CallKit & SMS Veritabanını Eşitle</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. VERİ YÖNETİMİ VE SIFIRLAMA */}
      <Text style={styles.sectionLabel}>VERİTABANI VE YÖNETİM</Text>
      <View style={styles.managementCard}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleResetDefaults}>
          <Text style={styles.resetBtnText}>⚠️ Kural Veritabanını Fabrika Ayarlarına Döndür</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 16, paddingBottom: 40 },
  guideCard: {
    backgroundColor: '#121B2E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  guideHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  guideIcon: { fontSize: 28, marginRight: 12 },
  guideHeaderText: { flex: 1 },
  guideTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  guideSub: { fontSize: 11, color: '#38BDF8', marginTop: 2, fontWeight: '600' },
  privacyNote: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  privacyText: { fontSize: 12, color: '#BAE6FD', lineHeight: 18 },
  stepsContainer: { gap: 12 },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  stepNumText: { color: '#090D16', fontWeight: '800', fontSize: 12 },
  stepContent: { flex: 1 },
  stepHeading: { fontSize: 13, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  stepDesc: { fontSize: 11, color: '#64748B', lineHeight: 16 },
  tipBox: {
    marginTop: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tipText: { fontSize: 11, color: '#FDE68A', lineHeight: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  syncCard: {
    backgroundColor: '#121B2E',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  statusLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  statusValue: { fontSize: 13, color: '#10B981', fontWeight: '700' },
  syncBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnText: { color: '#090D16', fontWeight: '800', fontSize: 14 },
  managementCard: {
    backgroundColor: '#121B2E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  resetBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  resetBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
});
