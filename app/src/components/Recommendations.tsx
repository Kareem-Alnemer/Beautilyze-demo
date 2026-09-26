import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface RecommendationProps {
  skinType: string;
  acneSeverity: string;
}

interface RoutineAdvice {
  ingredients: string[];
  amRoutine: string[];
  pmRoutine: string[];
  tips: string;
}

export const Recommendations: React.FC<RecommendationProps> = ({ skinType, acneSeverity }) => {
  const getAdvice = (): RoutineAdvice => {
    const isOily = skinType.toLowerCase().includes('oily');
    const isSevere = acneSeverity.toLowerCase().includes('severe') || acneSeverity.toLowerCase().includes('moderate');

    if (isOily && isSevere) {
      return {
        ingredients: ['Salicylic Acid (BHA)', 'Niacinamide 5%', 'Zinc PCA'],
        amRoutine: ['Gentle Gel Cleanser', 'Niacinamide Serum', 'Oil-Free Gel Moisturizer', 'Broad Spectrum SPF 50'],
        pmRoutine: ['Salicylic Acid Cleanser', 'Lightweight Hydrating Serum', 'Non-Comedogenic Gel Moisturizer'],
        tips: 'Avoid physical scrub exfoliants which can worsen inflammatory acne. Stick to non-comedogenic formulas.',
      };
    } else if (isOily) {
      return {
        ingredients: ['Niacinamide', 'Hyaluronic Acid', 'Green Tea Extract'],
        amRoutine: ['Foaming Cleanser', 'Lightweight Hydrator', 'Matte Finish SPF 30+'],
        pmRoutine: ['Foaming Cleanser', 'Niacinamide Treatment', 'Oil-Free Moisturizer'],
        tips: 'Avoid heavy oils. Hydrate adequately so skin does not overproduce sebum.',
      };
    } else {
      return {
        ingredients: ['Ceramides', 'Hyaluronic Acid', 'Centella Asiatica'],
        amRoutine: ['Hydrating Cream Cleanser', 'Ceramide Serum', 'Rich Cream', 'SPF 50'],
        pmRoutine: ['Hydrating Cleanser', 'Soothing Serum', 'Barrier Repair Cream'],
        tips: 'Focus on moisture barrier restoration and consistent daily hydration.',
      };
    }
  };

  const advice = getAdvice();

  return (
    <View style={styles.card}>
      <Text style={styles.header}>✨ Recommended Routine</Text>

      <Text style={styles.sectionTitle}>Key Active Ingredients</Text>
      <View style={styles.pillsContainer}>
        {advice.ingredients.map((item, idx) => (
          <View key={idx} style={styles.pill}>
            <Text style={styles.pillText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>☀️ Morning Routine</Text>
      {advice.amRoutine.map((step, idx) => (
        <Text key={idx} style={styles.stepText}>• {step}</Text>
      ))}

      <Text style={styles.sectionTitle}>🌙 Evening Routine</Text>
      {advice.pmRoutine.map((step, idx) => (
        <Text key={idx} style={styles.stepText}>• {step}</Text>
      ))}

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>Dermatology Tip</Text>
        <Text style={styles.tipText}>{advice.tips}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.surface.raised, borderRadius: 12, elevation: 2, marginTop: 16, padding: 16, width: '100%' },
  header: { color: theme.colors.text.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  pill: { backgroundColor: theme.colors.surface.base, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { color: theme.colors.badge.skinType, fontSize: 12, fontWeight: '600' },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sectionTitle: { color: theme.colors.badge.skinType, fontSize: 14, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  stepText: { color: theme.colors.text.secondary, fontSize: 13, lineHeight: 20 },
  tipBox: { backgroundColor: theme.colors.surface.base, borderColor: theme.colors.surface.rule, borderRadius: 8, borderWidth: 1, marginTop: 14, padding: 10 },
  tipText: { color: theme.colors.text.secondary, fontSize: 12, lineHeight: 16 },
  tipTitle: { color: theme.colors.verdict.caution, fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
});