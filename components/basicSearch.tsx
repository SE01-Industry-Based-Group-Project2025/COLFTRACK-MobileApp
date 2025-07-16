// app/search.tsx
import { Ionicons } from '@expo/vector-icons';
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

interface SearchState {
  searchId: string;
  searchResult: {
    id: string;
    name: string;
    nic: string;
    address: string;
    profilePhoto: string;
    weeklyPayments: {
      monday: 'paid' | 'unpaid';
      tuesday: 'paid' | 'unpaid';
      wednesday: 'paid' | 'unpaid';
      thursday: 'paid' | 'unpaid';
      friday: 'paid' | 'unpaid';
    };
  } | null;
  isSearching: boolean;
  imageError: boolean;
}

class BasicSearch extends Component<object, SearchState> {
  constructor(props: object) {
    super(props);
    this.state = {
      searchId: '',
      searchResult: null,
      isSearching: false,
      imageError: false
    };
  }

  // Mock data for demonstration
  mockData = {
    'CMP001': {
      id: 'CMP001',
      name: 'Tharuka Dilshan',
      nic: '123456789V',
      address: 'No 186 Gammamnapara Colombo',
      profilePhoto: 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
      weeklyPayments: {
        monday: 'paid' as const,
        tuesday: 'paid' as const,
        wednesday: 'unpaid' as const,
        thursday: 'paid' as const,
        friday: 'unpaid' as const,
      }
    },
    'CMP002': {
      id: 'CMP002',
      name: 'Maleesha Perera',
      nic: '987654321V',
      address: 'No 25 Main Street Kandy',
      profilePhoto: 'https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D',
      weeklyPayments: {
        monday: 'unpaid' as const,
        tuesday: 'paid' as const,
        wednesday: 'paid' as const,
        thursday: 'unpaid' as const,
        friday: 'paid' as const,
      }
    },
    'CMP003': {
      id: 'CMP003',
      name: 'Nimal Alahakorn',
      nic: '456789123V',
      address: 'No 78 Lake Road Galle',
      profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D',
      weeklyPayments: {
        monday: 'paid' as const,
        tuesday: 'paid' as const,
        wednesday: 'paid' as const,
        thursday: 'paid' as const,
        friday: 'paid' as const,
      }
    },
    'CMP004': {
      id: 'CMP004',
      name: 'Saman Adikari',
      nic: '456789123V',
      address: 'No 78 Lake Road Galle',
      profilePhoto: 'https://plus.unsplash.com/premium_photo-1689977927774-401b12d137d6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D',
      weeklyPayments: {
        monday: 'unpaid' as const,
        tuesday: 'unpaid' as const,
        wednesday: 'unpaid' as const,
        thursday: 'unpaid' as const,
        friday: 'unpaid' as const,
      }
    }
  };

  

  handleSearch = () => {
    if (!this.state.searchId.trim()) {
      Alert.alert('Error', 'Please enter an ID to search');
      return;
    }

    this.setState({ isSearching: true });

    // Simulate API call delay
    setTimeout(() => {
      const result = this.mockData[this.state.searchId.toUpperCase() as keyof typeof this.mockData];
      
      if (result) {
        this.setState({ 
          searchResult: result, 
          isSearching: false,
          imageError: false 
        });
      } else {
        this.setState({ searchResult: null, isSearching: false });
        Alert.alert('Not Found', 'No customer found with this ID');
      }
    }, 1000);
  };

  handleClearSearch = () => {
    this.setState({ 
      searchId: '', 
      searchResult: null, 
      imageError: false 
    });
  };

  handleImageError = () => {
    this.setState({ imageError: true });
  };

  getDayName = (day: string) => {
    const dayNames = {
      monday: 'Monday',
      tuesday: 'Tuesday', 
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday'
    };
    return dayNames[day as keyof typeof dayNames];
  };

  getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    return days[today];
  };

  render() {
    const { searchId, searchResult, isSearching, imageError } = this.state;
    const currentDay = this.getCurrentDay();

    return (
      <ScrollView className="flex-1 bg-white">
        <View className="p-5">
          <Text className="text-2xl font-bold text-center mb-8 text-white">Search Customer</Text>
           <View className='items-center'>
              <Image 
                source={require('../assets/images/logo.png')}
                className='w-24 h-24 rounded-full'   
              />
            </View>

          {/* Search Section */}
          <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
            <Text className="text-lg font-bold mb-4 text-gray-800">Customer ID</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-100 mb-4">
              <TextInput
                className="flex-1 p-4 text-base text-gray-800"
                placeholder="Enter Customer ID (e.g., CMP001)"
                value={searchId}
                onChangeText={(text) => this.setState({ searchId: text })}
                autoCapitalize="characters"
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
            <>
              {/* Profile Section */}
              <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                <Text className="text-lg font-bold mb-4 text-gray-800">Customer Details</Text>
                
                <View className="items-center mb-5">
                  {!imageError ? (
                    <Image
                      source={{ uri: searchResult.profilePhoto }}
                      className="w-24 h-24 rounded-full border-2 border-green-500"
                      onError={this.handleImageError}
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-gray-200 justify-center items-center">
                      <Ionicons name="person" size={50} color="#1D1E0FFF" />
                    </View>
                  )}
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
                </View>
              </View>

              {/* Weekly Payment Status */}
              <View className="bg-white rounded-lg p-5 mb-5 shadow-md">
                <Text className="text-lg font-bold mb-4 text-gray-800">Weekly Loan Payment Status</Text>
                
                <View className="space-y-3 mb-2">
                  {Object.entries(searchResult.weeklyPayments).map(([day, status]) => (
                    <View 
                      key={day} 
                      className={`flex-row items-center justify-between p-4 rounded-lg border-2  mb-5 relative ${status === 'paid' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} ${day === currentDay ? 'border-3 border-blue-500 bg-blue-100' : ''}`}
                    >
                      <Text className="text-base font-bold text-gray-800">{this.getDayName(day)}</Text>
                      <View className="flex-row items-center space-x-2">
                        <Ionicons
                          name={status === 'paid' ? 'checkmark-circle' : 'close-circle'}
                          size={24}
                          color={status === 'paid' ? '#4CAF50' : '#F44336'}
                        />
                        <Text className={`text-sm font-bold ${status === 'paid' ? 'text-green-500' : 'text-red-500'}`}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                      {day === currentDay && (
                        <View className="absolute top-[-8px] right-[-8px] bg-blue-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-bold">TODAY</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* Summary */}
                <View className="mt-5 p-4 bg-gray-100 rounded-lg">
                  <Text className="text-base font-bold text-gray-800 mb-2">Payment Summary</Text>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm text-gray-600">Paid Days:</Text>
                    <Text className="text-sm font-bold text-green-500">
                      {Object.values(searchResult.weeklyPayments).filter(status => status === 'paid').length}/5
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-600">Unpaid Days:</Text>
                    <Text className="text-sm font-bold text-red-500">
                      {Object.values(searchResult.weeklyPayments).filter(status => status === 'unpaid').length}/5
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    );
  }
}

export default BasicSearch;
