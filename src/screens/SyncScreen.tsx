import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { FilterRules, SyncInfo } from '../types';
import { RuleStorage } from '../services/RuleStorage';
import { AuditLogger, AuditLogEntry } from '../services/AuditLogger';

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

  // Yedekleme Modalı
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupJsonText, setBackupJsonText] = useState('');
  const [isImportMode, setIsImportMode] = useState(false);

  // Engelleme Geçmişi (Audit Logs)
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    loadStatus();
    loadLogs();
  }, []);

  const loadStatus = async () => {
    const info = await RuleStorage.getSystemStatus();
    setSyncInfo(info);
  };

  const loadLogs = async () => {
    const history = await AuditLogger.getLogs();
    setLogs(history);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await RuleStorage.syncRules(rules);
    setIsSyncing(false);

    await loadStatus();

    Alert.alert(
      result.success ? 'Başarılı' : 'Senkronizasyon Uyarısı',
      result.message
    );
  };

  const handleRequestAndroidRole = async () => {
    if (Platform.OS === 'android') {
      const granted = await RuleStorage.requestAndroidCallScreeningRole();
      if (granted) {
        Alert.alert('Yetki Verildi', 'Uygulama varsayılan arama filtresi olarak ayarlandı.');
      }
      await loadStatus();
    }
  };

  // MARK: - Yedekleme & İçe Aktarma
  const handleOpenExport = () => {
    const json = RuleStorage.exportRulesAsJson(rules);
    setBackupJsonText(json);
    setIsImportMode(false);
    setBackupModalVisible(true);
  };

  const handleOpenImport = () => {
    setBackupJsonText('');
    setIsImportMode(true);
    setBackupModalVisible(true);
  };

  const handleConfirmImport = async () => {
    const res = await RuleStorage.importRulesFromJson(backupJsonText);
    if (res.success && res.rules) {
      if (onUpdateRules) onUpdateRules(res.rules);
      setBackupModalVisible(false);
      Alert.alert('Başarılı', 'Kurallar başarıyla içe aktarıldı ve kaydedildi.');
    } else {
      Alert.alert('Hata', res.error || 'İçe aktarma başarısız oldu.');
    }
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Varsayılanlara Sıfırla',
      'Tüm kara liste, regex ve numara kuralları fabrika ayarlarına dönecektir. Devam etmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            const defaults = await RuleStorage.resetToDefaults();
            if (onUpdateRules) onUpdateRules(defaults);
            Alert.alert('Sıfırlandı', 'Tüm kurallar varsayılan değerlere döndürüldü.');
          },
        },
      ]
    );
  };

  const handleClearLogs = async () => {
    await AuditLogger.clearLogs();
    setLogs([]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Senkronizasyon Ana Kartı */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sistem Senkronizasyonu</Text>
        <Text style={styles.cardSubtitle}>
          Eklediğiniz veya değiştirdiğiniz kuralların iOS CallKit / Android CallScreening sistemine aktarılması için senkronizasyonu başlatın.
        </Text>

        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncingButton]}
          onPress={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#FFF" style={{ marginRight: 8 }} />
          ) : (
            <Text style={styles.syncIcon}>🔄</Text>
          )}
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Senkronize Ediliyor...' : 'Kuralları Senkronize Et'}
          </Text>
        </TouchableOpacity>

        {syncInfo.lastSyncDate && (
          <View style={styles.lastSyncRow}>
            <Text style={styles.lastSyncLabel}>Son Senkronizasyon:</Text>
            <Text style={styles.lastSyncValue}>
              {new Date(syncInfo.lastSyncDate).toLocaleTimeString()} -{' '}
              {new Date(syncInfo.lastSyncDate).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* İstatistikler */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aktif Kural Özeti</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>🚫 Kara Liste Kelimeleri:</Text>
          <Text style={styles.statValue}>{rules.blacklistKeywords.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>🛡️ Güvenli Liste (Whitelist):</Text>
          <Text style={styles.statValue}>{rules.whitelistKeywords.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>🔢 Regex Kalıpları:</Text>
          <Text style={styles.statValue}>{rules.regexPatterns.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>📞 Engellenen Ön Ekler:</Text>
          <Text style={styles.statValue}>{rules.blockedNumberPrefixes.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>📱 Özel Numaralar:</Text>
          <Text style={styles.statValue}>{rules.customBlockedNumbers.length}</Text>
        </View>
      </View>

      {/* Kural Yedekleme & İçe/Dışa Aktarma */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Kural Yedekleme ve Yönetim</Text>
        <Text style={styles.cardSubtitle}>
          Kendi filtrelerinizi JSON olarak dışa aktarabilir veya hazır bir kural listesini içe aktarabilirsiniz.
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.backupBtn} onPress={handleOpenExport}>
            <Text style={styles.backupBtnText}>📤 Dışa Aktar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.backupBtn, styles.importBtn]} onPress={handleOpenImport}>
            <Text style={styles.backupBtnText}>📥 İçe Aktar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetDefaults}>
          <Text style={styles.resetBtnText}>⚠️ Fabrika Varsayılanlarına Sıfırla</Text>
        </TouchableOpacity>
      </View>

      {/* Engelleme Geçmişi (Audit Logs) */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.cardTitle}>📋 Engelleme Geçmişi ({logs.length})</Text>
          {logs.length > 0 && (
            <TouchableOpacity onPress={handleClearLogs}>
              <Text style={{ fontSize: 12, color: '#DC2626', fontWeight: 'bold' }}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>

        {logs.length === 0 ? (
          <Text style={{ fontSize: 12, color: '#888', fontStyle: 'italic', marginVertical: 8 }}>
            Henüz engellenen veya simüle edilen bir olay kaydı bulunmuyor.
          </Text>
        ) : (
          logs.slice(0, 5).map((log) => (
            <View key={log.id} style={styles.logItem}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.logType}>
                  {log.type === 'SMS' ? '💬 SMS' : '📞 Arama'} - {log.senderOrNumber}
                </Text>
                <Text style={styles.logDate}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.logReason}>• {log.reason}</Text>
            </View>
          ))
        )}
      </View>

      {/* Platform Kurulum Rehberi */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {Platform.OS === 'ios' ? '📱 iOS Sistem Ayarları' : '🤖 Android Sistem Ayarları'}
        </Text>

        {Platform.OS === 'ios' ? (
          <View>
            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>1. SMS Filtresini Açma</Text>
              <Text style={styles.stepText}>
                Ayarlar → Mesajlar → Bilinmeyen ve İstenmeyen → Uygulamayı (SpamFilter) seçin ve aktif edin.
              </Text>
            </View>

            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>2. Arama Engellemeyi Açma</Text>
              <Text style={styles.stepText}>
                Ayarlar → Telefon → Arama Engelleme ve No. Belirleme → SpamFilter anahtarını açın.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>1. Varsayılan Çağrı Filtresi Rolü</Text>
              <Text style={styles.stepText}>
                Android'in aramaları otomatik meşgule atabilmesi için uygulamanın Çağrı Filtresi (Call Screening) olarak seçilmesi gerekir.
              </Text>

              <TouchableOpacity style={styles.roleBtn} onPress={handleRequestAndroidRole}>
                <Text style={styles.roleBtnText}>Arama Filtresi Yetkisini Ayarla</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepBox}>
              <Text style={styles.stepTitle}>2. SMS Okuma ve Bildirim İzni</Text>
              <Text style={styles.stepText}>
                Gelen SMS'leri yakalayıp analiz etmek için SMS okuma iznini onaylayın.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Yedekleme Modalı */}
      <Modal visible={backupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isImportMode ? '📥 Kuralları İçe Aktar' : '📤 Kuralları Dışa Aktar'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isImportMode
                ? 'Yedeklediğiniz JSON formatındaki kural setini buraya yapıştırın:'
                : 'Mevcut kural setinizin JSON çıktısı:'}
            </Text>

            <TextInput
              style={styles.modalInput}
              value={backupJsonText}
              onChangeText={setBackupJsonText}
              multiline
              editable={isImportMode}
              placeholder='{"blacklistKeywords": [...]}'
              placeholderTextColor="#999"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#E5E7EB' }]}
                onPress={() => setBackupModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#374151' }]}>Kapat</Text>
              </TouchableOpacity>

              {isImportMode && (
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#2563EB' }]}
                  onPress={handleConfirmImport}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Uygula</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  cardSubtitle: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 14 },
  syncButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncingButton: { backgroundColor: '#6B7280' },
  syncIcon: { fontSize: 18, marginRight: 8 },
  syncButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  lastSyncRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  lastSyncLabel: { fontSize: 12, color: '#888' },
  lastSyncValue: { fontSize: 12, fontWeight: '600', color: '#333' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statLabel: { fontSize: 14, color: '#374151' },
  statValue: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  backupBtn: { flex: 1, backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  importBtn: { backgroundColor: '#0D9488' },
  backupBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  resetBtn: { paddingVertical: 10, alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2' },
  resetBtnText: { color: '#DC2626', fontSize: 12, fontWeight: '600' },
  logItem: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6, marginBottom: 6 },
  logType: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' },
  logDate: { fontSize: 11, color: '#9CA3AF' },
  logReason: { fontSize: 11, color: '#DC2626', marginTop: 2 },
  stepBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  stepTitle: { fontSize: 13, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  stepText: { fontSize: 12, color: '#64748B', lineHeight: 16 },
  roleBtn: { marginTop: 8, backgroundColor: '#0284C7', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  roleBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 14, padding: 18 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#666', marginBottom: 10 },
  modalInput: { height: 180, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, fontFamily: 'Courier', fontSize: 12, textAlignVertical: 'top', color: '#111' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  modalBtnText: { fontWeight: 'bold', fontSize: 13 },
});
