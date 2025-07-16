import { auth, db } from '@/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface ProfileData {
  firstName: string;
}

type Customer = {
  id: string;
  name: string;
  nic: string;
  address: string;
  profilePhoto: string;
};

export default function LoanOfficer() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMarkedCustomers, setShowMarkedCustomers] = useState(false);
  const [markedCustomers, setMarkedCustomers] = useState<Customer[]>([]);

  const dashboardTips = [
    "Use the search button to find customers.",
    "Mark those who regularly miss payments.",
    "Marked customers will appear here for follow-up."
  ];

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
      setLoading(false);
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'employees', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfileData(docSnap.data() as ProfileData);
      } else {
        const defaultProfile: ProfileData = {
          firstName: '',
        };
        await setDoc(docRef, defaultProfile);
        setProfileData(defaultProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  
  const handleShowMarkedCustomers = async () => {
    try {
      const stored = await AsyncStorage.getItem('notToPayCustomers');
      const parsed = stored ? JSON.parse(stored) : [];
      setMarkedCustomers(parsed);
      setShowMarkedCustomers(true);
    } catch (e) {
      Alert.alert('Error', 'Could not load marked customers');
      console.log(e);
    }
  };

  const handleUnmarkCustomer = async (id: string) => {
  try {
    const stored = await AsyncStorage.getItem('notToPayCustomers');
    let list = stored ? JSON.parse(stored) : [];

    const updatedList = list.filter((c: any) => c.id !== id);

    await AsyncStorage.setItem('notToPayCustomers', JSON.stringify(updatedList));
    setMarkedCustomers(updatedList);
    Alert.alert('Removed', 'Customer unmarked successfully.');
  } catch (e) {
    Alert.alert('Error', 'Failed to unmark customer.');
    console.log(e);
  }
};


  const handleBack = () => {
    setShowMarkedCustomers(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LottieView
          source={require('../assets/animations/load.json')}
          autoPlay
          loop
          style={{ width: 208, height: 208 }}
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-10">
      {/* Logo and Header */}
      <View className="items-center mb-6">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-24 h-24 rounded-full"
        />
        <Text className="text-2xl font-bold text-gray-800 mt-3 mb-4 bg-green-100 p-5 w-full text-center capitalize">
          Hello {profileData ? profileData.firstName : ''}..
        </Text>
      </View>

      {!showMarkedCustomers && (
        <>
          {/* Show Button */}
          <TouchableOpacity
            className="bg-emerald-600 py-3 px-6 rounded-full mb-6 shadow-md"
            style={{ alignSelf: 'center' }}
            onPress={handleShowMarkedCustomers}
          >
            <Text className="text-white font-semibold text-lg">Marked Customers</Text>
          </TouchableOpacity>

          {/* Animation */}
          <LottieView
            source={require('../assets/animations/work.json')}
            autoPlay
            loop
            style={{
              width: 450,
              height: 220,
              alignSelf: 'center',
              marginBottom: 10,
            }}
          />

          {/* Welcome Section */}
          <View className="bg-green-100 rounded-2xl p-5 shadow-sm mb-6">
            <Text className="text-lg font-semibold text-gray-800 text-center mb-2">
              Welcome to the Loan Officer Dashboard!
            </Text>
            <FlatList
              data={dashboardTips}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <Text className="text-gray-600 text-base mb-1 text-center">• {item}</Text>
              )}
            />
          </View>
        </>
      )}

      {showMarkedCustomers && (
        <>
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            className="bg-gray-300 px-4 py-2 rounded-full mb-5 w-1/2 self-center"
          >
            <Text className="text-center text-gray-800 font-semibold">← Back</Text>
          </TouchableOpacity>

          {/* Marked Customers List */}
          <View className="bg-red-100 rounded-2xl p-5 mb-6">
            <Text className="text-lg font-bold text-red-800 text-center mb-4">
              ❗ Marked Customers
            </Text>

            {markedCustomers.length > 0 ? (
              markedCustomers.map((customer) => (
                <View
                  key={customer.id}
                  className="flex-row items-center justify-between bg-white p-4 mb-3 rounded-xl shadow-sm"
                >
                  <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                      <View className="items-center">
                        <Image
                          source={{ uri:customer.profilePhoto }}
                          className="w-16 h-16 rounded-full border-2 border-red-200"
                          alt='profile photo'   
                        />
                      </View>    
                    </View> 
                  <View>
                    <Text className="font-bold text-gray-800">{customer.name}</Text>
                    <Text className="text-gray-600 text-sm">{customer.nic}</Text>
                    <Text className="text-gray-600 text-sm">{customer.address}</Text>

                  </View>

                  <View className="items-end">
                    <TouchableOpacity
                      onPress={() => handleUnmarkCustomer(customer.id)}
                      className="px-3 py-1 bg-green-200 rounded-full"
                    >
                      <Text className="text-sm font-semibold text-gray-700">Unmark</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-center text-gray-600">
                No marked customers found.
              </Text>
            )}
          </View>
        </>
      )}

    </ScrollView>
  );
}
