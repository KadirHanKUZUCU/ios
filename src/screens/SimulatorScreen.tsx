import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { FilterRules, SpamVerdict } from '../types';
import { MessageNormalizer } from '../services/MessageNormalizer';

interface Props {
  rules: FilterRules;
}

export const SimulatorScreen: React.FC<Props> = ({ rules }) => {
  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');
  const [verdict, setVerdict] = useState<SpamVerdict | null>(null);

  const sampleScenarios = [
    {
      title: '🎰 Bahis & Bonus Örneği',
      sender: 'B214',
      body: 'Tebrikler! 100 TL n4kit b4kiye ve 50 f-r-e-e-s-p-i-n hesabınıza eklendi: https://bit.ly/bonus777',
    },
    {
      title: '🏦 Güvenli Banka Onayı',
      sender: 'GARANTI',
      body: 'Degerli musterimiz, 123456 nolu onay kodu ile transfer isleminizi tamamlayabilirsiniz. Sifrenizi kimseyle paylasmayiniz.',
    },
    {
      title: '🔗 Şüpheli Telegram Linki',
      sender: '+905320000000',
      body: 'Guncel giris adresimiz acildi! Hemen tikla t.me/norabahis ve giris yap.',
    },
  ];

  const handleRunSimulation = () => {
    if (!body.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen test etmek için bir mesaj metni yazın veya yapıştırın.');
      return;
    }
    const result = MessageNormalizer.evaluate(sender.trim(), body.trim(), rules);
    setVerdict(result);
  };

  const handleApplyScenario = (sc: { sender: string; body: string }) => {
    setSender(sc.sender);
    setBody(sc.body);
    const result = MessageNormalizer.evaluate(sc.sender, sc.body, rules);
    setVerdict(result);
  };

  const handleClear = () => {
    setSender('');
    setBody('');
    setVerdict(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. ÜST BİLGİ KARTI */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔬 Canlı SMS Tehdit & Kural Analizörü</Text>
        <Text style={styles.infoDesc}>
          Gelen herhangi bir SMS'i buraya yapıştırarak kural motorunun mesajı nasıl sınıflandırdığını (Spam/Junk veya Güvenli) test edebilirsiniz.
        </Text>
      </View>

      {/* 2. HIZLI TEST ŞABLONLARI */}
      <Text style={styles.sectionLabel}>HIZLI TEST ŞABLONLARI</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenariosRow}>
        {sampleScenarios.map((sc, i) => (
          <TouchableOpacity
            key={i}
            style={styles.scenarioChip}
            onPress={() => handleApplyScenario(sc)}
          >
            <Text style={styles.scenarioChipText}>{sc.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 3. GİRİŞ FORMU */}
      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>GÖNDEREN BAŞLIĞI VEYA NUMARASI (OPSİYONEL)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Örn: B214, GARANTI, +90532..."
          placeholderTextColor="#64748B"
          value={sender}
          onChangeText={setSender}
        />

        <Text style={[styles.inputLabel, { marginTop: 14 }]}>SMS MESAJ METNİ</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Test edilecek SMS mesaj metnini buraya yapıştırın veya yazın..."
          placeholderTextColor="#64748B"
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={4}
        />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.analyzeBtn} onPress={handleRunSimulation}>
            <Text style={styles.analyzeBtnText}>⚡ Mesajı Canlı Analiz Et</Text>
          </TouchableOpacity>
          {(sender !== '' || body !== '') && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. ANALİZ SONUÇ KARTI */}
      {verdict && (
        <View style={styles.resultContainer}>
          <Text style={styles.sectionLabel}>ANALİZ VE SINIFLANDIRMA RAPORU</Text>

          <View
            style={[
              styles.verdictCard,
              verdict.isJunk ? styles.verdictJunk : styles.verdictAllow,
            ]}
          >
            <View style={styles.verdictHeader}>
              <Text style={styles.verdictIcon}>
                {verdict.isJunk ? '🚫' : '✅'}
              </Text>
              <View style={styles.verdictTitleBox}>
                <Text
                  style={[
                    styles.verdictStatus,
                    { color: verdict.isJunk ? '#EF4444' : '#10B981' },
                  ]}
                >
                  {verdict.isJunk
                    ? 'SPAM / JUNK OLARAK ENGELLENDİ'
                    : 'GÜVENLİ İLETİ / İZİN VERİLDİ'}
                </Text>
                <Text style={styles.verdictReason}>{verdict.reason}</Text>
              </View>
            </View>

            {/* Eşleşen Kurallar */}
            {verdict.matchedRules.length > 0 && (
              <View style={styles.matchedBox}>
                <Text style={styles.matchedTitle}>Eşleşen Kural Desenleri:</Text>
                {verdict.matchedRules.map((r, idx) => (
                  <View key={idx} style={styles.matchedItem}>
                    <Text style={styles.matchedDot}>•</Text>
                    <Text style={styles.matchedText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Leetspeak & Normalizasyon */}
            <View style={styles.normBox}>
              <Text style={styles.normLabel}>Leetspeak & Normalleştirilmiş Hal:</Text>
              <Text style={styles.normText}>{verdict.normalizedBody || '(Boş)'}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  content: { padding: 16, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#121B2E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 6 },
  infoDesc: { fontSize: 12, color: '#94A3B8', lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  scenariosRow: { flexDirection: 'row', marginBottom: 16 },
  scenarioChip: {
    backgroundColor: '#121B2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1E2D4A',
  },
  scenarioChipText: { fontSize: 12, fontWeight: '700', color: '#38BDF8' },
  formCard: {
    backgroundColor: '#121B2E',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    marginBottom: 20,
  },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.8, marginBottom: 8 },
  textInput: {
    backgroundColor: '#0A0F1D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2D4A',
    color: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  analyzeBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnText: { color: '#090D16', fontWeight: '800', fontSize: 14 },
  clearBtn: {
    backgroundColor: '#1E2D4A',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: { color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  resultContainer: { marginTop: 6 },
  verdictCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  verdictJunk: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  verdictAllow: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verdictHeader: { flexDirection: 'row', alignItems: 'center' },
  verdictIcon: { fontSize: 32, marginRight: 12 },
  verdictTitleBox: { flex: 1 },
  verdictStatus: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  verdictReason: { fontSize: 12, color: '#94A3B8', lineHeight: 16 },
  matchedBox: {
    marginTop: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
  },
  matchedTitle: { fontSize: 11, fontWeight: '700', color: '#F59E0B', marginBottom: 6 },
  matchedItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  matchedDot: { color: '#F59E0B', marginRight: 6, fontSize: 14 },
  matchedText: { color: '#F1F5F9', fontSize: 12, fontWeight: '600', flex: 1 },
  normBox: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  normLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 4 },
  normText: { fontSize: 12, color: '#38BDF8', fontFamily: 'monospace' },
});
