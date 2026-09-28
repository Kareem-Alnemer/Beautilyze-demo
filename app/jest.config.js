module.exports = {
  preset: 'jest-expo',
  transform: { '^.+\\.mjs$': 'babel-jest' },
  transformIgnorePatterns: [
    'node_modules/(?!(?:jest-|@react-native|react-native|react-native-svg|lucide-react-native|expo(?:-.*)?|@expo(?:/.*)?|expo-modules-core|expo-router|expo-secure-store|expo-asset|expo-camera|expo-image-picker)/)',
  ],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../../theme$': '<rootDir>/src/theme',
  },
};
