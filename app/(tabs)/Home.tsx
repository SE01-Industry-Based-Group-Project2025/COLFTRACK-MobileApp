import LoanOfficer from '@/components/LoanOfficer';
import Rider from '@/components/Rider';
import { auth, db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

type EmployeeData = {
  role: string;
};

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeeData | null>(null);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const handleHome = async () => {
      if (!userId) {
        setLoading(false);
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      try {
        const docRef = doc(db, 'employees', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data() as EmployeeData); // past vlaue to usestate 
        } else {
          Alert.alert('Failed to load profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    handleHome();
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
    <View className="flex-1 bg-white">
      {/* Employee Role */}
      {data?.role === 'rider' ? <Rider /> : <LoanOfficer />}
    </View>
  );
};

export default HomeScreen;
