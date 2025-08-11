
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const FrogetScreen = () => {
  const [froget, setFroget] = useState('');

  const handleFroget = () => {
     // Add your forgot password logic here
     
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
            className="border border-gray-300 rounded-xl px-4 py-3  text-gray-800 text-base"
            placeholder="Email Address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setFroget}
            value={froget}
        />

         <View className="items-center">
            <TouchableOpacity
              className="bg-green-500 h-10 w-48 rounded-xl items-center shadow-md mt-4 justify-center"
              onPress={handleFroget}
             >
            <Text className="text-white text-lg font-semibold">Sent</Text>
            </TouchableOpacity>
        </View>
      
    </View>
  )
}

export default FrogetScreen