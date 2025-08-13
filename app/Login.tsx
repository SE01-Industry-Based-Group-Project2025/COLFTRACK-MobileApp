import { auth, db } from '@/firebase';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth/react-native';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // <-- NEW state

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert('Please fill in all fields');
      return;
    }

    setLoading(true); // Start loading

    try {
      // Step 1: Check employee status BEFORE login
      const employeeRef = collection(db, 'employees');
      const querySnapshot = await getDocs(query(employeeRef, where('email', '==', email)));

      if (querySnapshot.empty) {
        Alert.alert('No account found. Please check your email.');
        return;
      }

      const userData = querySnapshot.docs[0].data();
      const userId = querySnapshot.docs[0].id;

      if (userData.status === 'Inactive') {
        Alert.alert('Your account has been deactivated. Please contact admin.');
        return;
      }

      // Step 2: User is active, proceed to login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "employees", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (!userData.lastLogin) {
          await updateDoc(userRef, { lastLogin: user.metadata.lastSignInTime });
          router.push("/Reset");
        } else {
          await updateDoc(userRef, { lastLogin: user.metadata.lastSignInTime });
          router.replace('/(tabs)/Home');
        }
      }

    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-8 justify-center">
          <View className="bg-white rounded-3xl p-8 shadow-lg mt-5">
            <Image
              source={require('../assets/images/logo.png')}
              className="w-24 h-24 rounded-full self-center"
              resizeMode="cover"
            />
            <Text className="text-4xl font-extrabold text-green-500 mb-6 text-center">
              Welcome Back
            </Text>

            <LottieView
              source={require('../assets/animations/login.json')}
              autoPlay
              loop
              style={{
                width: 250,
                height: 250,
                alignSelf: 'center',
                marginBottom: 20,
              }}
            />

            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-800 text-base"
              placeholder="Email Address"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />

            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-2 text-gray-800 text-base"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />

            <Link href="/Froget">
              <Text className="text-blue-700 text-sm text-right mb-4">
                Forgot Password?
              </Text>
            </Link>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center shadow-md mt-4 ${loading ? 'bg-gray-400' : 'bg-green-500'}`}
              onPress={signIn}
              disabled={loading} // <-- disable when loading
            >
              <Text className="text-white text-lg font-semibold">
                {loading ? 'Signing In...' : 'Sign In'} {/* <-- Show status */}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
