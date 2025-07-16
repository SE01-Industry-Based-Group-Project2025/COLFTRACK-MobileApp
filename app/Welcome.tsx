import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import '../global.css';


const WelcomeScreen = () => {

  const router = useRouter(); // Initialize router

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/Login");
    }, 3800); 

    return () => clearTimeout(timer); // Clean up on unmount
  }, [router]);

  return (
     <View className=" bg flex-1 items-center justify-center bg-white">
      <LottieView
        source={require('../assets/animations/money_rain.json')}
        autoPlay
        loop
        style={{           
          position: 'absolute',
          top: 0,               // Stick to the top
          width: '100%',        // Full width
          height: 500,          // Adjust as needed
          alignSelf: 'center',  // Center horizontally
        }}
      />

      <Image
        source={require('../assets/images/logo.png')}
        className="w-40 h-40 rounded-full mt-30"
        resizeMode="cover" // or "contain"
      />

      
      <Text className=' text-2xl text-green-500 text-center font-bold'>Welcome to ColfTrack</Text>
      <Text className=' text-sm italic text-gray-500 text-center'>Powered by Colf Lanka</Text>

      <LottieView
        source={require('../assets/animations/loading.json')}
        autoPlay
        loop
        style={{
          position: 'absolute',
          bottom: 0,               // Stick to the bottom
          width: '100%',           // Full screen width
          height: 200,             // Adjust height as needed
          alignSelf: 'center',     // Center horizontally
        }}
      />
    </View>
  )
}

export default WelcomeScreen