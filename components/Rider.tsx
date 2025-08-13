import { auth, db } from "@/firebase"
import { Ionicons } from "@expo/vector-icons"
import { type NavigationProp, type ParamListBase, useNavigation } from "@react-navigation/native"
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore"
import LottieView from "lottie-react-native"
import { useEffect, useState } from "react"
import { Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native"

interface Customer {
  id: string
  name: string
  nic: string
  address: string
  area: string
  customerPicture: string
}

interface ProfileData {
  firstName: string
}

export default function LoanOfficerHome() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [userAssignedArea, setUserAssignedArea] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [areaList, setAreaList] = useState<string[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  const filteredCustomers = customers.filter(
    (c) =>
      (!selectedArea || c.area === selectedArea) &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.nic.includes(searchQuery)),
  )

  const goToCollection = (customer: Customer) => {
    navigation.navigate("Collection", { customer })
  }

  useEffect(() => {
    fetchProfileData()
    fetchUserAssignedArea()
  }, [])

  useEffect(() => {
    if (selectedArea) {
      fetchCustomersFromFirebase(selectedArea)
    }
  }, [selectedArea])

  const fetchProfileData = async () => {
    const userId = auth.currentUser?.uid
    if (!userId) {
      setLoading(false)
      Alert.alert("Error", "User not authenticated")
      return
    }

    try {
      const docRef = doc(db, "employees", userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setProfileData(docSnap.data() as ProfileData)
      } else {
        const defaultProfile: ProfileData = { firstName: "" }
        await setDoc(docRef, defaultProfile)
        setProfileData(defaultProfile)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      Alert.alert("Error", "Failed to load profile data")
    }
  }

  const fetchUserAssignedArea = async () => {
    const userId = auth.currentUser?.uid
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const areasRef = collection(db, "areas")
      const areasSnapshot = await getDocs(areasRef)

      const assignedAreas: string[] = []

      areasSnapshot.forEach((doc) => {
        const areaData = doc.data()
        if (areaData.userIds && areaData.userIds.includes(userId)) {
          assignedAreas.push(doc.id)
        }
      })

      if (assignedAreas.length === 0) {
        Alert.alert("No Area Assigned", "You are not assigned to any area.")
      }

      setAreaList(assignedAreas)
      setUserAssignedArea(assignedAreas[0] || null)
    } catch (error) {
      console.error("Error fetching user assigned area:", error)
      Alert.alert("Error", "Failed to load assigned area")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomersFromFirebase = async (area: string) => {
    try {
      setLoading(true)

       const q = query(
        collection(db, "customers"),  
        where("status", "==", "Approved" )
      )
      console.log(q)

      const snapshot = await getDocs(q)
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Customer))
        .filter((c) => c.area === area)

      setCustomers(filtered)
    } catch (error) {
      console.error("Error fetching customers:", error)
      Alert.alert("Error", "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <LottieView
          source={require("../assets/animations/load.json")}
          autoPlay
          loop
          style={{ width: 208, height: 208 }}
        />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white p-5">
      {/* Logo */}
      <View className="items-center mb-2">
        <Image source={require("../assets/images/logo.png")} className="w-24 h-24 rounded-full" />
      </View>

      {/* Greeting + Assigned Area */}
      {!selectedArea && (
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-800 mt-3 mb-2 bg-green-100 p-5 w-full text-center capitalize">
            Hello {profileData?.firstName}..
          </Text>
        </View>
      )}

      {/* Area List (only assigned areas) */}
      <View className="bg-white rounded-xl p-6 shadow-md mb-5">
        <Text className="ml-8 text-gray-800 mb-2 font-bold">Select an Area</Text>
        <View className="flex-row justify-center flex-wrap mb-5">
          {areaList.map((area) => (
            <TouchableOpacity
              key={area}
              className={`px-4 py-2 m-1 rounded-full border ${
                selectedArea === area
                  ? "bg-green-600 border-green-600 capitalize"
                  : "bg-white border-black-400 capitalize"
              }`}
              onPress={() => setSelectedArea(area === selectedArea ? null : area)}
            >
              <View className="flex-row">
                <Text
                  className={`font-medium ${
                    selectedArea === area ? "text-white capitalize" : "text-black capitalize"
                  }`}
                >
                  {area}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Bar */}
      {selectedArea && (
        <View className="flex-row items-center border border-gray-300 rounded-lg bg-gray-50 mb-5 px-5">
          <TextInput
            className="flex-1 p-3 text-base text-gray-800"
            placeholder="Search by name or NIC"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={22} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* No Area Selected */}
      {!selectedArea && (
        <View className="bg-white rounded-xl p-6 shadow-md items-center">
          <LottieView
            source={require("../assets/animations/rider.json")}
            autoPlay
            loop
            style={{ width: 400, height: 250 }}
          />
          <Text className="text-xl font-bold text-gray-800 text-center mt-5">Please Select an Area</Text>
          <Text className="text-gray-600 text-center mt-2">
            Select an area to view and search for customers in that location.
          </Text>
        </View>
      )}

      {/* Customer List */}
      {selectedArea && (
        <FlatList
  data={filteredCustomers}
  keyExtractor={(item) => item.id}
  ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No customers found</Text>}
  renderItem={({ item }) => (
    <View className="bg-white p-4 rounded-lg shadow-sm mb-3 border-l-4 border-green-500">
      <View className="flex-row items-start justify-between">
        {/* Left: Image + Details */}
        <View className="flex-row flex-1">
          <Image source={{ uri: item.customerPicture }} className="w-12 h-12 rounded-full mr-3 mt-1" />
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800 capitalize">{item.name}</Text>
            <Text className="text-sm text-gray-600 capitalize" numberOfLines={1} ellipsizeMode="tail">
              NIC: {item.nic}
            </Text>
            <Text className="text-sm text-gray-600 capitalize">Address: {item.address}</Text>
          </View>
        </View>

        {/* Right: Collect Button */}
        <TouchableOpacity
          className="bg-green-600 px-3 py-2 rounded-lg ml-2 self-start"
          onPress={() => goToCollection(item)}
        >
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={16} color="#fff" />
            <Text className="text-white font-medium ml-1 text-sm">Collect</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )}
/>

      )}
    </View>
  )
}
