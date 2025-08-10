import { auth, db } from '@/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
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
  balance?: number;
  weeklyPayments?: {
    monday: 'paid' | 'unpaid';
    tuesday: 'paid' | 'unpaid';
    wednesday: 'paid' | 'unpaid';
    thursday: 'paid' | 'unpaid';
    friday: 'paid' | 'unpaid';
  };
};

export default function LoanOfficer() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMarkedCustomers, setShowMarkedCustomers] = useState(false);
  const [markedCustomers, setMarkedCustomers] = useState<Customer[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const dashboardTips = [
    "Use the search button to find customers.",
    "Mark those who regularly miss payments.",
    "Marked customers will appear here for follow-up."
  ];

  useEffect(() => {
    fetchProfileData();
    fetchNotPaidCustomers();
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

  // Fetch customers who haven't paid for 5 days and add them to marked customers
  const fetchNotPaidCustomers = async () => {
    try {
      // Get all customers from customers collection
      const customersRef = collection(db, 'customers');
      const allCustomersSnap = await getDocs(customersRef);
      
      // Get all accounts from accounts collection
      const accountsRef = collection(db, 'accounts');
      const allAccountsSnap = await getDocs(accountsRef);
      
      // Create a map of NIC to account data for quick lookup
      const accountsMap = new Map();
      allAccountsSnap.forEach((doc) => {
        const data = doc.data();
        accountsMap.set(data.nic, data);
      });
      
      const notPaidList: Customer[] = [];
      
      // Check each customer
      allCustomersSnap.forEach((doc) => {
        const customerData = doc.data();
        const nic = customerData.nic;
        
        // Get payment data from accounts collection
        const accountData = accountsMap.get(nic);
        let weeklyPayments = {
          monday: 'unpaid' as 'paid' | 'unpaid',
          tuesday: 'unpaid' as 'paid' | 'unpaid',
          wednesday: 'unpaid' as 'paid' | 'unpaid',
          thursday: 'unpaid' as 'paid' | 'unpaid',
          friday: 'unpaid' as 'paid' | 'unpaid',
        };
        
        if (accountData && accountData.weeklyPayments) {
          weeklyPayments = accountData.weeklyPayments;
        }
        
        // Check if all 5 days are unpaid
        const allUnpaid = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].every(
          (day) => weeklyPayments[day as keyof typeof weeklyPayments] === 'unpaid'
        );
        
        if (allUnpaid) {
          notPaidList.push({
            id: doc.id,
            name: customerData.name || 'Unknown Name',
            nic: customerData.nic || 'No NIC',
            address: customerData.address || 'No Address',
            profilePhoto: customerData.customerPicture || 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=PN',
            balance: accountData ? (accountData.balance || 0) : 0,
            weeklyPayments: weeklyPayments,
          });
        }
      });
      
      // Get existing marked customers from AsyncStorage
      const stored = await AsyncStorage.getItem('notToPayCustomers');
      const existingMarked = stored ? JSON.parse(stored) : [];
      
      // Combine existing marked customers with not paid customers (avoid duplicates)
      const combinedList = [...existingMarked];
      
      notPaidList.forEach(notPaidCustomer => {
        const exists = combinedList.find((customer: Customer) => customer.id === notPaidCustomer.id);
        if (!exists) {
          combinedList.push(notPaidCustomer);
        }
      });
      
      // Save the combined list back to AsyncStorage
      await AsyncStorage.setItem('notToPayCustomers', JSON.stringify(combinedList));
      
    } catch (error) {
      console.error('Error fetching not paid customers:', error);
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

  const generatePDF = async () => {
    try {
      if (markedCustomers.length === 0) {
        Alert.alert('No Data', 'No marked customers to generate PDF');
        return;
      }

      setIsGeneratingPDF(true);

      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Marked Customers Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e74c3c;
              padding-bottom: 20px;
            }
            .title {
              color: #e74c3c;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 14px;
            }
            .info {
              margin-bottom: 20px;
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
            }
            .customer-list {
              margin-top: 20px;
            }
            .customer-item {
              border: 1px solid #ddd;
              margin-bottom: 15px;
              padding: 15px;
              border-radius: 5px;
              background-color: #fff;
            }
            .customer-name {
              font-size: 18px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            .customer-details {
              color: #666;
              line-height: 1.5;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 15px;
            }
            .count {
              background-color: #e74c3c;
              color: white;
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 14px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🚨 MARKED CUSTOMERS REPORT</div>
            <div class="subtitle">Customers who regularly miss payments</div>
          </div>
          
          <div class="info">
            <p><strong>Generated by:</strong> ${profileData?.firstName || 'Loan Officer'}</p>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Time:</strong> ${currentTime}</p>
            <p><strong>Total Marked Customers:</strong> <span class="count">${markedCustomers.length}</span></p>
          </div>

          <div class="customer-list">
            ${markedCustomers.map((customer, index) => `
              <div class="customer-item">
                <div class="customer-name">${index + 1}. ${customer.name}</div>
                <div class="customer-details">
                  <p><strong>NIC:</strong> ${customer.nic}</p>
                  <p><strong>Address:</strong> ${customer.address}</p>
                  ${customer.balance !== undefined ? `<p><strong>Balance:</strong> Rs. ${(customer.balance || 0).toLocaleString()}</p>` : ''}
                  ${customer.weeklyPayments ? '<p><strong>Status:</strong> <span style="color: #e74c3c; font-weight: bold;">5 Days Not Paid</span></p>' : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>This report was generated automatically by COLFTRACK Mobile App</p>
            <p>Generated on ${currentDate} at ${currentTime}</p>
          </div>
        </body>
        </html>
      `;

       // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Not Paid Customers Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', `PDF generated successfully!\nSaved to: ${uri}`);
      }

      setIsGeneratingPDF(false);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsGeneratingPDF(false);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
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

          {/* PDF Generation Button */}
          <TouchableOpacity
            onPress={generatePDF}
            disabled={isGeneratingPDF}
            className={`${isGeneratingPDF ? 'bg-blue-400' : 'bg-blue-600'} py-3 px-6 rounded-full mb-4 shadow-md`}
            style={{ alignSelf: 'center' }}
          >
            <Text className="text-white font-semibold text-lg">
              {isGeneratingPDF ? '⏳ Generating PDF...' : '📄 Generate PDF Report'}
            </Text>
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
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800">{customer.name}</Text>
                    <Text className="text-gray-600 text-sm">{customer.nic}</Text>
                    <Text className="text-gray-600 text-sm">{customer.address}</Text>
                    {customer.balance !== undefined && (
                      <Text className={`text-sm font-bold ${(customer.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Balance: Rs. {(customer.balance || 0).toLocaleString()}
                      </Text>
                    )}
                    {customer.weeklyPayments && (
                      <Text className="text-xs text-red-500 font-bold">
                        5 Days Not Paid
                      </Text>
                    )}
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
