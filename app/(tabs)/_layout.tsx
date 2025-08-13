import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { auth, db } from '../../firebase';

const tabConfigs = [
  { name: 'Home', title: 'Home', icon: 'home-outline' },
  { name: 'Register', title: 'Customer Registration', icon: 'person-add-outline' },
  { name: 'Search', title: 'Search', icon: 'search-sharp' },
  { name: 'Summary', title: 'Summary', icon: 'list-outline' },
  { name: 'Profile', title: 'Profile', icon: 'person-outline' },
];

export default function TabsLayout() {
  const userId = auth.currentUser?.uid;
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'employees', userId));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const role = userDoc.data().role;
        const permDoc = await getDoc(doc(db, 'permission', role));
        if (permDoc.exists()) {
          const data = permDoc.data();
          const normalized = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, Boolean(value)])
          );
          setPermissions(normalized);
        }
      } catch (e) {
        console.error('Error fetching permissions:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [userId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LottieView
          source={require('../../assets/animations/load.json')}
          autoPlay
          loop
          style={{ width: 208, height: 208 }}
        />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tabConfig = tabConfigs.find(t => t.name === route.name);
        return {
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name={tabConfig?.icon as any}
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: 'white' },
          headerShown: true,
        };
      }}
    >
      {tabConfigs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: permissions[tab.name] === true ? undefined : null,
          }}
        />
      ))}
    </Tabs>
  );
}
