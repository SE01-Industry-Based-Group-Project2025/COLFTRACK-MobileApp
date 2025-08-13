import { Ionicons } from '@expo/vector-icons';
import { printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
    status: 'pending' | 'approve';
    currentDay: string;
    currentDate: string;
    todayPaymentStatus: 'paid' | 'unpaid';
    unpaidDays: {
      date: string;
      day: string;
      status: string;
    }[];
    consecutiveUnpaidDays: number;
  } | null;
  isSearching: boolean;
  showAllUnpaid: boolean;
  showNonPayingCustomers: boolean;
  nonPayingCustomers: Array<{
    id: string;
    name: string;
    nic: string;
    address: string;
    loanType?: string;
    balance: number;
    consecutiveUnpaidDays: number;
    profilePhoto: string;
  }>;
}

class AdvanceSearch extends Component<{}, SearchState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      searchId: '',
      searchResult: null,
      isSearching: false,
      showAllUnpaid: false,
      showNonPayingCustomers: false,
      nonPayingCustomers: [],
    };
  }

  private customersCollectionName = 'customers';

  findNonPayingCustomers = async () => {
    this.setState({ isSearching: true });
    try {
      const customersRef = collection(db, this.customersCollectionName);
      const accountsRef = collection(db, 'accounts');
      
      const allCustomers = await getDocs(customersRef);
      const nonPayingCustomers = [];
      
      for (const customerDoc of allCustomers.docs) {
        const customerData = customerDoc.data();
        const accountQuery = query(accountsRef, where('nic', '==', customerData.nic));
        const accountSnap = await getDocs(accountQuery);
        
        if (!accountSnap.empty) {
          const accountData = accountSnap.docs[0].data();
          const dailyCollections = accountData.dailyCollections || {};
          
          const sortedDates = Object.keys(dailyCollections)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          
          let consecutiveUnpaid = 0;
          let maxConsecutiveUnpaid = 0;
          
          for (const date of sortedDates) {
            if (dailyCollections[date].status === 'unpaid') {
              consecutiveUnpaid++;
              if (consecutiveUnpaid > maxConsecutiveUnpaid) {
                maxConsecutiveUnpaid = consecutiveUnpaid;
              }
            } else {
              consecutiveUnpaid = 0;
            }
          }
          
          if (maxConsecutiveUnpaid >= 5) {
            nonPayingCustomers.push({
              id: customerDoc.id,
              name: customerData.name || 'Unknown Name',
              nic: customerData.nic || 'No NIC',
              address: customerData.address || 'No Address',
              loanType: customerData.loanType || accountData.loanType || 'N/A',
              balance: accountData.balance || 0,
              consecutiveUnpaidDays: maxConsecutiveUnpaid,
              profilePhoto: customerData.customerPicture || 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=PN',
            });
          }
        }
      }
      
      this.setState({
        nonPayingCustomers,
        showNonPayingCustomers: true,
        isSearching: false,
        searchResult: null,
      });
      
    } catch (error) {
      console.error('Error finding non-paying customers:', error);
      this.setState({ isSearching: false });
      Alert.alert('Error', 'Failed to fetch non-paying customers. Please try again.');
    }
  };

  handleSearch = async () => {
    const { searchId } = this.state;
    if (!searchId.trim()) {
      Alert.alert('Error', 'Please enter Name or NIC to search');
      return;
    }

    this.setState({ 
      isSearching: true,
      showNonPayingCustomers: false,
    });

    try {
      const customersRef = collection(db, this.customersCollectionName);
      const accountsRef = collection(db, 'accounts');

      const nicQuery = query(customersRef, where('nic', '==', searchId));
      const nicSnap = await getDocs(nicQuery);

      if (!nicSnap.empty) {
        const customerDoc = nicSnap.docs[0];
        const customerData = customerDoc.data();
        await this.processCustomerResult(customerDoc.id, customerData, accountsRef, searchId);
        return;
      }

      const allCustomersSnap = await getDocs(customersRef);
      const searchTerm = searchId.toLowerCase().trim();
      let foundCustomer: any = null;

      allCustomersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.name?.toLowerCase().includes(searchTerm)) {
          foundCustomer = { id: doc.id, ...data };
        }
      });

      if (foundCustomer) {
        await this.processCustomerResult(foundCustomer.id, foundCustomer, accountsRef, foundCustomer.nic);
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

  processCustomerResult = async (id: string, customerData: any, accountsRef: any, searchNic: string) => {
    const accountQuery = query(accountsRef, where('nic', '==', searchNic));
    const accountSnap = await getDocs(accountQuery);

    let paymentData = {
      monday: 'unpaid' as 'paid' | 'unpaid',
      tuesday: 'unpaid' as 'paid' | 'unpaid',
      wednesday: 'unpaid' as 'paid' | 'unpaid',
      thursday: 'unpaid' as 'paid' | 'unpaid',
      friday: 'unpaid' as 'paid' | 'unpaid',
    };
    let balance = 0;
    let unpaidDays: { date: string; day: string; status: string }[] = [];
    let consecutiveUnpaidDays = 0;

    if (!accountSnap.empty) {
      const accountData = accountSnap.docs[0].data();
      const typedAccountData = accountData as {
        dailyCollections?: Record<string, { status: string; day: string }>;
        balance?: number;
      };

      if (typedAccountData.dailyCollections && typeof typedAccountData.dailyCollections === 'object') {
        paymentData = this.convertDailyCollectionsToWeeklyPayments(typedAccountData.dailyCollections);

        const dailyEntries = Object.entries(typedAccountData.dailyCollections);
        unpaidDays = dailyEntries
          .filter(([_, details]: [string, any]) => details.status === 'unpaid')
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
          .map(([date, details]: [string, any]) => ({
            date,
            day: details.day,
            status: details.status,
          }));

        let currentConsecutive = 0;
        const sortedDates = Object.keys(typedAccountData.dailyCollections)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        for (const date of sortedDates) {
          if (typedAccountData.dailyCollections[date].status === 'unpaid') {
            currentConsecutive++;
            if (currentConsecutive > consecutiveUnpaidDays) {
              consecutiveUnpaidDays = currentConsecutive;
            }
          } else {
            currentConsecutive = 0;
          }
        }
      }
      balance = typedAccountData.balance || 0;
    }

    const currentDate = new Date();
    const currentDay = this.getCurrentDay();
    const currentDateStr = currentDate.toLocaleDateString();
    const todayPaymentStatus = accountSnap.empty ? 'unpaid' :
      this.getTodayPaymentStatusFromDB((accountSnap.docs[0].data() as { dailyCollections?: any }).dailyCollections);

    this.setState({
      searchResult: {
        id,
        name: customerData.name || 'Unknown Name',
        nic: customerData.nic || 'No NIC',
        address: customerData.address || 'No Address',
        profilePhoto: customerData.customerPicture || 'https://via.placeholder.com/100x100/4A90E2/FFFFFF?text=PN',
        balance,
        weeklyPayments: paymentData,
        status: customerData.status || 'pending',
        currentDay,
        currentDate: currentDateStr,
        todayPaymentStatus,
        unpaidDays,
        consecutiveUnpaidDays,
      },
      isSearching: false,
      showAllUnpaid: false,
    });
  };

  handleClearSearch = () => {
    this.setState({
      searchId: '',
      searchResult: null,
      showAllUnpaid: false,
      showNonPayingCustomers: false,
      nonPayingCustomers: [],
    });
  };

  getDayName = (day: string) => {
    const dayNames = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
    };
    return dayNames[day as keyof typeof dayNames] || day;
  };

  getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);

    const weekDates = {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
    };

    Object.keys(weekDates).forEach((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayNum = String(date.getDate()).padStart(2, '0');
      weekDates[day as keyof typeof weekDates] = `${year}-${month}-${dayNum}`;
    });

    return weekDates;
  };

  convertDailyCollectionsToWeeklyPayments = (dailyCollections: any) => {
    const weekDates = this.getCurrentWeekDates();
    const weeklyPayments = {
      monday: 'unpaid' as 'paid' | 'unpaid',
      tuesday: 'unpaid' as 'paid' | 'unpaid',
      wednesday: 'unpaid' as 'paid' | 'unpaid',
      thursday: 'unpaid' as 'paid' | 'unpaid',
      friday: 'unpaid' as 'paid' | 'unpaid',
    };

    Object.keys(weekDates).forEach((day) => {
      const dateString = weekDates[day as keyof typeof weekDates];
      if (dailyCollections[dateString]?.status === 'paid') {
        weeklyPayments[day as keyof typeof weeklyPayments] = 'paid';
      }
    });

    return weeklyPayments;
  };

  getTodayPaymentStatusFromDB = (dailyCollections: any): 'paid' | 'unpaid' => {
    const todayDate = this.getTodayDateString();
    return dailyCollections?.[todayDate]?.status === 'paid' ? 'paid' : 'unpaid';
  };

  isFutureDay = (day: string, currentDay: string) => {
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const currentDayIndex = allDays.indexOf(currentDay);
    if (currentDayIndex === -1 || currentDay === 'saturday' || currentDay === 'sunday') {
      return false;
    }
    const dayIndex = allDays.indexOf(day);
    return dayIndex > currentDayIndex;
  };

  toggleUnpaidDays = () => {
    this.setState(prev => ({ showAllUnpaid: !prev.showAllUnpaid }));
  };

  toggleNonPayingCustomers = () => {
    if (this.state.showNonPayingCustomers) {
      this.setState({
        showNonPayingCustomers: false,
        nonPayingCustomers: [],
      });
    } else {
      this.findNonPayingCustomers();
    }
  };

  generatePDF = async () => {
    const { nonPayingCustomers } = this.state;
    if (nonPayingCustomers.length === 0) {
      Alert.alert('No Data', 'No non-paying customers to download.');
      return;
    }

    const rows = nonPayingCustomers.map(customer => `
      <tr>
        <td><img src="${customer.profilePhoto}" width="100" height="100" /></td>
        <td>${customer.name}</td>
        <td>${customer.nic}</td>
        <td>${customer.address}</td>
        <td>${customer.loanType}</td>
        <td>Rs. ${customer.balance.toLocaleString()}</td>
        <td>${customer.consecutiveUnpaidDays}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <style>
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            img { max-width: 100px; max-height: 100px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Non-Paying Customers (5+ Consecutive Unpaid Days)</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>NIC</th>
                <th>Address</th>
                <th>Loan Type</th>
                <th>Current Balance</th>
                <th>Consecutive Unpaid Days</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Non-Paying Customers PDF' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate and share PDF. Please try again.');
    }
  };

  renderNonPayingCustomers = () => {
    const { nonPayingCustomers, isSearching } = this.state;

    return (
      <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">
            Customers with 5+ Consecutive Unpaid Days
          </Text>
          {!isSearching && nonPayingCustomers.length > 0 && (
            <TouchableOpacity onPress={this.generatePDF}>
              <Ionicons name="download-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
        
        {isSearching ? (
          <Text className="text-center py-5">Loading non-paying customers...</Text>
        ) : nonPayingCustomers.length === 0 ? (
          <Text className="text-center py-5">No customers found with 5+ consecutive unpaid days</Text>
        ) : (
          <View className="space-y-3">
            {nonPayingCustomers.map((customer, index) => (
              <TouchableOpacity 
                key={index}
                className="flex-row items-center p-4 rounded-lg border-2 border-red-500 bg-red-50"
                onPress={() => {
                  this.setState({ searchId: customer.nic }, () => {
                    this.handleSearch();
                  });
                }}
              >
                <Image
                  source={{ uri: customer.profilePhoto }}
                  className="w-12 h-12 rounded-full border-2 border-red-500"
                />
                <View className="ml-4 flex-1">
                  <Text className="text-base font-bold text-gray-800">{customer.name}</Text>
                  <Text className="text-sm text-gray-600">NIC: {customer.nic}</Text>
                  <Text className="text-sm text-gray-600">Address: {customer.address}</Text>
                  <Text className="text-sm text-gray-600">Loan Type: {customer.loanType}</Text>
                  <Text className="text-sm text-gray-600">Balance: Rs. {customer.balance.toLocaleString()}</Text>
                </View>
                <View className="bg-red-500 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {customer.consecutiveUnpaidDays} Days
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  render() {
    const { 
      searchId, 
      searchResult, 
      isSearching, 
      showAllUnpaid,
      showNonPayingCustomers,
    } = this.state;
    const currentDay = this.getCurrentDay();

    return (
      <View className="flex-1 bg-white">
        <ScrollView>
          <View className="p-5">
            {/* Toggle button in top right */}
            <View className="flex-row justify-end mb-5">
              <TouchableOpacity
                className={`flex-row items-center justify-center bg-red-500 p-4 rounded-lg ${isSearching ? 'bg-gray-400' : ''}`}
                onPress={this.toggleNonPayingCustomers}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Text className="text-white text-base font-bold">Loading...</Text>
                ) : (
                  <>
                    <Ionicons name="alert-circle" size={20} color="#fff" />
                    <Text className="text-white text-base font-bold ml-2">
                      {showNonPayingCustomers ? 'Hide Unpaid Customers' : 'Find Unpaid Customers'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Search Section */}
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
                  <TouchableOpacity className="p-4" onPress={this.handleClearSearch}>
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

            {showNonPayingCustomers && this.renderNonPayingCustomers()}

            {searchResult && (
              <View>
                <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                  <Text className="text-lg font-bold mb-4 text-gray-800">Customer Details</Text>
                  {searchResult.consecutiveUnpaidDays >= 5 && (
                    <View className="bg-red-100 border-l-4 border-red-500 p-3 mb-4">
                      <Text className="text-red-700 font-bold">
                        Warning: This customer has {searchResult.consecutiveUnpaidDays} consecutive unpaid days!
                      </Text>
                    </View>
                  )}
                  <View className="items-center mb-5">
                    <Image
                      source={{ uri: searchResult.profilePhoto }}
                      className="w-24 h-24 rounded-full border-4 border-blue-700"
                    />
                  </View>
                  <View className="space-y-3">
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-bold text-gray-600">ID:</Text>
                      <Text className="text-base font-bold text-gray-800">{searchResult.id}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-bold text-gray-600">Name:</Text>
                      <Text className="text-base font-bold text-gray-800">{searchResult.name}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-bold text-gray-600">NIC:</Text>
                      <Text className="text-base font-bold text-gray-800">{searchResult.nic}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-bold text-gray-600">Address:</Text>
                      <Text className="text-base font-bold text-gray-800">{searchResult.address}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-bold text-gray-600">Status:</Text>
                      <Text className={`text-base font-bold ${searchResult.status === 'approve' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {searchResult.status.charAt(0).toUpperCase() + searchResult.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                  <Text className="text-lg font-bold mb-4 text-gray-800">Weekly Loan Payment Status</Text>
                  <Text className="text-base font-bold text-center mb-5 text-blue-500">
                    Today is {this.getDayName(currentDay)}{currentDay !== 'saturday' && currentDay !== 'sunday' ? ' ✓' : ''}
                  </Text>
                  <View className="space-y-3 mb-2">
                    {Object.entries(searchResult.weeklyPayments).map(([day, status]) => {
                      const isFutureDay = this.isFutureDay(day, currentDay);
                      const displayStatus = isFutureDay && status !== 'paid' ? 'pending' : status;
                      const isPending = displayStatus === 'pending';

                      return (
                        <View
                          key={day}
                          className={`flex-row items-center justify-between p-4 rounded-lg border-2 mb-5 relative ${
                            displayStatus === 'paid' ? 'bg-green-100 border-green-500' :
                            isPending ? 'bg-yellow-100 border-yellow-500' : 'bg-red-100 border-red-500'
                          } ${day === currentDay ? 'border-3 border-blue-500 bg-blue-100' : ''}`}
                        >
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-800">{this.getDayName(day)}</Text>
                            <Text className="text-xs text-gray-500">Payment Status</Text>
                          </View>
                          <View className="flex-row items-center space-x-2">
                            <Ionicons
                              name={
                                displayStatus === 'paid' ? 'checkmark-circle' :
                                isPending ? 'time-outline' : 'close-circle'
                              }
                              size={24}
                              color={
                                displayStatus === 'paid' ? '#4CAF50' :
                                isPending ? '#FFA500' : '#F44336'
                              }
                            />
                            <Text className={`text-sm font-bold ${
                              displayStatus === 'paid' ? 'text-green-500' :
                              isPending ? 'text-yellow-600' : 'text-red-500'
                            }`}>
                              {displayStatus.toUpperCase()}
                            </Text>
                          </View>
                          {day === currentDay && (
                            <View className="absolute top-[-8px] right-[-8px] bg-blue-500 px-2 py-1 rounded-full">
                              <Text className="text-white text-xs font-bold">TODAY</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {searchResult.unpaidDays.length > 5 && (
                    <TouchableOpacity
                      className="mb-4 p-3 bg-blue-500 rounded-lg flex-row justify-center items-center"
                      onPress={this.toggleUnpaidDays}
                    >
                      <Ionicons
                        name={showAllUnpaid ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#fff"
                      />
                      <Text className="text-white font-bold ml-2">
                        {showAllUnpaid ? 'Hide All Unpaid Days' : 'Show All Unpaid Days'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showAllUnpaid && searchResult.unpaidDays.length > 0 && (
                    <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                      <Text className="text-lg font-bold mb-4 text-gray-800">All Unpaid Days</Text>
                      <View className="space-y-3">
                        {searchResult.unpaidDays.map((unpaidDay, index) => (
                          <View
                            key={index}
                            className="flex-row items-center justify-between p-4 rounded-lg border-2 border-red-500 bg-red-100"
                          >
                            <View className="flex-1">
                              <Text className="text-base font-bold text-gray-800">
                                {new Date(unpaidDay.date).toLocaleDateString()}
                              </Text>
                              <Text className="text-sm text-gray-600">{unpaidDay.day}</Text>
                            </View>
                            <View className="flex-row items-center space-x-2">
                              <Ionicons name="close-circle" size={24} color="#F44336" />
                              <Text className="text-sm font-bold text-red-500">
                                {unpaidDay.status.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View className="mt-5 p-4 bg-gray-100 rounded-lg">
                    <Text className="text-base font-bold text-gray-800 mb-2">Payment Summary</Text>
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
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-sm text-gray-600">Consecutive Unpaid:</Text>
                      <Text className="text-sm font-bold text-red-500">
                        {searchResult.consecutiveUnpaidDays} days
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center pt-2 border-t border-gray-300">
                      <Text className="text-sm text-gray-600">Total Balance:</Text>
                      <Text className={`text-sm font-bold ${searchResult.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        Rs. {searchResult.balance.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }
}

export default AdvanceSearch;