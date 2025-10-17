import { GET } from '../../app/api/prices/route'
import { NextRequest } from 'next/server'

// Mock fetch globally
global.fetch = jest.fn()

describe('/api/prices', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return price data for BTC in USD', async () => {
    // Mock successful API responses
    const mockBinanceResponse = {
      lastPrice: '50000.00',
      volume: '1000.5'
    }
    
    const mockKrakenResponse = {
      result: {
        XXBTZUSD: {
          c: ['50001.00']
        }
      }
    }

    const mockBitstampResponse = {
      last: '50002.00'
    }

    const mockCoindeskResponse = {
      bpi: {
        USD: {
          rate_float: 50003.00
        }
      }
    }

    const mockCoinGeckoResponse = {
      bitcoin: {
        usd: 50004.00
      }
    }

    // Mock fetch responses
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBinanceResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKrakenResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBitstampResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoindeskResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })

    const request = new NextRequest('http://localhost:3000/api/prices?vs=USD&base=bitcoin')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('base', 'BTC')
    expect(data).toHaveProperty('vs', 'USD')
    expect(data).toHaveProperty('price')
    expect(data).toHaveProperty('sources')
    expect(data).toHaveProperty('updatedAt')
    expect(Array.isArray(data.sources)).toBe(true)
    expect(data.sources.length).toBeGreaterThan(0)
  })

  it('should handle different currencies', async () => {
    const mockCoinGeckoResponse = {
      bitcoin: {
        eur: 45000.00
      }
    }

    const mockFxRates = {
      EUR: 0.92
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ rates: mockFxRates })
      })

    const request = new NextRequest('http://localhost:3000/api/prices?vs=EUR&base=bitcoin')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.vs).toBe('EUR')
  })

  it('should handle API failures gracefully', async () => {
    // Mock all API calls to fail
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    const request = new NextRequest('http://localhost:3000/api/prices?vs=USD&base=bitcoin')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.price).toBe(0)
    expect(data.sources).toEqual([])
  })

  it('should handle different crypto currencies', async () => {
    const mockCoinGeckoResponse = {
      ethereum: {
        usd: 3000.00
      }
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })

    const request = new NextRequest('http://localhost:3000/api/prices?vs=USD&base=ethereum')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.base).toBe('ETHEREUM')
  })

  it('should use default values when no parameters provided', async () => {
    const mockCoinGeckoResponse = {
      bitcoin: {
        usd: 50000.00
      }
    }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCoinGeckoResponse)
      })

    const request = new NextRequest('http://localhost:3000/api/prices')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.base).toBe('BTC')
    expect(data.vs).toBe('USD')
  })
})
