import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { auth, db } from '../../firebase';

export default function TabsLayout() {
  const userId = auth.currentUser?.uid;
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      const docRef = doc(db, 'employees', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRole(docSnap.data().role);
      }
      setLoading(false);
    };
    fetchRole();
  }, [userId]);

 
if (loading) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <LottieView
        source={require('../../assets/animations/load.json')}
        autoPlay
        loop
        style={{ width: 208, height: 208 }} // Tailwind equivalent for width: 208px, height: 208px
      />
    </View>
  );
}


  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Search') iconName = 'search-sharp';
          else if (route.name === 'Profile') iconName = 'person-outline';
          else if (route.name === 'Summary') iconName = 'list-outline';
          else if (route.name === 'Register') iconName = 'person-add-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: 'white' },
        headerShown: true,
      })}
    >
      <Tabs.Screen name="Home" options={{ title: 'Home' }} />
      <Tabs.Screen
        name="Register"
        options={{
          title: 'Customer Registration',
          href: role === 'loan-officer' ? undefined : null
        }}
      />
      <Tabs.Screen
        name="Search"
        options={{
          title: 'Search',
          href: role === 'rider' || role === 'loan-officer' ? undefined : null
        }}
      />
      <Tabs.Screen
        name="Summary"
        options={{
          title: 'Summary',
          href: role === 'rider' ? undefined : null
        }}
      />
      <Tabs.Screen name="Profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
