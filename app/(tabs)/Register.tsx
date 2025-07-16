import { db } from '@/firebase';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import '../../global.css';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [nic, setNic] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [loanType, setLoanType] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loanTypeOptions, setLoanTypeOptions] = useState<{ label: string; value: string; key: string }[]>([]);
  const [areaOptions, setAreaOptions] = useState<{ label: string; value: string; key: string }[]>([]);

  const handleSubmit = async () => {
    if (!name || !nic || !contact || !address || !loanType) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = null;

      if (image) {
        console.log('Uploading image to Cloudinary...');
        const formData = new FormData();
        formData.append('file', {
          uri: image,
          type: 'image/jpeg',
          name: 'upload.jpg',
        } as unknown as Blob);
        formData.append('upload_preset', 'customer_upload');

        const uploadResponse = await axios.post(
          'https://api.cloudinary.com/v1_1/dxy6wulao/image/upload',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
          }
        );

        imageUrl = uploadResponse.data.secure_url;
        console.log('Image uploaded. Cloudinary URL:', imageUrl);
      }

      console.log('Saving customer data to Firestore...');
      await addDoc(collection(db, 'customers'), {
        name,
        nic,
        contact,
        address,
        loanType,
        area,
        status:'pending',
        customerPicture: imageUrl,
        createdAt: new Date(),
      });

      console.log('Customer data saved to Firestore.');
      Alert.alert('Success', 'Customer registered successfully!');

      setName('');
      setNic('');
      setContact('');
      setAddress('');
      setLoanType('');
      setArea('');
      setImage(null);
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const loanTypeSnapshot = await getDocs(collection(db, 'loanPlan'));
        const loanTypes = loanTypeSnapshot.docs.map(doc => ({
          label: doc.data().name,
          value: doc.data().name,
          key: doc.id,
        }));
        setLoanTypeOptions(loanTypes);

        const areaSnapshot = await getDocs(collection(db, 'employees'));
        const areas = areaSnapshot.docs
          .map(doc => {
            const areaVal = doc.data().area;
            return areaVal
              ? {
                  label: areaVal,
                  value: areaVal,
                  key: doc.id,
                }
              : null;
          })
          .filter((item): item is { label: string; value: string; key: string } => item !== null);
        setAreaOptions(areas);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };

    fetchDropdownData();
  }, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Camera roll permission is needed!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  if (isLoading) {
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
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 bg-gray-50 min-h-screen">
        <View className="bg-green-500 pt-12 pb-8 px-6 rounded-b-3xl shadow-xl">
          <Text className="text-white text-3xl font-bold text-center uppercase tracking-wider mb-2">
            Customer Registration
          </Text>
          <Text className="text-gray-200 text-center text-sm italic">
            Create a new customer profile
          </Text>
        </View>

        <View className="flex-1 px-6 -mt-6">
          <View className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-green-100 mb-6">
            <View className="mb-6">
              <Image
                source={require('../../assets/images/logo.png')}
                className="w-24 h-24 rounded-full self-center"
                resizeMode="cover"
              />
              <Text className="text-2xl font-bold text-gray-800 text-center mb-2">
                Registration Form
              </Text>
              <View className="h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full w-20 mx-auto" />
            </View>

            <View className="space-y-5">
              <View>
                <Text className="text-gray-700 font-semibold">Full Name</Text>
                <TextInput
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  className="bg-gray-50 border border-gray-500 focus:border-green-300 p-4 rounded-2xl text-base shadow-sm"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View className='mt-4'>
                <Text className="text-gray-700 font-semibold">NIC Number</Text>
                <TextInput
                  placeholder="Enter your NIC number"
                  value={nic}
                  onChangeText={setNic}
                  className="bg-gray-50 border border-gray-500 focus:border-green-300 p-4 rounded-2xl text-base shadow-sm"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View className='mt-4'>
                <Text className="text-gray-700 font-semibold">Contact Number</Text>
                <TextInput
                  placeholder="Enter your phone number"
                  value={contact}
                  onChangeText={setContact}
                  keyboardType="phone-pad"
                  className="bg-gray-50 border border-gray-500 focus:border-green-300 p-4 rounded-2xl text-base shadow-sm"
                  placeholderTextColor="#9CA3AF"
                />
              </View>


              <View className='mt-4'>
                <Text className="text-gray-700 font-semibold">Loan Type</Text>
                <View className="border border-gray-500 rounded-2xl">
                  <RNPickerSelect
                    placeholder={{ label: 'Select loan type...', value: null }}
                    value={loanType}
                    onValueChange={setLoanType}
                    items={loanTypeOptions}
                    style={{
                      inputIOS: { fontSize: 14, paddingVertical: 5, paddingHorizontal: 5 },
                      inputAndroid: { fontSize: 14, paddingVertical: 2, paddingHorizontal: 5 },
                    }}
                  />
                </View>
              </View>



               <View className='mt-4'>
                <Text className="text-gray-700 font-semibold">Address</Text>
                <TextInput
                  placeholder="Enter your complete address"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                  textAlignVertical="top"
                  className="bg-gray-50 border border-gray-500 focus:border-green-300 p-4 rounded-2xl text-base shadow-sm h-24"
                  placeholderTextColor="#9CA3AF"
                />
              </View>



               <View className="mt-4">
                <Text className="text-gray-700 font-semibold mb-1 ml-1"> Area</Text>
                <View className="border border-gray-500 rounded-2xl">
                  <RNPickerSelect
                    placeholder={{ label: 'Select area...', value: null }}
                    value={area}
                    onValueChange={setArea}
                    items={areaOptions}
                    style={{
                      inputIOS: { fontSize: 14, paddingVertical: 5, paddingHorizontal: 5 },
                      inputAndroid: { fontSize: 14, paddingVertical: 2, paddingHorizontal: 5 },
                    }}
                  />
                </View>
              </View>

              <View className='mt-4'>
                <Text className="text-gray-700 font-semibold">Upload Profile Picture</Text>
                <Pressable
                  onPress={pickImage}
                  className="bg-gray-50 border border-gray-500 p-4 rounded-2xl items-center mt-1"
                  android_ripple={{ color: '#a7f3d0' }}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{ width: 100, height: 100, borderRadius: 12, marginBottom: 8 }}
                    />
                  ) : (
                    <Text className="text-gray-500 text-sm">Tap to upload an image</Text>
                  )}
                </Pressable>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                className="bg-green-500 p-5 rounded-2xl items-center mt-8 shadow-xl active:scale-95"
              >
                <Text className="text-white text-xl font-bold uppercase tracking-wider">
                  Register Customer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
