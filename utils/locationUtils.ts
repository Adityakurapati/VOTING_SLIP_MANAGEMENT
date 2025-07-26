import * as Location from "expo-location"

export interface LocationData {
  latitude: number
  longitude: number
  address?: string
  timestamp: string
}

export interface LocationResult {
  success: boolean
  location?: LocationData
  error?: string
}

// Request location permissions
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    return status === "granted"
  } catch (error) {
    console.error("Permission request error:", error)
    return false
  }
}

// Get current location with address
export const getCurrentLocation = async (): Promise<LocationResult> => {
  try {
    // Check if location services are enabled
    const enabled = await Location.hasServicesEnabledAsync()
    if (!enabled) {
      return {
        success: false,
        error: "स्थान सेवा बंद आहे. कृपया डिव्हाइस सेटिंग्जमध्ये स्थान सेवा चालू करा.",
      }
    }

    // Request permission
    const hasPermission = await requestLocationPermission()
    if (!hasPermission) {
      return {
        success: false,
        error: "स्थान परवानगी नाकारली. कृपया सेटिंग्जमध्ये जाऊन स्थान परवानगी द्या.",
      }
    }

    // Get current position with timeout
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 0,
    })

    const locationData: LocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date().toISOString(),
    }

    // Try to get address (optional)
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (addresses && addresses.length > 0) {
        const address = addresses[0]
        const addressParts = [address.name, address.street, address.city, address.region, address.postalCode].filter(
          Boolean,
        )

        locationData.address = addressParts.join(", ")
      }
    } catch (addressError) {
      console.warn("Address lookup failed:", addressError)
      // Continue without address
    }

    return {
      success: true,
      location: locationData,
    }
  } catch (error) {
    console.error("Location error:", error)
    return {
      success: false,
      error: "स्थान मिळवण्यात अडचण. कृपया GPS चालू करा आणि पुन्हा प्रयत्न करा.",
    }
  }
}

// Format location for display
export const formatLocationForDisplay = (location: LocationData | null): string => {
  if (!location) {
    return "स्थान उपलब्ध नाही"
  }

  if (location.address) {
    return location.address
  }

  // Fallback to coordinates if no address
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
}

// Calculate distance between two points (in kilometers)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

// Check if location is valid
export const isValidLocation = (location: LocationData | null): boolean => {
  if (!location) return false

  return (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number" &&
    !isNaN(location.latitude) &&
    !isNaN(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  )
}
