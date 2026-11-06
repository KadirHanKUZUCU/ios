import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { FilterRules } from '../types';

interface Props {
  rules: FilterRules;
  onUpdateRules: (newRules: FilterRules) => void;
}

export const RegexScreen: React.FC<Props> = ({ rules, onUpdateRules }) => {
  const [newPattern, setNewPattern] = useState('');
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const handlePatternChange = (text: string) => {
    setNewPattern(text);
    if (!text.trim()) {
      setSyntaxError(null);
      return;
    }
    try {
      new RegExp(text.trim(), 'i');
      setSyntaxError(null);
    } catch (e: any) {
      setSyntaxError('Geçersiz Regex: ' + (e?.message || 'Sözdizimi hatası'));
    }
  };

  const handleAdd = () => {
    const trimmed = newPattern.trim();
    if (!trimmed || syntaxError) return;

    if (rules.regexPatterns.includes(trimmed)) {
      Alert.alert('Uyarı', 'Bu regex kalıbı zaten mevcut.');
      return;
    }

    const updated = { ...rules, regexPatterns: [trimmed, ...rules.regexPatterns] };
    onUpdateRules(updated);
    setNewPattern('');
    setSyntaxError(null);
  };

  const handleDelete = (pattern: string) => {
    const updated = {
      ...rules,
      regexPatterns: rules.regexPatterns.filter(p => p !== pattern),
    };
    onUpdateRules(updated);
  };

  const runTest = (sample: string) => {
    setTestText(sample);
    if (!sample.trim()) {
      setTestResult(null);
      return;
    }

    for (const pattern of rules.regexPatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(sample)) {
          setTestResult(`Eşleşti! Kural: ${pattern}`);
          return;
        }
      } catch (e) {}
    }

    setTestResult('Temiz: Hiçbir regex kuralıyla eşleşmedi.');
  };

  return (
    <View style={styles.container}>
      {/* Yeni Regex Ekleme */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Yeni Regex Deseni Ekle</Text>
        <Text style={styles.cardSubtitle}>
          Kısaltılmış linkler (bit.ly, t.ly) veya karmaşık SMS desenlerini yakalayın.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, syntaxError ? styles.inputError : null]}
            placeholder="Örn: https?:\/\/(bit\.ly|t\.ly)\/\S+"
            placeholderTextColor="#999"
            value={newPattern}
            onChangeText={handlePatternChange}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.addButton, (!newPattern.trim() || !!syntaxError) && styles.disabledBtn]}
            onPress={handleAdd}
            disabled={!newPattern.trim() || !!syntaxError}
          >
            <Text style={styles.addButtonText}>Ekle</Text>
          </TouchableOpacity>
        </View>

        {syntaxError && <Text style={styles.errorText}>{syntaxError}</Text>}
      </View>

      {/* Canlı Test Kutusu */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Canlı Regex Test Aracı</Text>
        <TextInput
          style={styles.testInput}
          placeholder="Test edilecek örnek SMS linkini veya metnini yazın..."
          placeholderTextColor="#999"
          value={testText}
          onChangeText={runTest}
          autoCapitalize="none"
        />
        {testResult && (
          <Text
            style={[
              styles.testResultText,
              testResult.startsWith('Eşleşti') ? styles.matchedText : styles.cleanText,
            ]}
          >
            {testResult}
          </Text>
        )}
      </View>

      {/* Regex Listesi */}
      <FlatList
        data={rules.regexPatterns}
        keyExtractor={(item, index) => item + index}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.patternRow}>
            <Text style={styles.patternCode}>{item}</Text>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Sil</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#666', marginBottom: 10 },
  inputRow: { flexDirection: 'row' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'Courier',
    fontSize: 13,
    color: '#000',
  },
  inputError: { borderColor: '#DC2626' },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  errorText: { color: '#DC2626', fontSize: 11, marginTop: 6 },
  testInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#000',
  },
  testResultText: { marginTop: 8, fontSize: 12, fontWeight: '600' },
  matchedText: { color: '#DC2626' },
  cleanText: { color: '#16A34A' },
  listContent: { paddingBottom: 20 },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  patternCode: { flex: 1, fontFamily: 'Courier', fontSize: 12, color: '#1E293B' },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FEE2E2', borderRadius: 6 },
  deleteBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
});

