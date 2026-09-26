import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';

interface ProfileSummaryCardProps {
  onPress?: () => void;
}

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({ onPress }) => {
  const router = useRouter();
  const userSkinType = useProfileStore((s) => s.user_skin_type);
  const userAcneSeverity = useProfileStore((s) => s.user_acne_severity);
  const allergies = useProfileStore((s) => s.allergies);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/profile');
    }
  };

  const formatValue = (value: string | null | undefined, fallback = 'Not set') => {
    if (!value) return fallback;
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const cards = [
    {
      key: 'skinType',
      icon: '👤',
      label: 'SKIN TYPE',
      value: formatValue(userSkinType),
      isEmpty: !userSkinType,
    },
    {
      key: 'acneSeverity',
      icon: '🔍',
      label: 'ACNE SEVERITY',
      value: formatValue(userAcneSeverity),
      isEmpty: !userAcneSeverity,
    },
    {
      key: 'allergies',
      icon: '⚠️',
      label: 'ALLERGIES',
      value: allergies.length > 0 ? String(allergies.length) : '0',
      isEmpty: allergies.length === 0,
    },
  ];

  return (
    <TouchableOpacity
      testID="profile-summary-card"
      onPress={handlePress}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel="View and edit your profile"
      activeOpacity={0.8}
    >
      {cards.map((card) => (
        <View key={card.key} style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{card.icon}</Text>
          </View>
          <Text style={[styles.label, { color: theme.colors.text.tertiary }]}>
            {card.label}
          </Text>
          <Text
            style={[
              styles.value,
              card.isEmpty ? { color: theme.colors.text.tertiary } : { color: theme.colors.text.primary },
            ]}
          >
            {card.value}
          </Text>
          <Text style={styles.chevron}>▸</Text>
        </View>
      ))}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.raised,
    borderColor: theme.colors.surface.rule,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 100,
    padding: theme.spacing.lg,
  },
  chevron: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md,
  },
  container: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  icon: {
    fontSize: 16,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.rule,
    borderRadius: theme.radii.sm,
    height: 32,
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    width: 32,
  },
  label: {
    fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.semibold,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
});