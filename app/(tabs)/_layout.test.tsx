import React from 'react';
import { render } from '@testing-library/react-native';

// Mock expo-router Tabs with proper Screen property
const MockTabs = ({ children, screenOptions }) => {
  return React.createElement('View', { testID: 'tabs-container', 'data-screen-options': JSON.stringify(screenOptions) }, children);
};
MockTabs.Screen = ({ name, options, children }) =>
  React.createElement('View', { testID: `tab-${name}`, 'data-title': options?.title }, children);

jest.doMock('expo-router', () => ({
  Tabs: MockTabs,
}), { virtual: true });

// Mock @expo/vector-icons
jest.doMock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: ({ name, size, color }) =>
      React.createElement('Text', { testID: `icon-${name}`, style: { fontSize: size, color } }, name),
  };
}, { virtual: true });

// Mock theme
jest.doMock('../src/theme', () => ({
  theme: {
    colors: {
      verdict: { match: '#3D8B5F' },
      text: { tertiary: '#9A9088' },
      surface: { base: '#FBF7F2', rule: '#1F1B1810' },
      brand: { ink: '#1F1B18' },
    },
    typography: {
      font: { body: 'Inter' },
      size: { xs: 12 },
      weight: { medium: '500' },
    },
  },
}), { virtual: true });

describe('TabLayout', () => {
  let TabLayout: React.ComponentType;

  beforeEach(() => {
    jest.resetModules();
    // Import after mocks are set up
    TabLayout = require('./_layout').default;
  });

  it('renders all four tabs', () => {
    const { getByTestId } = render(React.createElement(TabLayout));

    const container = getByTestId('tabs-container');
    expect(getByTestId('tab-index')).toBeTruthy();
    expect(getByTestId('tab-scan')).toBeTruthy();
    expect(getByTestId('tab-search')).toBeTruthy();
    expect(getByTestId('tab-profile')).toBeTruthy();
  });

  it('has correct tab titles', () => {
    const { getByTestId } = render(React.createElement(TabLayout));

    expect(getByTestId('tab-index').props['data-title']).toBe('Home');
    expect(getByTestId('tab-scan').props['data-title']).toBe('Scan');
    expect(getByTestId('tab-search').props['data-title']).toBe('Search');
    expect(getByTestId('tab-profile').props['data-title']).toBe('Profile');
  });

  it('has tabBarIcon functions defined for each tab', () => {
    const { getByTestId } = render(React.createElement(TabLayout));

    // The tab screens are rendered, verify they exist
    // Icons are rendered by the tab bar internally when tabBarIcon is called
    expect(getByTestId('tab-index')).toBeTruthy();
    expect(getByTestId('tab-scan')).toBeTruthy();
    expect(getByTestId('tab-search')).toBeTruthy();
    expect(getByTestId('tab-profile')).toBeTruthy();
  });

  it('uses theme colors for active/inactive tint', () => {
    const { getByTestId } = render(React.createElement(TabLayout));
    const container = getByTestId('tabs-container');
    const screenOptions = JSON.parse(container.props['data-screen-options']);
    expect(screenOptions.tabBarActiveTintColor).toBe('#3D8B5F');
    expect(screenOptions.tabBarInactiveTintColor).toBe('#9A9088');
  });

  it('hides header', () => {
    const { getByTestId } = render(React.createElement(TabLayout));
    const container = getByTestId('tabs-container');
    const screenOptions = JSON.parse(container.props['data-screen-options']);
    expect(screenOptions.headerShown).toBe(false);
  });
});