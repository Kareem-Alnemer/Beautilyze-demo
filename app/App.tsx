/* eslint-disable react-native/no-color-literals */
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

// eslint-disable-next-line react-native/no-color-literals
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff', // scaffold placeholder; replace with theme color
    flex: 1,
    justifyContent: 'center',
  },
});
