import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
     <Stack initialRouteName="Welcome">
      <Stack.Screen name="Welcome" options={{ headerShown: false }} />
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="Froget" options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="Reset" options={{headerShown:false}} /> 
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="Collection" options={{ title: 'Collections' }} />
    </Stack>
  );
}
