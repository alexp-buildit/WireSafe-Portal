import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import Link from 'next/link'

export default function Transactions({ user, logout }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      } else {
        setError('Failed to fetch transactions')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = (status) => {
    const statusMap = {
      'setup': 'Setup',
      'banking_info': 'Banking Info',
      'buyer_verification': 'Buyer Verification',
      'seller_verification': 'Seller Verification',
      'completed': 'Completed',
      'flagged': 'Flagged'
    }
    return statusMap[status] || status
  }

  const getStatusClass = (status) => {
    const statusClasses = {
      'setup': 'bg-blue-100 text-blue-800',
      'banking_info': 'bg-yellow-100 text-yellow-800',
      'buyer_verification': 'bg-purple-100 text-purple-800',
      'seller_verification': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'flagged': 'bg-red-100 text-red-800'
    }
    return statusClasses[status] || 'bg-blue-100 text-blue-800'
  }

  if (!user) {
    return <div>Please log in to access transactions.</div>
  }

  return (
    <Layout user={user} logout={logout}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">All Transactions</h1>
              <p className="text-gray-600">
                Manage and monitor all your real estate wire transfer transactions
              </p>
            </div>
            {user.roles?.includes('main_escrow') && (
              <Link
                href="/transactions/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Transaction
              </Link>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-500 mt-4 font-medium">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchTransactions}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Transactions Found</h2>
              <p className="text-gray-500 font-medium mb-6">Get started by creating your first transaction.</p>
              {user.roles?.includes('main_escrow') && (
                <Link
                  href="/transactions/new"
                  className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create First Transaction
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Link
                        href={`/transactions/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-700 font-bold text-xl hover:underline transition-colors duration-200"
                      >
                        {transaction.transactionId}
                      </Link>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(transaction.status)}`}>
                        <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                        {getStatusDisplay(transaction.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Created: {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Updated: {new Date(transaction.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{transaction.propertyAddress}</span>
                    </div>

                    <div className="flex items-center text-green-600 font-bold">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      ${transaction.purchaseAmount?.toLocaleString()}
                    </div>

                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Your role: <span className="font-medium">{transaction.userRole || 'N/A'}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex space-x-4">
                      <div className="text-gray-500">
                        Main Escrow: <span className="font-medium text-gray-700">{transaction.mainEscrowUsername}</span>
                      </div>
                      <div className="text-gray-500">
                        Secondary Escrow: <span className="font-medium text-gray-700">{transaction.secondaryEscrowUsername}</span>
                      </div>
                    </div>
                    <Link
                      href={`/transactions/${transaction.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center"
                    >
                      View Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}