import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { FilterRules, SpamCategory } from '../types';
import { SpamReportService } from '../services/SpamReportService';

interface Props {
  rules: FilterRules;
  onUpdateRules?: (newRules: FilterRules) => void;
}

export const ReportSpamScreen: React.FC<Props> = ({ rules, onUpdateRules }) => {
  const [reportType, setReportType] = useState<'SMS' | 'CALL'>('SMS');
  const [senderOrNumber, setSenderOrNumber] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [category, setCategory] = useState<SpamCategory>('BETTING');
  const [consentGranted, setConsentGranted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const consent = await SpamReportService.getConsentSettings();
      setConsentGranted(consent.crowdsourceConsent);
    })();
  }, []);

  const handleToggleConsent = async (val: boolean) => {
    setConsentGranted(val);
    await SpamReportService.setConsent(val);
  };

  const categories: { label: string; value: SpamCategory; icon: string }[] = [
    { label: 'Yasadışı Bahis', value: 'BETTING', icon: '🎰' },
    { label: 'Sahte Link / Oltalama', value: 'PHISHING', icon: '🎣' },
    { label: 'Sanal Santral / Robot', value: 'SCAM_CALL', icon: '🤖' },
    { label: 'Agresif Pazarlama', value: 'AGGRESSIVE_MARKETING', icon: '📢' },
    { label: 'Diğer', value: 'OTHER', icon: '❓' },
  ];

  const handleSubmit = async () => {
    const trimmedTarget = senderOrNumber.trim();
    if (!trimmedTarget) {
      Alert.alert('Eksik Bilgi', reportType === 'SMS' ? 'Lütfen gönderen başlığını veya numarasını yazın.' : 'Lütfen arayan numarayı yazın.');
      return;
    }

    if (reportType === 'SMS' && !messageBody.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen gelen şüpheli SMS metnini yapıştırın.');
      return;
    }

    setIsSubmitting(true);
    const result = await SpamReportService.submitReport(
      reportType,
      trimmedTarget,
      messageBody,
      category,
      rules,
      onUpdateRules
    );
    setIsSubmitting(false);

    Alert.alert(
      'İşlem Tamamlandı',
      `${result.message}\n\n${result.autoBlockedRule ? '🛡️ ' + result.autoBlockedRule : ''}`,
      [{ text: 'Tamam' }]
    );

    // Formu temizle
    setSenderOrNumber('');
    setMessageBody('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tür Seçimi (SMS vs Çağrı) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, reportType === 'SMS' && styles.activeTab]}
          onPress={() => setReportType('SMS')}
        >
          <Text style={[styles.tabText, reportType === 'SMS' && styles.activeTabText]}>
            💬 Şüpheli SMS Bildir
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, reportType === 'CALL' && styles.activeTab]}
          onPress={() => setReportType('CALL')}
        >
          <Text style={[styles.tabText, reportType === 'CALL' && styles.activeTabText]}>
            📞 İstenmeyen Arama Bildir
          </Text>
        </TouchableOpacity>
      </View>

      {/* Giriş Formu */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {reportType === 'SMS' ? 'Yeni Spam SMS Bildirimi' : 'Yeni Spam Numara Bildirimi'}
        </Text>
        <Text style={styles.cardSubtitle}>
          Bildirdiğiniz mesaj ve numaralar anında kendi cihazınızda engellenir; onayınız varsa anonim olarak topluluk spam veritabanına aktarılır.
        </Text>

        <Text style={styles.label}>
          {reportType === 'SMS' ? 'Gönderen (B-Kodu veya Numara):' : 'Arayan Telefon Numarası:'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={reportType === 'SMS' ? 'Örn: B214, SMS-INFO, 0532...' : 'Örn: 08501234567, 0375...'}
          placeholderTextColor="#999"
          value={senderOrNumber}
          onChangeText={setSenderOrNumber}
          keyboardType={reportType === 'CALL' ? 'phone-pad' : 'default'}
          autoCapitalize="none"
        />

        {reportType === 'SMS' && (
          <View>
            <Text style={styles.label}>Gelen SMS Metni:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Gelen şüpheli SMS içeriğini buraya yapıştırın..."
              placeholderTextColor="#999"
              value={messageBody}
              onChangeText={setMessageBody}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Kategori Seçimi */}
        <Text style={styles.label}>Spam Kategorisi:</Text>
        <View style={styles.categoriesRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryChip, category === cat.value && styles.activeCategoryChip]}
              onPress={() => setCategory(cat.value)}
            >
              <Text style={styles.categoryChipText}>
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* İzin ve Gizlilik Onay Kutusu */}
      <View style={styles.consentCard}>
        <View style={styles.consentHeader}>
          <Text style={styles.consentIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.consentTitle}>Anonim Topluluk Koruması</Text>
            <Text style={styles.consentSubtitle}>
              Kişisel bilgiler (kredi kartı, banka onay şifresi, isimler) bildirim öncesinde otomatik olarak maskelenir. Yalnızca şüpheli spam bağlantıları ve arama kodları işlenir.
            </Text>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Verilerimin anonim olarak analiz edilmesine izin veriyorum</Text>
          <Switch
            value={consentGranted}
            onValueChange={handleToggleConsent}
            trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
          />
        </View>
      </View>

      {/* Gönder ve Engelle Butonu */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'İşleniyor...' : '🚨 Raporla ve Otomatik Engelle'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 10, padding: 4, marginBottom: 14 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#DC2626' },
  tabText: { fontWeight: '600', color: '#666', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#666', lineHeight: 17, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    color: '#000',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    color: '#000',
  },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeCategoryChip: { backgroundColor: '#FEE2E2', borderColor: '#DC2626' },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  consentCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  consentHeader: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  consentIcon: { fontSize: 24 },
  consentTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E40AF', marginBottom: 2 },
  consentSubtitle: { fontSize: 11, color: '#3B82F6', lineHeight: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#DBEAFE' },
  switchLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: '#1E3A8A', marginRight: 10 },
  submitButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledButton: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

