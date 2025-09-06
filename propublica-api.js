class ProPublicaApi {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.propublica.org/congress/v1';
  }

  async getMembers(chamber) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${this.baseUrl}/118/${chamber}/members.json`, {
        headers: {
          'X-API-Key': this.apiKey
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Invalid ProPublica API key. Please check your settings.')
        } else if (response.status >= 500) {
          throw new Error('ProPublica API is temporarily unavailable.')
        } else {
          throw new Error(`ProPublica API error: ${response.status}`)
        }
      }

      const data = await response.json();
      return data.results[0].members;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('ProPublica API request timed out.')
      } else if (error instanceof TypeError) {
        throw new Error('Network error connecting to ProPublica API.')
      }
      throw error
    }
  }

  async getMember(memberId) {
    const response = await fetch(`${this.baseUrl}/members/${memberId}.json`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    });
    return await response.json();
  }

  async getSponsoredLegislation(memberId) {
    const response = await fetch(`${this.baseUrl}/members/${memberId}/bills/sponsored.json`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    });
    return await response.json();
  }

  async getRecentVotes(memberId) {
    const response = await fetch(`${this.baseUrl}/members/${memberId}/votes.json`, {
      headers: {
        'X-API-Key': this.apiKey
      }
    });
    return await response.json();
  }
}