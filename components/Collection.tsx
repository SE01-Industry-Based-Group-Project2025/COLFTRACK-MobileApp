import { db } from "@/firebase"
import { Ionicons } from "@expo/vector-icons"
import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { getAuth } from "firebase/auth/react-native"
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native"
import ErrorBoundary from "./ErrorBoundary"




const Hr = () => <View className="border-b border-gray-300 my-4" />

type ParamList = {
  Collection: {
    customer: {
      name: string
      nic: string
      address: string
      area: string
      loanType:string
      customerPicture?: string
      id?: string
    }
  }
}


// Error display component
const ErrorText: React.FC<{ error?: string }> = ({ error }) => {
  if (!error) return null
  return (
    <View className="flex-row items-center mt-1 mb-2">
      <Ionicons name="alert-circle" size={16} color="#EF4444" />
      <Text className="text-red-500 text-sm ml-1">{error}</Text>
    </View>
  )
}

const CollectionScreen: React.FC = () => {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<ParamList, "Collection">>()
  
  // Safely access route parameters with error handling
  const customer = (() => {
    try {
      return route.params?.customer
    } catch (error) {
      console.warn('Failed to access route parameters:', error)
      return null
    }
  })()
  

  const [profileData] = useState({
    name: customer?.name,
    nic: customer?.nic,
    address: customer?.address,
    area: customer?.area,
    loanType: customer?.loanType,
    profilePhoto:customer?.customerPicture,
  })


  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("unpaid")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [imageError, setImageError] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isCompleting, setIsCompleting] = useState(false)
  const [dailyAmounts,setDailyAmounts]=useState(0);
  

  
    // Enhanced input validation
    const validateInputs = useCallback(() => {
    const newErrors: {[key: string]: string} = {}

    
    if(paymentStatus === "paid"){
      // Validate payment amount
      if (!paymentAmount.trim()) {
        newErrors.paymentAmount = 'Payment amount is required'
      } 
    
    }else{
      // Validate notes
      if(!notes.trim()){
        newErrors.notes = 'Note is required'
      }else if (notes.length > 500) {
        newErrors.notes = 'Notes cannot exceed 500 characters'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [paymentAmount, notes])







  // Enhanced payment amount change handler
  const handlePaymentAmountChange = useCallback((value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '')

    setPaymentAmount(cleanValue)

    // Clear payment amount error when user starts typing
    if (errors.paymentAmount) {
      setErrors(prev => ({ ...prev, paymentAmount: '' }))
    }

    // 🔁 Automatically toggle payment status
    setPaymentStatus(cleanValue.trim() ? "paid" : "unpaid")
  }, [errors.paymentAmount])



  
  // Enhanced notes change handler
  const handleNotesChange = useCallback((value: string) => {
    setNotes(value)
    
    // Clear notes error when user starts typing
    if (errors.notes) {
      setErrors(prev => ({ ...prev, notes: '' }))
    }
  }, [errors.notes])

 
    useEffect(() => {
        const fetchDailyAmount = async () => {
          try {
            const q = query(
              collection(db, 'loanPlan'),
              where('name', '==', customer?.loanType)
            );
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              setDailyAmounts(data.dailyAmount || 0); // fallback to 0
            });
          } catch (error) {
            console.error('Error fetching dailyAmount:', error);
          }
        };

        if (customer?.loanType) {
          fetchDailyAmount();
        }
      }, [customer?.loanType]);


  const handleComplete = async () => {
    try {
      setIsCompleting(true)
      // Validate all inputs
      if (!validateInputs()) {
        Alert.alert(
          "Validation Error",
          "Please fix the errors below before completing the task.",
          [{ text: "OK" }]
        )
        return
      }

      // Fetch current account data
      const accountRef = doc(db, "accounts", customer?.id!)
      const accountSnap = await getDoc(accountRef)

      if (!accountSnap.exists()) {
        throw new Error("Customer account not found")
      }

      const accountData = accountSnap.data()
      const currentBalance = Number(accountData.balance || 0)

      
      const paymentValue = Number(paymentAmount)

      const penaltyRef = doc(db, "loanPenalty", "qslvczMXZ7uYiX493TGH")
      const penaltySnap = await getDoc(penaltyRef)

      let penalty;
      if (penaltySnap.exists()) {
        const penaltyData = penaltySnap.data()
        penalty = Number(penaltyData.penalty || 0)
      }else{
        throw new Error("Penalty data not found")
      }

      if (paymentStatus === "paid") {
        const paymentValue = Number(paymentAmount);

        if (paymentValue !== dailyAmounts) {
          Alert.alert(
            "Invalid Amount!",
            `Correct Daily Amount of ${customer?.loanType} is ${dailyAmounts}, but you entered Rs ${paymentAmount}`,
            [{ text: "OK" }]
          );
          return;
        }
      }

      console.log("Penalty document data:", penaltySnap.data());
      console.log("Penalty amount retrieved:", penalty);
      const newBalance =
        paymentStatus === "paid"
          ? currentBalance - paymentValue
          : currentBalance + penalty


      // Prevent zero or negative balances
      if (newBalance === 0) {
        Alert.alert(
          "Completed Loan Balance",
          "Yeah! The customer has already completed the loan.",
          [{ text: "OK" }]
        )
        return
      } else if (newBalance < 0) {
        Alert.alert(
          "Insufficient Funds",
          `The customer's current balance is Rs ${currentBalance}. You can't collect more than that.`,
          [{ text: "OK" }]
        )
        return
      }

      // Get current date and day
      const now = new Date()
      const weekday = now.toLocaleDateString("en-US", { weekday: "long" })
      const fullDate = now.toISOString().split("T")[0]


      const auth = getAuth()
      const user = auth.currentUser

      if (!user) {
        Alert.alert("Error", "No logged-in rider found.")
        return
      }

      const riderId = user.uid 

      const collectionUpdate = {
        [`dailyCollections.${fullDate}`]: {
          amount: paymentValue,
          status: paymentStatus,
          notes,
          date: fullDate,
          day: weekday,
          riderId:riderId
        },
        balance: newBalance,
      }

      await updateDoc(accountRef, collectionUpdate)

      Alert.alert(
        "✅ Success",
        "Collection completed and saved successfully!",
        [
          {
            text: "Generate Receipt",
            onPress: () => generatePDF(newBalance),
          },
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      )
      setPaymentAmount("")
      setNotes("")
      setPaymentStatus("unpaid")
    } catch (error) {
      console.error("Collection completion failed:", error)
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to complete collection. Please try again.",
        [{ text: "OK" }]
      )
    } finally {
      setIsCompleting(false)
    }
  }

  const generatePDF = async (balance: number) => {
 
  try {
    if (!customer) {
      Alert.alert("Missing customer data");
      return;
    }

    setIsGeneratingPDF(true);

    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD format

   const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          font-size: 30px;
        }

        .center {
          text-align: center;
        }

        .line {
          border-top: 2px dashed black;
          margin: 10px 0;
        }

        .thank {
          font-size: 50px;
          font-weight: bold;
        }

        .balance {
          font-size: 40px;
          font-weight: bold;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
    <div class="line"></div>
    <div class="center"><strong style="font-size: 60px;">COLF  LANKA</strong></div>
    <div class="line"></div>
    <div style="white-space: pre; font-size: 30px;">
       Customer Name  : ${customer.name}
       Customer NIC   : ${customer.nic}
       Loan Type      : ${customer.loanType}
       Daily Payment  : Rs.${Number(paymentAmount || 0).toFixed(2)}
       Date           : ${date}
    </div>  

    <div class="balance center">Balance : Rs.${balance.toFixed(2)}</div>

    <div class="line"></div>
    <div class="center thank">Thank You!</div>
    <div class="line"></div>
    </body>
    </html>
    `;


    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Payment Receipt',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Success', `PDF generated successfully!\nSaved to: ${uri}`);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. Please try again.');
  } finally {
    setIsGeneratingPDF(false);
  }
};

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          
          {/* Logo */}
          <View className="items-center">
            <Image source={require("../assets/images/logo.png")} className="w-24 h-24 rounded-full" resizeMode="cover" />
          </View>
        
  
        {/* Profile Card */}
        <View className="bg-white rounded-3xl shadow p-6 mb-6">
          {!imageError ? (
            <Image
              source={{ uri: profileData.profilePhoto }}
              className="w-32 h-32 rounded-full border-2 border-green-500 self-center mb-4"
              onError={(error) => {
                console.warn('Profile image failed to load:', error.nativeEvent.error)
                setImageError(true)
              }}
              onLoadStart={() => {
                // Reset image error state when starting to load a new image
                setImageError(false)
              }}
            />
          ) : (
            <View className="w-32 h-32 rounded-full bg-gray-300 justify-center items-center self-center mb-4 border-2 border-green-500">
              <Ionicons name="person" size={50} color="#1D1E0F" />
              <Text className="text-xs text-gray-500 mt-1 text-center">Image unavailable</Text>
            </View>
          )}
         


          {["name", "nic", "address", "area", "loanType"].map((key) => (
            <View key={key} className="flex-row justify-between mb-2">
              <Text className="text-gray-800 font-bold">{key.toUpperCase()}:</Text>
              <Text className="text-gray-600 capitalize">{(profileData as any)[key]}</Text>
            </View>
          ))}
        </View>



        {/* Payment Amount */}
        <Text className="text-lg font-bold text-gray-800 mb-2">Payment Amount</Text>
        <TextInput
          className={`bg-white border rounded-2xl px-4 py-3 mb-2 text-gray-800 ${
            errors.paymentAmount ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter amount (e.g., 5000)"
          keyboardType="numeric"
          value={paymentAmount}
          onChangeText={handlePaymentAmountChange}
          maxLength={10}
        />
        <ErrorText error={errors.paymentAmount} />

        {/* Quick Amount Buttons */}
        <View className="flex-row flex-wrap justify-between mb-4">
          {[dailyAmounts].map((amount) => (
            <TouchableOpacity
              key={amount}
              className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 mb-2"
              onPress={() => handlePaymentAmountChange(amount.toString())}
              style={{ width: "23%" }}
            >
              <Text className="text-center text-gray-700 text-sm font-medium">Rs. {amount}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Status */}
        <Text className="text-lg font-bold text-gray-800 mb-2">Payment Status</Text>
        <TouchableOpacity
          className={`flex-row justify-center items-center px-4 py-3 rounded-full mb-4  ${
            paymentStatus === "paid" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <Ionicons name={paymentStatus === "paid" ? "checkmark-circle" : "close-circle"} size={20} color="#fff" />
          <Text className="text-white font-bold text-lg ml-2">{paymentStatus.toUpperCase()}</Text>
        </TouchableOpacity>


        
        {!paymentAmount.trim() && (
          <>
            <Text className="text-lg font-bold text-gray-800 mb-2">Notes</Text>
            <TextInput
              className={`bg-white border rounded-2xl px-4 py-3 mb-2 text-gray-800 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              multiline
              numberOfLines={4}
              placeholder="Add notes here..."
              value={notes}
              onChangeText={handleNotesChange}
            />
            <ErrorText error={errors.notes} />
          </>
        )}

        <Hr />
        
          <TouchableOpacity
            className="bg-green-500 px-8 py-3 rounded-2xl flex-row items-center w-full text-center justify-center"
            onPress={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={28} color="#fff" />
                <Text className="text-white font-bold ml-2  text-lg">Complete</Text>
              </>
            )}
          </TouchableOpacity>
   
        </ScrollView>
      </View>
    </ErrorBoundary>
  )
}

export default CollectionScreen
