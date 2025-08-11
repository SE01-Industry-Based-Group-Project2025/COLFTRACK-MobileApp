import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth/react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import LottieView from 'lottie-react-native';
import { auth, db } from '../../firebase';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNum: string;
  profilepicture: string;
}

export default function ProfileScreen() {
   const router = useRouter();
   const handleImageError = () => setImageError(true);
   const [imageError, setImageError] = useState(false);
   const [loading, setLoading] = useState(true);
   const [profileData, setProfileData] = useState<ProfileData | null>(null);
   
   useEffect(() => {
     fetchProfileData();
   }, []);


  // Fetch profile data from Firebase
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
        // If no profile exists, create a default one
        const defaultProfile: ProfileData = {
          firstName: '',
          lastName: '',
          email: '',
          phoneNum: '',
          role: '',
          profilepicture: '',
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


  
  // Loading state
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

  // No profile data state
  if (!profileData) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Ionicons name="person-circle-outline" size={80} color="#9CA3AF" />
        <Text className="mt-4 text-gray-600 text-lg">No profile data found</Text>
        <TouchableOpacity
          onPress={fetchProfileData}
          className="mt-4 bg-green-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  
  

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing functionality would be implemented here', [
      { text: 'OK' },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const auth = getAuth();
            await signOut(auth);
            router.replace('/Login'); 
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Something went wrong while logging out.');
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#1B8E0A" />

      {/* Header */}
      <View className="bg-green-600 pt-11 pb-5 px-5 flex-row justify-between items-end rounded-b-3xl shadow-lg shadow-black/10">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white mb-1">My Profile</Text>
          <Text className="text-base text-white/80">Manage your account</Text>
        </View>
        <TouchableOpacity
          onPress={handleEditProfile}
          className="w-11 h-11 rounded-full bg-white/20 justify-center items-center"
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Profile Photo */}
        <View className="items-center mb-8 ">
          <View className="relative w-32 h-32">
            {/* Profile Image or Icon */}
            <View className="w-32 h-32 rounded-full border-[3px] border-green-600 bg-gray-200 overflow-hidden items-center justify-center">
             {!imageError ? (
                <Image
                  source={{ uri: profileData.profilepicture }}
                  className="w-full h-full"
                  onError={handleImageError}
                />
              ) : (
                <Ionicons name="person" size={60} color="green" />
              )}
            </View>

            {/* Camera Overlay (FIXED POSITION) */}
            <TouchableOpacity
              onPress={() => Alert.alert('Change Photo')}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-green-600 border-[4px] border-white items-center justify-center"
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Personal Information */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">Personal Information</Text>

          {[
            { icon: 'person-outline', label: 'Name', value: `${profileData.firstName} ${profileData.lastName}` },
            { icon: 'people-outline', label: 'Role', value: profileData.role },
            { icon: 'mail-outline', label: 'Email Address', value: profileData.email },
            { icon: 'call-outline', label: 'Phone Number', value: profileData.phoneNum },
          ].map((item, index) => (
            <View
              key={index}
              className="flex-row items-center bg-white p-5 rounded-2xl mb-3 shadow-sm"
            >
              <Ionicons name={item.icon as any} size={20} color="#16A34A" />
              <View className="ml-4 flex-1">
                <Text className="text-sm text-gray-500 mb-0.5">{item.label}</Text>
                <Text className={`text-base font-semibold text-gray-700 ${item.label !== 'Email Address' ? 'capitalize' : ''}`}>
                    {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-red-500 p-5 rounded-2xl mt-2 mb-5 shadow-lg"
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text className="text-white text-lg font-bold ml-3">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
