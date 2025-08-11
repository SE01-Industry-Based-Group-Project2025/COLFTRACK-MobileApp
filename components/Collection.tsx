import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

const logoImage = require('../assets/images/logo.png');

const Hr = () => <View className="border-b border-gray-300 my-4" />;

type ParamList = {
  Collection: {
    customer: {
      name: string;
      nic: string;
      address: string;
      area: string;
      loanType: 'Beginner Plan' | 'Rapid Plan' | 'Advance Plan';
      profilePhoto?: string;
    };
  };
};

const CollectionScreen: React.FC = () => {
  const route = useRoute<RouteProp<ParamList, 'Collection'>>();
  const customer = route.params?.customer;

  const [profileData] = useState({
    name: customer?.name || 'Piyumi Natasha',
    nic: customer?.nic || '123456789V',
    address: customer?.address || 'No 186 Gammamnapara Colombo',
    area: customer?.area || 'Colombo',
    loanType: customer?.loanType || 'Rapid Plan',
    profilePhoto:
      customer?.profilePhoto ||
      'https://img.freepik.com/free-photo/smiling-blonde-business-woman-posing-with-crossed-arms_171337-6291.jpg',
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [imageError, setImageError] = useState(false);

  const showDatePicker = () => {
    setMode('date');
    setShowPicker(true);
  };

  const showTimePicker = () => {
    setMode('time');
    setShowPicker(true);
  };

  const onChange = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const togglePaymentStatus = () => {
    setPaymentStatus((prev) => (prev === 'paid' ? 'unpaid' : 'paid'));
  };

  const handleComplete = () => {
    Alert.alert('✅ Success', 'Task completed successfully!');
  };

  const generatePDF = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Storage permission is required to save the PDF.');
          return;
        }
      }

      const htmlContent = `
        <h1>Payment Details</h1>
        <p><strong>Name:</strong> ${profileData.name}</p>
        <p><strong>NIC:</strong> ${profileData.nic}</p>
        <p><strong>Address:</strong> ${profileData.address}</p>
        <p><strong>Area:</strong> ${profileData.area}</p>
        <p><strong>Loan Type:</strong> ${profileData.loanType}</p>
        <p><strong>Date:</strong> ${selectedDate.toLocaleString()}</p>
        <p><strong>Payment Status:</strong> ${paymentStatus}</p>
        <p><strong>Payment Amount:</strong> ${paymentAmount ? `Rs. ${paymentAmount}` : 'Rs. 0'}</p>
      `;

      const options = {
        html: htmlContent,
        fileName: 'payment_details',
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);

      if (file.filePath) {
        Alert.alert('PDF Generated', `✅ PDF saved to: ${file.filePath}`);
      } else {
        throw new Error('File path not found');
      }
    } catch (error) {
      console.error('PDF Generation Error:', error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {/* 🌟 Logo */}
        <View className="items-center mb-6">
          <Image source={logoImage} className="w-24 h-24 rounded-full" resizeMode="cover" />
        </View>

        {/* 🧑‍💼 Profile Card */}
        <View className="bg-white rounded-3xl shadow p-6 mb-6">
          {!imageError ? (
            <Image
              source={{ uri: profileData.profilePhoto }}
              className="w-32 h-32 rounded-full border-2 border-green-500 self-center mb-4"
              onError={() => setImageError(true)}
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-gray-300 justify-center items-center self-center mb-4 border-2 border-green-500">
              <Ionicons name="person" size={50} color="#1D1E0F" />
            </View>
          )}

          {['name', 'nic', 'address', 'area', 'loanType'].map((key) => (
            <View key={key} className="mb-2">
              <Text className="text-gray-800 font-bold">{key.toUpperCase()}:</Text>
              <Text className="text-gray-600">{(profileData as any)[key]}</Text>
            </View>
          ))}
        </View>

        {/* 📅 Date Picker */}
        <Text className="text-lg font-bold text-gray-800 mb-2">Select Date</Text>
        <TouchableOpacity
          className="flex-row items-center bg-white border border-gray-300 rounded-2xl px-4 py-3 mb-2"
          onPress={showDatePicker}
        >
          <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
          <Text className="flex-1 font-medium ml-3 text-gray-800">
            {selectedDate.toDateString()}
          </Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800 mb-2">Select Time</Text>
        <TouchableOpacity
          className="flex-row items-center bg-white border border-gray-300 rounded-2xl px-4 py-3 mb-4"
          onPress={showTimePicker}
        >
          <Ionicons name="time-outline" size={20} color="#4A90E2" />
          <Text className="flex-1 font-medium ml-3 text-gray-800">
            {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode={mode}
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChange}
          />
        )}

        {/* 💰 Payment Amount */}
        <Text className="text-lg font-bold text-gray-800 mb-2">Payment Amount</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-2xl px-4 py-3 mb-4 text-gray-800"
          placeholder="Enter amount (e.g., 100)"
          keyboardType="numeric"
          value={paymentAmount}
          onChangeText={setPaymentAmount}
        />

        {/* 💵 Payment Status */}
        <Text className="text-lg font-bold text-gray-800 mb-2">Payment Status</Text>
        <TouchableOpacity
          className={`flex-row justify-center items-center px-4 py-3 rounded-2xl mb-6 ${
            paymentStatus === 'paid' ? 'bg-green-500' : 'bg-red-500'
          }`}
          onPress={togglePaymentStatus}
        >
          <Ionicons
            name={paymentStatus === 'paid' ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color="#fff"
          />
          <Text className="text-white font-bold text-lg ml-2">
            {paymentStatus.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* ➖ Horizontal Rule */}
        <Hr />

        <View className="flex-row justify-between items-center space-x-4 gap-2">
          {/* ✅ Complete Button */}
          <TouchableOpacity
            className="flex-1 flex-row justify-center items-center bg-blue-600 rounded-2xl px-4 py-3"
            onPress={handleComplete}
          >
            <Ionicons name="checkmark-done-outline" size={24} color="#fff" />
            <Text className="text-white font-bold text-lg ml-2">Complete</Text>
          </TouchableOpacity>

          {/* 📄 Generate PDF */}
          <TouchableOpacity
            className="flex-1 flex-row justify-center items-center bg-purple-600 rounded-2xl px-4 py-3"
            onPress={generatePDF}
          >
            <Ionicons name="document-outline" size={24} color="#fff" />
            <Text className="text-white font-bold text-lg ml-2">Generate PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CollectionScreen;
