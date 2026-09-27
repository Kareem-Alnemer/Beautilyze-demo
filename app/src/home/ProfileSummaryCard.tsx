import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { useProfileStore } from '../profile/store';

interface ProfileSummaryCardProps { onPress?: () => void }

export const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({ onPress }) => {
  const router = useRouter();
  const skin = useProfileStore((s) => s.user_skin_type);
  const acne = useProfileStore((s) => s.user_acne_severity);
  const allergies = useProfileStore((s) => s.allergies);
  const format = (value: string | null) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not set';
  const rows = [
    ['SKIN TYPE', format(skin)],
    ['ACNE SEVERITY', format(acne)],
    ['ALLERGIES', allergies.length ? String(allergies.length) : 'None declared'],
  ];
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.heading}>Your profile</Text>
        <TouchableOpacity
          testID="profile-summary-card"
          accessibilityRole="button"
          accessibilityLabel="View and edit your profile"
          style={styles.editButton}
          onPress={onPress ?? (() => router.push('/profile'))}
        >
          <Text style={styles.editText}>Edit profile</Text>
        </TouchableOpacity>
      </View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.xl },
  editButton: { justifyContent: 'center', minHeight: theme.spacing.xxxl, paddingHorizontal: theme.spacing.sm },
  editText: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.sm, textDecorationLine: 'underline',
  },
  header: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  heading: {
    color: theme.colors.text.primary, fontFamily: theme.typography.font.heading,
    fontSize: theme.typography.size.lg, fontWeight: theme.typography.weight.semibold,
  },
  label: {
    color: theme.colors.text.secondary, flexShrink: 1, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.xs,
  },
  row: {
    alignItems: 'center', borderBottomColor: theme.colors.surface.rule,
    borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', flexWrap: 'wrap',
    gap: theme.spacing.sm, justifyContent: 'space-between', paddingVertical: theme.spacing.md,
  },
  value: {
    color: theme.colors.text.primary, flexShrink: 1, fontFamily: theme.typography.font.body,
    fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.medium,
  },
});
