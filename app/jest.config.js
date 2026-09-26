module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-|@react-native|react-native|expo|@expo|expo-modules-core)/)',
  ],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../theme$': '<rootDir>/src/theme',
  },
};