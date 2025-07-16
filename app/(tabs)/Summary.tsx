import React from 'react';
import { FlatList, Image, ScrollView, Text, View } from 'react-native';

interface LoanParticipant {
  id: string;
  name: string;
  amountPaid: number;
}

const SummaryScreen = () => {
  const loanParticipants: LoanParticipant[] = [
    { id: '1', name: 'Tharuka Dilshan', amountPaid: 150000 },
    { id: '2', name: 'Maleesha Perera', amountPaid: 20000 },
    { id: '3', name: 'Nimal Alahakorn', amountPaid: 12000 },
    { id: '4', name: 'Gamage Perera', amountPaid: 18000 },
    { id: '5', name: 'Dinusha Silva', amountPaid: 90000 },
  ];

  const totalAmountPaid = loanParticipants.reduce(
    (sum, participant) => sum + participant.amountPaid,
    0
  );

  const renderParticipant = ({ item }: { item: LoanParticipant }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center">
        <Text className="text-lg font-medium text-gray-800">{item.name}</Text>
        <Text className="text-lg font-semibold text-green-600">
          Rs.{item.amountPaid.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Logo */}
        <View className="items-center mb-6">
          <Image
            source={require('../../assets/images/logo.png')}
            className="w-24 h-24 rounded-full"
          />
          <Text className="text-3xl font-bold text-gray-800 mt-4">Loan Summary</Text>
        </View>

        {/* Summary Card */}
        <View className="bg-white p-6 rounded-2xl shadow-lg shadow-green-200 mb-8 border border-gray-100">
          <Text className="text-base text-gray-600 text-center">Total Amount Paid</Text>
          <Text className="text-3xl font-bold text-green-700 text-center mt-2 mb-1">
            Rs.{totalAmountPaid.toLocaleString()}
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            {loanParticipants.length} participant{loanParticipants.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Breakdown */}
        <View className="mb-4">
          <Text className="text-xl font-semibold text-gray-800 mb-4">Payment Breakdown</Text>
          <FlatList
            data={loanParticipants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default SummaryScreen;
