import { Tabs } from 'expo-router';
import { Icon } from '../../src/components/ui/Icon';
import { FontsReadyContext } from '../../src/components/ui/Text';
import { useContext } from 'react';
import { theme } from '../../src/theme';

export default function TabLayout() {
  const fontsReady = useContext(FontsReadyContext);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.brand.ink,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface.base,
          borderTopWidth: 1,
          borderTopColor: theme.colors.surface.rule,
        },
        tabBarLabelStyle: {
          fontFamily: fontsReady ? theme.typography.face.bodyMedium : undefined,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.regular,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Icon
              name="home"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => (
            <Icon
              name="camera"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => (
            <Icon
              name="search"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <Icon
              name="history"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Icon
              name="user"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
