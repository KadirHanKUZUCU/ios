import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FilterRules, SpamVerdict } from '../types';
import { MessageNormalizer } from '../services/MessageNormalizer';

interface Props {
  rules: FilterRules;
}

export const SimulatorScreen: React.FC<Props> = ({ rules }) => {
  const [sender, setSender] = useState('B214');
  const [body, setBody] = useState(
    'Tebrikler! 100 TL n4kit b4kiye ve 50 f-r-e-e-s-p-i-n hesabınıza eklendi: https://bit.ly/bonus777'
  );
  const [verdict, setVerdict] = useState<SpamVerdict | null>(null);

  const sampleScenarios = [
    {
      title: '🎰 Leetspeak & Bahis',
      sender: 'B214',
      body: 'Tebrikler! 100 TL n4kit b4kiye ve 50 f-r-e-e-s-p-i-n hesabınıza eklendi: https://bit.ly/bonus777',
    },
    {
      title: '🏦 Banka Onay Kodu (Whitelist)',
      sender: 'GARANTI',
      body: 'Degerli musterimiz, 123456 nolu onay kodu ile transfer isleminizi tamamlayabilirsiniz. Sifrenizi kimseyle paylasmayiniz.',
    },
    {
      title: '🔗 Telegram & Kısaltılmış Link',
      sender: '+905320000000',
      body: 'Guncel giris adresimiz acildi! Hemen tikla t.me/norabahis ve giris yap.',
    },
    {
      title: '👤 Normal Arkadaş SMS',
      sender: '+905421112233',
      body: 'Selam kanka, aksam halı saha maci saat 20:00de, gec kalma!',
    },
  ];

  const handleRunSimulation = () => {
    const result = MessageNormalizer.evaluate(sender, body, rules);
    setVerdict(result);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Şablon Butonları */}
      <Text style={styles.sectionLabel}>Hızlı Test Şablonları</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scenariosRow}>
        {sampleScenarios.map((sc, i) => (
          <TouchableOpacity
            key={i}
            style={styles.scenarioChip}
            onPress={() => {
              setSender(sc.sender);
              setBody(sc.body);
              const res = MessageNormalizer.evaluate(sc.sender, sc.body, rules);
              setVerdict(res);
            }}
          >
            <Text style={styles.scenarioChipText}>{sc.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mesaj Giriş Kartı */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Simüle Edilecek SMS</Text>

        <Text style={styles.inputLabel}>Gönderen (Başlık veya Numara):</Text>
        <TextInput
          style={styles.senderInput}
          value={sender}
          onChangeText={setSender}
          placeholder="Örn: B001, GARANTI, +90532..."
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>SMS Metni:</Text>
        <TextInput
          style={styles.bodyInput}
          value={body}
          onChangeText={setBody}
          placeholder="Örnek SMS metnini buraya yapıştırın..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.runButton} onPress={handleRunSimulation}>
          <Text style={styles.runButtonText}>⚡ Simülasyonu Çalıştır</Text>
        </TouchableOpacity>
      </View>

      {/* Karar ve Sonuç */}
      {verdict && (
        <View style={styles.resultCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeIcon}>{verdict.isJunk ? '🚫' : '✅'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.badgeTitle, verdict.isJunk ? styles.junkColor : styles.allowColor]}>
                {verdict.isJunk ? 'JUNK (İstenmeyen SMS)' : 'ALLOW (Gelen Kutusu)'}
              </Text>
              <Text style={styles.badgeSubtitle}>{verdict.reason}</Text>
            </View>
          </View>

          {/* Normalizasyon Ayrımı */}
          <View style={styles.divider} />
          <Text style={styles.normLabel}>Leetspeak & Karakter Çözümlemesi:</Text>
          <View style={styles.normBox}>
            <Text style={styles.normText}>{verdict.normalizedBody || '(Metin boş)'}</Text>
          </View>

          {verdict.matchedRules.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.normLabel}>Tetiklenen Kurallar:</Text>
              {verdict.matchedRules.map((r, idx) => (
                <Text key={idx} style={styles.matchedRuleItem}>
                  • {r}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  scenariosRow: { flexDirection: 'row', marginBottom: 14 },
  scenarioChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  scenarioChipText: { color: '#4338CA', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4 },
  senderInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
    color: '#000',
  },
  bodyInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 14,
    color: '#000',
  },
  runButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  runButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  resultCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badgeIcon: { fontSize: 32, marginRight: 12 },
  badgeTitle: { fontSize: 16, fontWeight: 'bold' },
  junkColor: { color: '#DC2626' },
  allowColor: { color: '#16A34A' },
  badgeSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  normLabel: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginBottom: 4 },
  normBox: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  normText: { fontFamily: 'Courier', fontSize: 12, color: '#1E293B' },
  matchedRuleItem: { fontSize: 12, color: '#DC2626', marginTop: 2, fontWeight: '500' },
});

