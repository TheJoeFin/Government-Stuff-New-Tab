class MilwaukeeApi {
  constructor() {
    this.apiEndpoint = 'https://milwaukee-alder-apim.azure-api.net/alderman/GetAldermanDistrict'
    this.rateLimit = 100 // requests per hour per IP
  }

  async getRepresentatives(address) {
    try {
      console.log('Fetching Milwaukee representatives for:', address)

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address })
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded (100 requests/hour). Please try again later.')
        } else if (response.status === 404) {
          throw new Error('Address not found in Milwaukee County area.')
        } else if (response.status >= 500) {
          throw new Error('Milwaukee County API is temporarily unavailable. Please try again later.')
        } else {
          throw new Error(`Milwaukee API error: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log('Milwaukee API response:', data)

      return this.formatMilwaukeeData(data)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.')
      }
      console.error('Milwaukee API error:', error)
      throw error
    }
  }

  formatMilwaukeeData(data) {
    if (!data) return null

    const representatives = []

    // Check if data has success flag
    if (!data.success) {
      return {
        representatives: [],
        coordinates: null,
        isInMilwaukeeCounty: false
      }
    }

    // Add Alderperson based on actual API response structure
    if (data.alderperson && data.district) {
      representatives.push({
        name: data.alderperson,
        office: data.districtLabel || `Milwaukee City Alderperson - District ${data.district}`,
        division: 'City of Milwaukee',
        email: null, // Not provided in API
        website: null, // Not provided in API
        district: data.district,
        type: 'alderperson'
      })
    }

    // Add County Supervisor based on actual API response structure
    if (data.supervisor && data.supervisorDistrict) {
      representatives.push({
        name: data.supervisor,
        office: data.supervisorDistrictLabel || `Milwaukee County Supervisor - District ${data.supervisorDistrict}`,
        division: 'Milwaukee County',
        email: data.supervisorEmail || null,
        website: data.supervisorWebsite || null,
        district: data.supervisorDistrict,
        type: 'supervisor'
      })
    }

    return {
      representatives,
      coordinates: { latitude: data.latitude, longitude: data.longitude } || null,
      isInMilwaukeeCounty: representatives.length > 0
    }
  }

  isAddressLikelyInMilwaukee(address) {
    if (!address) return false
    
    const addressLower = address.toLowerCase()
    const milwaukeeIndicators = [
      'milwaukee',
      'wi',
      'wisconsin',
      '53'
    ]

    return milwaukeeIndicators.some(indicator => addressLower.includes(indicator))
  }
}