// app/search.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { Component } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../firebase';

interface SearchState {
  searchId: string;
  searchResult: {
    id: string;
    name: string;
    nic: string;
    address: string;
    profilePhoto: string;
    balance: number;
    weeklyPayments: {
      monday: 'paid' | 'unpaid';
      tuesday: 'paid' | 'unpaid';
      wednesday: 'paid' | 'unpaid';
      thursday: 'paid' | 'unpaid';
      friday: 'paid' | 'unpaid';
    };
<<<<<<< HEAD
=======
    status: 'pending' | 'approve'; // <-- add status
>>>>>>> origin/rashmikadhanushan
  } | null;
  isSearching: boolean;
  showNotPaidList: boolean;
  notPaidAllWeek: any[];
  isGeneratingPDF: boolean;
}

class advanceSearch extends Component<{}, SearchState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      searchId: '',
      searchResult: null,
      isSearching: false,
      showNotPaidList: false,
      notPaidAllWeek: [],
      isGeneratingPDF: false,
    };
  }

// Firestore collection name
 

private customersCollectionName = 'customers';

  handleSearch = async () => {
    const { searchId } = this.state;
    if (!searchId.trim()) {
      Alert.alert('Error', 'Please enter Name or NIC to search');
      return;
    }

    this.setState({ isSearching: true });

    try {
      // Search in customers collection for profile data
      const customersRef = collection(db, 'customers');
      const accountsRef = collection(db, 'accounts');

      // First, try exact NIC match in customers collection
      const nicQuery = query(customersRef, where('nic', '==', searchId));
      const nicSnap = await getDocs(nicQuery);

      if (!nicSnap.empty) {
        // Found customer profile data
        const customerDoc = nicSnap.docs[0];
        const customerData = customerDoc.data();
        
        // Get payment data from accounts collection
        const accountQuery = query(accountsRef, where('nic', '==', searchId));
        const accountSnap = await getDocs(accountQuery);
        
        let paymentData = {
          monday: 'unpaid',
          tuesday: 'unpaid',
          wednesday: 'unpaid',
          thursday: 'unpaid',
          friday: 'unpaid',
        };
        
        let balance = 0;
        
        if (!accountSnap.empty) {
          const accountData = accountSnap.docs[0].data();
          paymentData = accountData.weeklyPayments || paymentData;
          balance = accountData.balance || 0;
        }

        // Ensure payment data has correct types
        const typedPaymentData = {
          monday: (paymentData.monday as 'paid' | 'unpaid') || 'unpaid',
          tuesday: (paymentData.tuesday as 'paid' | 'unpaid') || 'unpaid',
          wednesday: (paymentData.wednesday as 'paid' | 'unpaid') || 'unpaid',
          thursday: (paymentData.thursday as 'paid' | 'unpaid') || 'unpaid',
          friday: (paymentData.friday as 'paid' | 'unpaid') || 'unpaid',
        };

        const result = {
          id: customerDoc.id,
          name: customerData.name,
          nic: customerData.nic,
          address: customerData.address || 'No Address',
          profilePhoto: customerData.customerPicture || 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=PN',
          balance: balance,
          weeklyPayments: typedPaymentData,
<<<<<<< HEAD
=======
          status: customerData.status || 'Unknown', // <-- add status
>>>>>>> origin/rashmikadhanushan
        };

        this.setState({
          searchResult: result,
          isSearching: false,
        });
        return;
      }

    // If not found by NIC, search by name
    // Get all customers and filter by name (case-insensitive)
    const allCustomersSnap = await getDocs(customersRef);
    const searchTerm = searchId.toLowerCase().trim();
    let foundCustomer: any = null;
    
    allCustomersSnap.forEach((doc) => {
      const data = doc.data();
      const customerName = data.name?.toLowerCase() || '';
      
      // Check if the customer name contains the search term
      if (customerName.includes(searchTerm)) {
        foundCustomer = {
          id: doc.id,
          ...data
        };
      }
    });

    if (foundCustomer) {
      // Get payment data from accounts collection for this customer
      const accountQuery = query(accountsRef, where('nic', '==', foundCustomer.nic));
      const accountSnap = await getDocs(accountQuery);
      
      let paymentData = {
        monday: 'unpaid',
        tuesday: 'unpaid',
        wednesday: 'unpaid',
        thursday: 'unpaid',
        friday: 'unpaid',
      };
      
      let balance = 0;
      
      if (!accountSnap.empty) {
        const accountData = accountSnap.docs[0].data();
        paymentData = accountData.weeklyPayments || paymentData;
        balance = accountData.balance || 0;
      }

      // Ensure payment data has correct types
      const typedPaymentData = {
        monday: (paymentData.monday as 'paid' | 'unpaid') || 'unpaid',
        tuesday: (paymentData.tuesday as 'paid' | 'unpaid') || 'unpaid',
        wednesday: (paymentData.wednesday as 'paid' | 'unpaid') || 'unpaid',
        thursday: (paymentData.thursday as 'paid' | 'unpaid') || 'unpaid',
        friday: (paymentData.friday as 'paid' | 'unpaid') || 'unpaid',
      };

      const result = {
        id: foundCustomer.id,
        name: foundCustomer.name,
        nic: foundCustomer.nic,
        address: foundCustomer.address || 'No Address',
        profilePhoto: foundCustomer.customerPicture || 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=PN',
        balance: balance,
        weeklyPayments: typedPaymentData,
<<<<<<< HEAD
=======
        status: foundCustomer.status || 'Unknown', // <-- add status
>>>>>>> origin/rashmikadhanushan
      };

      this.setState({
        searchResult: result,
        isSearching: false,
      });
    } else {
      this.setState({ searchResult: null, isSearching: false });
      Alert.alert('Not Found', 'No customer found with this name or NIC');
    }

  } catch (error) {
    console.error('Error searching customer:', error);
    this.setState({ searchResult: null, isSearching: false });
    Alert.alert('Error', 'Failed to search customer. Please try again.');
  }
};

  handleClearSearch = () => {
    this.setState({ 
      searchId: '', 
      searchResult: null
    });
  };



  getDayName = (day: string) => {
    const dayNames = {
      monday: 'Monday',
      tuesday: 'Tuesday', 
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday'
    };
    return dayNames[day as keyof typeof dayNames] || day;
  };

  getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    return days[today];
  };

  handleMarkNotPaid = async () => {
    const { searchResult } = this.state;
    if (!searchResult) return;
    try {
      const stored = await AsyncStorage.getItem('notToPayCustomers');
      let list = stored ? JSON.parse(stored) : [];
      // Avoid duplicates
      if (!list.find((c: any) => c.id === searchResult.id)) {
        list.push(searchResult);
        await AsyncStorage.setItem('notToPayCustomers', JSON.stringify(list));
        Alert.alert('Success', 'Customer marked as not to pay!');
      } else {
        Alert.alert('Info', 'Customer already marked as not to pay.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to mark customer.');
    }
  };

  // Method to filter customers who have not paid all 5 days
  filterNotPaidAllWeek = async () => {
    try {
      // Get all customers from customers collection
      const customersRef = collection(db, 'customers');
      const allCustomersSnap = await getDocs(customersRef);
      const notPaidList: any[] = [];
      
      // Get all accounts from accounts collection
      const accountsRef = collection(db, 'accounts');
      const allAccountsSnap = await getDocs(accountsRef);
      
      // Create a map of NIC to account data for quick lookup
      const accountsMap = new Map();
      allAccountsSnap.forEach((doc) => {
        const data = doc.data();
        accountsMap.set(data.nic, data);
      });
      
      // Check each customer
      allCustomersSnap.forEach((doc) => {
        const customerData = doc.data();
        const nic = customerData.nic;
        
        // Get payment data from accounts collection
        const accountData = accountsMap.get(nic);
        let weeklyPayments = {
          monday: 'unpaid',
          tuesday: 'unpaid',
          wednesday: 'unpaid',
          thursday: 'unpaid',
          friday: 'unpaid',
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
      
      this.setState({ notPaidAllWeek: notPaidList });
    } catch (error) {
      console.error('Error fetching not paid customers:', error);
      Alert.alert('Error', 'Failed to fetch not paid customers.');
    }
  };

  // Method to update payment status
  updatePaymentStatus = async (customerId: string, day: string, status: 'paid' | 'unpaid') => {
    try {
      // Get the customer's NIC to find the corresponding account
      const customerDocRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerDocRef);
      
      if (!customerDoc.exists()) {
        Alert.alert('Error', 'Customer not found.');
        return;
      }
      
      const customerData = customerDoc.data();
      const nic = customerData.nic;
      
      // Find the account document with the same NIC
      const accountsRef = collection(db, 'accounts');
      const accountQuery = query(accountsRef, where('nic', '==', nic));
      const accountSnap = await getDocs(accountQuery);
      
      if (accountSnap.empty) {
        Alert.alert('Error', 'Account not found for this customer.');
        return;
      }
      
      const accountDocRef = doc(db, 'accounts', accountSnap.docs[0].id);
      // Update the specific day's payment status in accounts collection
      await updateDoc(accountDocRef, {
        [`weeklyPayments.${day}`]: status,
      });
      // Refresh the search result to reflect the update
      if (this.state.searchResult && this.state.searchResult.id === customerId) {
        this.setState((prevState) => ({
          searchResult: {
            ...prevState.searchResult!,
            weeklyPayments: {
              ...prevState.searchResult!.weeklyPayments,
              [day]: status,
            },
          },
        }));
      }
      Alert.alert('Success', `Marked ${this.getDayName(day) || day} as ${status.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment status.');
    }
  };

  // Method to generate PDF for individual customer search result
  generateCustomerPDF = async () => {
    const { searchResult } = this.state;
    if (!searchResult) {
      Alert.alert('No Data', 'No customer data to generate PDF');
      return;
    }

    try {
      this.setState({ isGeneratingPDF: true });

      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Customer Payment Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #4A90E2;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #4A90E2;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .customer-info {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
              border-left: 4px solid #4A90E2;
            }
            .customer-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-top: 15px;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .detail-value {
              color: #333;
            }
            .payment-status {
              margin-top: 20px;
              padding: 15px;
              background-color: #fff;
              border-radius: 8px;
              border: 1px solid #ddd;
            }
            .payment-days {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
            }
            .day-status {
              text-align: center;
              padding: 10px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: bold;
              flex: 1;
              margin: 0 2px;
            }
            .paid {
              background-color: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .unpaid {
              background-color: #f8d7da;
              color: #721c24;
              border: 1px solid #f5c6cb;
            }
            .summary {
              margin-top: 20px;
              padding: 15px;
              background-color: #e9ecef;
              border-radius: 8px;
              border-left: 4px solid #28a745;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Customer Payment Report</h1>
            <p><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</p>
          </div>

          <div class="customer-info">
            <h3 style="margin-top: 0; color: #4A90E2;">👤 Customer Information</h3>
            <div class="customer-details">
              <div class="detail-item">
                <span class="detail-label">Customer ID:</span>
                <span class="detail-value">${searchResult.id}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${searchResult.name}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">NIC:</span>
                <span class="detail-value">${searchResult.nic}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${searchResult.address}</span>
              </div>
            </div>
          </div>

          <div class="payment-status">
            <h3 style="margin-top: 0; color: #333;">💰 Weekly Payment Status</h3>
            <div class="payment-days">
              <div class="day-status ${searchResult.weeklyPayments.monday}">MON<br>${searchResult.weeklyPayments.monday.toUpperCase()}</div>
              <div class="day-status ${searchResult.weeklyPayments.tuesday}">TUE<br>${searchResult.weeklyPayments.tuesday.toUpperCase()}</div>
              <div class="day-status ${searchResult.weeklyPayments.wednesday}">WED<br>${searchResult.weeklyPayments.wednesday.toUpperCase()}</div>
              <div class="day-status ${searchResult.weeklyPayments.thursday}">THU<br>${searchResult.weeklyPayments.thursday.toUpperCase()}</div>
              <div class="day-status ${searchResult.weeklyPayments.friday}">FRI<br>${searchResult.weeklyPayments.friday.toUpperCase()}</div>
            </div>
          </div>

          <div class="summary">
            <h3 style="margin-top: 0; color: #28a745;">📊 Payment Summary</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong>Paid Days:</strong> ${Object.values(searchResult.weeklyPayments).filter(status => status === 'paid').length}/5
              </div>
              <div>
                <strong>Unpaid Days:</strong> ${Object.values(searchResult.weeklyPayments).filter(status => status === 'unpaid').length}/5
              </div>
              <div style="grid-column: 1 / -1;">
                <strong>Total Balance:</strong> Rs. ${(searchResult.balance || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div class="footer">
            <p>📱 Generated from Customer Payment Management System</p>
            <p>This report shows the current payment status for ${searchResult.name}</p>
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
          dialogTitle: 'Share Customer Payment Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', `PDF generated successfully!\nSaved to: ${uri}`);
      }

      this.setState({ isGeneratingPDF: false });

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.setState({ isGeneratingPDF: false });
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  // Method to generate PDF for customers who haven't paid for 5 days
  generateNotPaidPDF = async () => {
    try {
      const { notPaidAllWeek } = this.state;
      
      if (notPaidAllWeek.length === 0) {
        Alert.alert('No Data', 'No customers found who haven\'t paid for all 5 days.');
        return;
      }

      this.setState({ isGeneratingPDF: true });

      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Customers Not Paid Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #4A90E2;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #4A90E2;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .summary {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border-left: 4px solid #dc3545;
            }
            .customer-list {
              margin-top: 20px;
            }
            .customer-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              background-color: #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .customer-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .customer-name {
              font-size: 18px;
              font-weight: bold;
              color: #2c3e50;
            }
            .status-badge {
              background-color: #dc3545;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
            }
            .customer-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 10px;
            }
            .detail-item {
              display: flex;
              justify-content: space-between;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .detail-value {
              color: #333;
            }
            .payment-status {
              margin-top: 15px;
              padding: 10px;
              background-color: #fff5f5;
              border-radius: 5px;
              border: 1px solid #fed7d7;
            }
            .payment-days {
              display: flex;
              justify-content: space-between;
              margin-top: 8px;
            }
            .day-status {
              text-align: center;
              padding: 5px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .unpaid {
              background-color: #fed7d7;
              color: #c53030;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚫 Customers Not Paid Report</h1>
            <p><strong>Report Generated:</strong> ${currentDate} at ${currentTime}</p>
            <p><strong>Total Customers:</strong> ${notPaidAllWeek.length}</p>
          </div>

          <div class="summary">
            <h3 style="margin-top: 0; color: #dc3545;">⚠️ Summary</h3>
            <p><strong>${notPaidAllWeek.length}</strong> customers have not made any payments for all 5 working days (Monday to Friday).</p>
            <p>This report shows customers who require immediate attention for payment collection.</p>
          </div>

          <div class="customer-list">
            <h3>📋 Customer Details</h3>
            ${notPaidAllWeek.map((customer, index) => `
              <div class="customer-card">
                <div class="customer-header">
                  <div class="customer-name">${index + 1}. ${customer.name}</div>
                  <div class="status-badge">NOT PAID</div>
                </div>
                
                <div class="customer-details">
                  <div class="detail-item">
                    <span class="detail-label">Customer ID:</span>
                    <span class="detail-value">${customer.id}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">NIC:</span>
                    <span class="detail-value">${customer.nic}</span>
                  </div>
                  <div class="detail-item" style="grid-column: 1 / -1;">
                    <span class="detail-label">Address:</span>
                    <span class="detail-value">${customer.address}</span>
                  </div>
                </div>

                <div class="payment-status">
                  <strong>Weekly Payment Status:</strong>
                  <div class="payment-days">
                    <div class="day-status unpaid">MON<br>UNPAID</div>
                    <div class="day-status unpaid">TUE<br>UNPAID</div>
                    <div class="day-status unpaid">WED<br>UNPAID</div>
                    <div class="day-status unpaid">THU<br>UNPAID</div>
                    <div class="day-status unpaid">FRI<br>UNPAID</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>📱 Generated from Customer Payment Management System</p>
            <p>This is an automated report. Please verify payment status before taking action.</p>
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

      this.setState({ isGeneratingPDF: false });

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.setState({ isGeneratingPDF: false });
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };
  
  render() {
    const { searchId, searchResult, isSearching, showNotPaidList, notPaidAllWeek, isGeneratingPDF } = this.state;
    const currentDay = this.getCurrentDay();

    return (
      <ScrollView className="flex-1 bg-white">
        <View className="p-5">

          {/* Toggle Button */}
          <View className="flex-row items-center justify-end mb-4">
            <Text className="mr-2 font-bold text-gray-700">Show 5 Days Not Paid</Text>
            <TouchableOpacity
              className={`w-12 h-7 rounded-full ${showNotPaidList ? 'bg-green-500' : 'bg-gray-300'} justify-center`}
              onPress={() => {
                if (!showNotPaidList) this.filterNotPaidAllWeek();
                this.setState({ showNotPaidList: !showNotPaidList });
              }}
            >
              <View
                className={`w-6 h-6 rounded-full bg-white shadow ${showNotPaidList ? 'ml-6' : 'ml-1'}`}
              />
            </TouchableOpacity>
          </View>

          {/* Conditional UI */}
          {showNotPaidList ? (
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-red-600">Customers Not Paid All 5 Days</Text>
                {notPaidAllWeek.length > 0 && (
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg flex-row items-center ${isGeneratingPDF ? 'bg-gray-400' : 'bg-blue-600'}`}
                    onPress={this.generateNotPaidPDF}
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Ionicons name="hourglass" size={16} color="#fff" />
                        <Text className="text-white font-bold ml-2 text-sm">Generating...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="document-text" size={16} color="#fff" />
                        <Text className="text-white font-bold ml-2 text-sm">Generate PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              {notPaidAllWeek.length === 0 ? (
                <View className="bg-green-50 p-6 rounded-2xl border-2 border-green-200 items-center">
                  <Ionicons name="checkmark-circle" size={50} color="#10B981" />
                  <Text className="text-center text-green-600 font-bold mt-2">Great News!</Text>
                  <Text className="text-center text-gray-600 mt-1">All customers have made at least one payment this week.</Text>
                </View>
              ) : (
                <>
                  <View className="bg-red-50 p-4 rounded-lg mb-4 border-l-4 border-red-500">
                    <Text className="text-red-700 font-bold">⚠️ Alert: {notPaidAllWeek.length} customers need immediate attention</Text>
<<<<<<< HEAD
<<<<<<< HEAD
                    <Text className="text-red-600 text-sm mt-1">These customers havent paid for any day this week.</Text>
=======
                    <Text className="text-red-600 text-sm mt-1">These customers haven't paid for any day this week.</Text>
>>>>>>> 6ac60dd0a4635dbc60c9298eba4f3a4c65b1e211
=======
                    <Text className="text-red-600 text-sm mt-1">These customers haven't paid for any day this week.</Text>
>>>>>>> origin/rashmikadhanushan
                  </View>
                  
                  {notPaidAllWeek.map((customer, index) => (
                    <View key={customer.id} className="flex-row items-center p-4 mb-3 bg-red-50 rounded-2xl border-2 border-red-200">
                      <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mr-3">
                        <Text className="text-red-600 font-bold text-sm">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-gray-800 text-base">{customer.name || 'Unknown Name'}</Text>
                        <Text className="text-gray-600 text-sm">NIC: {customer.nic || 'No NIC'}</Text>
                        <Text className="text-gray-600 text-sm">📍 {customer.address || 'No Address'}</Text>
                        <Text className={`text-sm font-bold ${(customer.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Balance: Rs. {(customer.balance || 0).toLocaleString()}
                        </Text>
                      </View>
                      <View className="items-center">
                        <View className="bg-red-500 px-3 py-1 rounded-full">
                          <Text className="text-white font-bold text-xs">NOT PAID</Text>
                        </View>
                        <Text className="text-red-500 text-xs mt-1">0/5 Days</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          ) : (
<<<<<<< HEAD
           <>   {/* Search Section */}
=======
            <View>
              {/* Search Section */}
>>>>>>> origin/rashmikadhanushan
              <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                <Text className="text-lg font-bold mb-4 text-gray-800">Customer Search</Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-100 mb-4">
                  <TextInput
                    className="flex-1 p-4 text-base text-gray-800"
                    placeholder="Enter Customer Name or NIC"
                    value={searchId}
                    onChangeText={(text) => this.setState({ searchId: text })}
                    autoCapitalize="none"
                  />
                  {searchId.length > 0 && (
                    <TouchableOpacity 
                      className="p-4" 
                      onPress={this.handleClearSearch}
                    >
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity 
                  className={`flex-row items-center justify-center bg-green-500 p-4 rounded-lg ${isSearching ? 'bg-gray-400' : ''}`} 
                  onPress={this.handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Text className="text-white text-base font-bold">Searching...</Text>
                  ) : (
                    <>
                      <Ionicons name="search" size={20} color="#fff" />
                      <Text className="text-white text-base font-bold ml-2">Search</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Search Results */}
              {searchResult && (
<<<<<<< HEAD
                <>
                  {/* Profile Section */}
                  <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                    <Text className="text-lg font-bold mb-4 text-gray-800">Customer Details</Text>
                    
=======
                <View>
                  {/* Profile Section */}
                  <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                    <Text className="text-lg font-bold mb-4 text-gray-800">Customer Details</Text>
>>>>>>> origin/rashmikadhanushan
                    <View className="items-center mb-5">
                      <Image
                        source={{ uri: searchResult.profilePhoto }}
                        className="w-24 h-24 rounded-full border-4 border-blue-700"
                      />
                    </View>
<<<<<<< HEAD

=======
>>>>>>> origin/rashmikadhanushan
                    <View className="space-y-3">
                      <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                        <Text className="text-base font-bold text-gray-600">ID:</Text>
                        <Text className="text-base font-bold text-gray-800">{searchResult.id || 'No ID'}</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                        <Text className="text-base font-bold text-gray-600">Name:</Text>
                        <Text className="text-base font-bold text-gray-800">{searchResult.name || 'No Name'}</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                        <Text className="text-base font-bold text-gray-600">NIC:</Text>
                        <Text className="text-base font-bold text-gray-800">{searchResult.nic || 'No NIC'}</Text>
                      </View>
                      <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                        <Text className="text-base font-bold text-gray-600">Address:</Text>
                        <Text className="text-base font-bold text-gray-800">{searchResult.address || 'No Address'}</Text>
                      </View>
<<<<<<< HEAD
                      
=======
                      <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                        <Text className="text-base font-bold text-gray-600">Status:</Text>
                        <Text className={`text-base font-bold ${searchResult.status === 'approve' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {searchResult.status ? searchResult.status.charAt(0).toUpperCase() + searchResult.status.slice(1) : 'Unknown'}
                        </Text>
                      </View>
>>>>>>> origin/rashmikadhanushan
                    </View>
                  </View>

                  {/* Weekly Payment Status */}
                  <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                    <Text className="text-lg font-bold mb-4 text-gray-800">Weekly Loan Payment Status</Text>
                    <Text className="text-base font-bold text-center mb-5 text-blue-500">
                      Today is {this.getDayName(currentDay as any) || currentDay}{currentDay !== 'saturday' && currentDay !== 'sunday' ? ' ✓' : ''}
                    </Text>
                    
                    <View className="space-y-3 mb-2">
                      {Object.entries(searchResult.weeklyPayments).map(([day, status]) => (
<<<<<<< HEAD
                        <TouchableOpacity
                          key={day}
                          className={`flex-row items-center justify-between p-4 rounded-lg border-2  mb-5 relative ${status === 'paid' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} ${day === currentDay ? 'border-3 border-blue-500 bg-blue-100' : ''}`}
                          onPress={() => {
                            // Direct toggle: if paid, make unpaid; if unpaid, make paid
                            const newStatus = status === 'paid' ? 'unpaid' : 'paid';
                            this.updatePaymentStatus(searchResult.id, day, newStatus);
                          }}
                        >
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-800">{this.getDayName(day) || day}</Text>
                            <Text className="text-xs text-gray-500">Tap to toggle status</Text>
=======
                        <View
                          key={day}
                          className={`flex-row items-center justify-between p-4 rounded-lg border-2 mb-5 relative ${status === 'paid' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} ${day === currentDay ? 'border-3 border-blue-500 bg-blue-100' : ''}`}
                        >
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-800">{this.getDayName(day) || day}</Text>
                            <Text className="text-xs text-gray-500">Payment Status</Text>
>>>>>>> origin/rashmikadhanushan
                          </View>
                          <View className="flex-row items-center space-x-2">
                            <Ionicons
                              name={status === 'paid' ? 'checkmark-circle' : 'close-circle'}
                              size={24}
                              color={status === 'paid' ? '#4CAF50' : '#F44336'}
                            />
                            <Text className={`text-sm font-bold ${status === 'paid' ? 'text-green-500' : 'text-red-500'}`}>
                              {status.toUpperCase()}
                            </Text>
<<<<<<< HEAD
                            <Ionicons name="chevron-forward" size={16} color="#666" />
=======
>>>>>>> origin/rashmikadhanushan
                          </View>
                          {day === currentDay && (
                            <View className="absolute top-[-8px] right-[-8px] bg-blue-500 px-2 py-1 rounded-full">
                              <Text className="text-white text-xs font-bold">TODAY</Text>
                            </View>
                          )}
<<<<<<< HEAD
                        </TouchableOpacity>
=======
                        </View>
>>>>>>> origin/rashmikadhanushan
                      ))}
                    </View>

                    {/* Summary */}
                    <View className="mt-5 p-4 bg-gray-100 rounded-lg">
                      <Text className="text-base font-bold text-gray-800 mb-2">Payment Summary</Text>
<<<<<<< HEAD
=======
                      <Text className="text-xs text-blue-600 mb-2">
                        Total Balance amount comes from the <Text className="font-bold">accounts</Text> database
                      </Text>
>>>>>>> origin/rashmikadhanushan
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-sm text-gray-600">Paid Days:</Text>
                        <Text className="text-sm font-bold text-green-500">
                          {Object.values(searchResult.weeklyPayments).filter(status => status === 'paid').length}/5
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-sm text-gray-600">Unpaid Days:</Text>
                        <Text className="text-sm font-bold text-red-500">
                          {Object.values(searchResult.weeklyPayments).filter(status => status === 'unpaid').length}/5
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center pt-2 border-t border-gray-300">
                        <Text className="text-sm text-gray-600">Total Balance:</Text>
                        <Text className={`text-sm font-bold ${(searchResult.balance || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          Rs. {(searchResult.balance || 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Mark as Not Paid Button */}
                  <TouchableOpacity
                    className="bg-red-600 p-4 rounded-lg items-center mt-4"
                    onPress={this.handleMarkNotPaid}
                  >
                    <Text className="text-white font-bold">Mark as Not Paid</Text>
                  </TouchableOpacity>

                  {/* Generate PDF Button */}
                  <TouchableOpacity
                    className={`flex-row items-center justify-center p-4 rounded-lg mt-3 ${isGeneratingPDF ? 'bg-gray-400' : 'bg-blue-600'}`}
                    onPress={this.generateCustomerPDF}
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Ionicons name="hourglass" size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">Generating PDF...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="document-text" size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">Generate Customer PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
<<<<<<< HEAD
                </>
              )}
            </>
=======
                </View>
              )}
            </View>
>>>>>>> origin/rashmikadhanushan
          )}
        </View>
      </ScrollView>
    );
  }
}

export default advanceSearch;
