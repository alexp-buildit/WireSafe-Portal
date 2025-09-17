import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'

export default function Dashboard({ user, logout }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    setup: 0,
    bankingInfo: 0,
    buyerVerification: 0,
    sellerVerification: 0,
    completed: 0,
    flagged: 0
  })

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
        calculateStats(data.transactions)
      } else {
        setError('Failed to fetch transactions')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (transactions) => {
    const stats = {
      total: transactions.length,
      setup: 0,
      bankingInfo: 0,
      buyerVerification: 0,
      sellerVerification: 0,
      completed: 0,
      flagged: 0
    }

    transactions.forEach(transaction => {
      const status = transaction.status.replace('-', '')
      if (stats.hasOwnProperty(status)) {
        stats[status]++
      }
    })

    setStats(stats)
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

  const getActionItems = (transaction) => {
    const userRoles = user?.roles || []
    const actions = []

    if (transaction.status === 'setup' && userRoles.includes('main_escrow')) {
      actions.push('Add participants to transaction')
    }

    if (transaction.status === 'banking_info') {
      if (userRoles.includes('buyer') || userRoles.includes('lender')) {
        actions.push('Submit banking information')
      }
      if (userRoles.includes('secondary_escrow')) {
        actions.push('Approve banking information')
      }
    }

    if (transaction.status === 'buyer_verification') {
      if (userRoles.includes('buyer') || userRoles.includes('lender')) {
        actions.push('Complete verification steps')
      }
      if (userRoles.includes('main_escrow')) {
        actions.push('Verify fund receipts')
      }
    }

    if (transaction.status === 'seller_verification') {
      if (userRoles.includes('seller')) {
        actions.push('Verify banking info and confirm payment')
      }
      if (userRoles.includes('main_escrow') || userRoles.includes('secondary_escrow')) {
        actions.push('Verify seller identity and authorize payment')
      }
    }

    return actions
  }

  if (!user) {
    return <div>Please log in to access the dashboard.</div>
  }

  return (
    <Layout user={user} logout={logout}>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-lg p-6 text-white shadow-md">
            <h1 className="text-2xl font-semibold mb-1">
              Welcome back, {user.firstName}
            </h1>
            <p className="text-slate-300 text-sm">
              Manage your real estate wire transfer transactions securely
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {stats.setup + stats.bankingInfo + stats.buyerVerification + stats.sellerVerification}
                </p>
              </div>
              <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Flagged</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.flagged}</p>
              </div>
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19.937l13.856-13.855" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {user.roles?.includes('main_escrow') && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/transactions/new"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Transaction
              </Link>
              <Link
                href="/transactions"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View All Transactions
              </Link>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link
              href="/transactions"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              View all
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-500 ml-3 text-sm">Loading transactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mb-2">No transactions found</p>
              {user.roles?.includes('main_escrow') && (
                <Link
                  href="/transactions/new"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Create your first transaction
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {transaction.transactionId}
                        </Link>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(transaction.status)}`}>
                          {getStatusDisplay(transaction.status)}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm mb-1">
                        {transaction.propertyAddress}
                      </div>
                      <div className="text-green-600 font-semibold">
                        ${transaction.purchaseAmount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Your role: {transaction.userRole || 'N/A'}</div>
                      {getActionItems(transaction).length > 0 && (
                        <div className="text-amber-600 font-medium mt-1">
                          Action required
                        </div>
                      )}
                    </div>
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