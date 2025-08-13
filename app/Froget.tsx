import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase';

const ForgotScreen = () => {
  const [email, setEmail] = useState('');

  const handleForgot = async () => {
    
    
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Check your email for password reset instructions.');
      setEmail('');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong.');
    }
  };

  return (
    <View className="flex-1 p-8 pt-32 justify-start">
      <LottieView
        source={require('../assets/animations/froget.json')}
        autoPlay
        loop
        style={{
          width: 300,
          height: 450,
          alignSelf: 'center',
        }}
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base"
        placeholder="Email Address"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
      />

      <View className="items-center">
        <TouchableOpacity
          className="bg-green-500 h-10 w-48 rounded-xl items-center shadow-md mt-4 justify-center"
          onPress={handleForgot}
        >
          <Text className="text-white text-lg font-semibold">Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotScreen;
