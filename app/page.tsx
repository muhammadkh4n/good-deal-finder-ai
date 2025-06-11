'use client'

import { useState, FormEvent } from 'react'

interface Product {
  name: string
  price: number
  description: string
  dealScore?: number
  url: string
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Product[]>([])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setResults([])

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })
      
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <main className="search-container">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Good Deal Finder AI</h1>
        <p className="text-xl text-gray-600">Search for any product to find the best deals</p>
      </div>

      <div className="search-box">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search for any product (e.g. gaming laptop, headphones, smart watch)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            type="submit" 
            className="search-button w-full"
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Find Deals'}
          </button>
        </form>
      </div>

      {isSearching && (
        <div className="mt-8 text-center">
          <p className="text-lg">Searching the web for the best deals...</p>
          <p className="text-sm text-gray-500 mt-2">This might take a moment as we analyze products for you</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-container">
          <h2 className="text-2xl font-bold mb-4">Results</h2>
          {results.map((product, index) => (
            <div key={index} className="product-card">
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-green-600 font-bold text-lg">${product.price}</p>
              <p className="text-gray-600">{product.description}</p>
              {product.dealScore && (
                <div className="mt-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Deal Score: {product.dealScore}/10
                  </span>
                </div>
              )}
              <a 
                href={product.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-3 inline-block text-blue-600 hover:underline"
              >
                View Deal
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
