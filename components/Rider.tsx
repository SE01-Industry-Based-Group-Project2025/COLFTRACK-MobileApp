import { auth, db } from '@/firebase';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const areas = ['Maharagama', 'Kottawa', 'Kadawatha'];

const customers = [
  {
    id: '1',
    name: 'Tharuka Dilshan',
    nic: '199834567V',
    adress:'No: 16, Gammmana Road, Maharagama',
    area: 'Maharagama',
    photo: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '2',
    name: 'Maleesha Perera',
    nic: '98765432112V',
    adress:'No: 16, Town Road, Kottawa',
    area: 'Kottawa',
    photo: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: '3',
    name: 'Nimal Alahakorn',
    nic: '45678912233V',
    adress:'No: 16,Pamunuwa Road, Maharagama',
    area: 'Maharagama',
    photo: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
  {
    id: '4',
    name: 'Sadun Adikari',
    nic: '2002456789123',
    adress:'No: 26,Pamunuwa Road, Maharagama',
    area: 'Maharagama',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
  },
  
];


interface ProfileData {
  firstName: string;
}

export default function LoanOfficerHome() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const filteredCustomers = customers.filter(
    (c) =>
      (!selectedArea || c.area === selectedArea) &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nic.includes(searchQuery))
  );

  const goToCollection = (customer: any) => {
    navigation.navigate('Collection', { customer });
  };

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
        };
        await setDoc(docRef, defaultProfile);
        setProfileData(defaultProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally{
      setLoading(false);
    }    
  }

  if (loading) {
      return (
         <View className="flex-1 justify-center items-center bg-white">
            <LottieView
                source={require('../assets/animations/load.json')}
                autoPlay
                loop
                style={{ width: 208, height: 208 }} // Tailwind equivalent for width: 208px, height: 208px
              />
          </View>
      );
    }


  return (
    <View className="flex-1 bg-white p-5">
      {/* Header */}
      <View className="items-center mb-2">
        <Image
          source={require('../assets/images/logo.png')}
          className="w-24 h-24 rounded-full"
        />
      </View>

      {/* No Area Selected */}
      {!selectedArea && (
           <Text className="text-2xl font-bold text-gray-800 mt-3 mb-4 bg-green-100 p-5 w-full text-center capitalize">Hello {profileData?.firstName}..</Text>
      )}

      {/* Area Selection */}
      <View className='bg-white rounded-xl p-6 shadow-md mb-5'>
        <Text className='ml-8 text-gray-800 mb-2 font-bold'>Select an Area</Text>
        <View className="flex-row justify-center flex-wrap mb-5">  
          {areas.map((area) => (
            <TouchableOpacity
              key={area}
              className={`px-4 py-2 m-1 rounded-full border ${
                selectedArea === area ? 'bg-green-600 border-green-600' : 'bg-gray-100 border-gray-300'
              }`}
              onPress={() => setSelectedArea(area === selectedArea ? null : area)}
            >
              <Text
                className={`font-medium ${
                  selectedArea === area ? 'text-white' : 'text-gray-800'
                }`}
              >
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      

      {/* Search */}
      {selectedArea && (
        <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 mb-5 px-5">
          <TextInput
            className="flex-1 p-3 text-base text-gray-800"
            placeholder="Search by name or NIC"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={22} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* No Area Selected */}
      {!selectedArea && (
        <View className="bg-white rounded-xl p-6 shadow-md items-center">
          <LottieView
            source={require('../assets/animations/rider.json')}
            autoPlay
            loop
            style={{
              width: 400,
              height: 250,
              alignSelf: 'center',
            }}
          />
          <Text className="text-xl font-bold text-gray-800 text-center mt-5">
            Please Select an Area
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Select an area to view and search for customers in that location.
          </Text>
        </View>
      )}

      {/* Customer List */}
      {selectedArea && (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">No customers found</Text>
          }
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-lg shadow-sm mb-3 border-l-4 border-green-500">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  {/* Image */}
                  <Image
                    source={{ uri: item.photo }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View>
                    <Text className="text-lg font-bold text-gray-800 mt-7">{item.name}</Text>
                    <Text className="text-sm text-gray-600">NIC: {item.nic}</Text>
                    <Text className="text-sm text-gray-600">Address: {item.adress}</Text>
                  </View>
                </View>

                {/* Collect Button */}
                <TouchableOpacity
                  className="bg-green-600 px-3 py-2 rounded-lg"
                  onPress={() => goToCollection(item)}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="cash-outline" size={16} color="#fff" />
                    <Text className="text-white font-medium ml-1 text-sm">Collect</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
