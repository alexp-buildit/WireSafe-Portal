import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

export default function NewTransaction({ user, logout }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    propertyAddress: '',
    purchaseAmount: '',
    secondaryEscrowUsername: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          propertyAddress: formData.propertyAddress,
          purchaseAmount: parseFloat(formData.purchaseAmount),
          secondaryEscrowUsername: formData.secondaryEscrowUsername
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/transactions/${data.transaction.id}`)
      } else {
        setError(data.message || data.error || 'Failed to create transaction')
      }
    } catch (error) {
      console.error('Transaction creation error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!user || !user.roles?.includes('main_escrow')) {
    return (
      <Layout user={user} logout={logout}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-600">Only main escrow officers can create new transactions.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} logout={logout}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Transaction</h1>
          <p className="text-gray-600">
            Set up a new real estate wire transfer transaction
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Property Address */}
            <div>
              <label htmlFor="propertyAddress" className="block text-sm font-bold text-gray-800 mb-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Property Address
                </div>
              </label>
              <textarea
                id="propertyAddress"
                name="propertyAddress"
                rows={3}
                value={formData.propertyAddress}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={500}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-gray-800 placeholder-gray-400"
                placeholder="Enter the complete property address including street, city, state, and ZIP code"
              />
              <p className="text-xs text-gray-500 mt-2">
                Minimum 10 characters, maximum 500 characters
              </p>
            </div>

            {/* Purchase Amount */}
            <div>
              <label htmlFor="purchaseAmount" className="block text-sm font-bold text-gray-800 mb-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Purchase Amount
                </div>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-3 text-gray-500 font-medium">$</div>
                <input
                  id="purchaseAmount"
                  name="purchaseAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchaseAmount}
                  onChange={handleChange}
                  required
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-gray-800 placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the total purchase amount for the property
              </p>
            </div>

            {/* Secondary Escrow Username */}
            <div>
              <label htmlFor="secondaryEscrowUsername" className="block text-sm font-bold text-gray-800 mb-3">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Secondary Escrow Officer Username
                </div>
              </label>
              <input
                id="secondaryEscrowUsername"
                name="secondaryEscrowUsername"
                type="text"
                value={formData.secondaryEscrowUsername}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors duration-200 text-gray-800 placeholder-gray-400"
                placeholder="Enter the username of the secondary escrow officer"
              />
              <p className="text-xs text-gray-500 mt-2">
                The secondary escrow officer must have the 'secondary_escrow' role
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="text-red-800 font-semibold">Error</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-md transform hover:-translate-y-1 disabled:translate-y-0 transition-all duration-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Creating Transaction...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Transaction
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-800 font-bold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  )
}