import { db } from "@/firebase"
import { getAuth } from "firebase/auth/react-native"
import { collection, onSnapshot } from "firebase/firestore"
import LottieView from "lottie-react-native"
import React, { useEffect, useState } from "react"
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  View
} from "react-native"

interface LoanParticipant {
  id: string
  name: string
  amountPaid: number
}

const SummaryScreen = () => {
  const [loanParticipants, setLoanParticipants] = useState<LoanParticipant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
  const auth = getAuth()
  const currentUser = auth.currentUser
  if (!currentUser) return

  const riderId = currentUser.uid
  const today = new Date().toISOString().split("T")[0]

  const accountsRef = collection(db, "accounts")

  const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
    const participants: LoanParticipant[] = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const collections = data.dailyCollections

      if (collections && collections[today]) {
        const todayCollection = collections[today]
        if (
          todayCollection.status === "paid" &&
          todayCollection.riderId === riderId
        ) {
          participants.push({
            id: docSnap.id,
            name: data.name,
            amountPaid: todayCollection.amount,
          })
        }
      }
    })

    setLoanParticipants(participants)
    setIsLoading(false)
  })

  return () => unsubscribe()
}, [])


  const totalAmountPaid = loanParticipants.reduce(
    (sum, participant) => sum + participant.amountPaid,
    0
  )

  const renderParticipant = ({ item }: { item: LoanParticipant }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center">
        <Text className="text-lg font-medium text-gray-800">{item.name}</Text>
        <Text className="text-lg font-semibold text-green-600">
          Rs.{item.amountPaid.toLocaleString()}
        </Text>
      </View>
    </View>
  )

  // Loading state
    if (isLoading) {
      return (
         <View className="flex-1 justify-center items-center bg-white">
            <LottieView
                source={require('../../assets/animations/load.json')}
                autoPlay
                loop
                style={{ width: 208, height: 208 }} // Tailwind equivalent for width: 208px, height: 208px
              />
          </View>
      );
    }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="items-center mb-6">
          <Image
            source={require("../../assets/images/logo.png")}
            className="w-24 h-24 rounded-full"
          />
          <Text className="text-3xl font-bold text-gray-800 mt-4">Loan Summary</Text>
        </View>

        <View className="bg-white p-6 rounded-2xl shadow-lg shadow-green-200 mb-8 border border-gray-100">
          <Text className="text-base text-gray-600 text-center">Total Amount Paid</Text>
          <Text className="text-3xl font-bold text-green-700 text-center mt-2 mb-1">
            Rs.{totalAmountPaid.toLocaleString()}
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            {loanParticipants.length} participant{loanParticipants.length !== 1 ? "s" : ""}
          </Text>
        </View>

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
  )
}

export default SummaryScreen
