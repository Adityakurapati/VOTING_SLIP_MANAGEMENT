import * as Location from "expo-location"

export interface LocationInfo {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  timestamp: string
}

export const getCurrentLocation = async (): Promise<LocationInfo | null> => {
  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      console.log("Location permission denied")
      return null
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000,
    })

    // Reverse geocode to get address
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    })

    if (reverseGeocode.length > 0) {
      const address = reverseGeocode[0]
      return {
        city: address.city || address.district || address.subregion || "Unknown City",
        state: address.region || "Unknown State",
        country: address.country || "Unknown Country",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      }
    }

    return {
      city: "Unknown City",
      state: "Unknown State",
      country: "Unknown Country",
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting location:", error)
    return null
  }
}

export const formatLocationString = (locationInfo: LocationInfo | null): string => {
  if (!locationInfo) {
    return "स्थान अनुपलब्ध"
  }
  return `${locationInfo.city}, ${locationInfo.state}`
}
