module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-|@react-native|react-native|expo|@expo|expo-modules-core)/)',
  ],
};