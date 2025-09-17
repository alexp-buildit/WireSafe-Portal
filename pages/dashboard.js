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
      'setup': 'status-setup',
      'banking_info': 'status-banking-info',
      'buyer_verification': 'status-buyer-verification',
      'seller_verification': 'status-seller-verification',
      'completed': 'status-completed',
      'flagged': 'status-flagged'
    }
    return statusClasses[status] || 'status-setup'
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">
            Manage your real estate wire transfer transactions securely
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">{stats.total}</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Transactions</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">
                    {stats.setup + stats.bankingInfo + stats.buyerVerification + stats.sellerVerification}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">In Progress</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">{stats.completed}</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Completed</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">{stats.flagged}</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Flagged</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {user.roles?.includes('main_escrow') && (
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex space-x-4">
              <Link href="/transactions/new" className="btn-primary">
                Create New Transaction
              </Link>
              <Link href="/transactions" className="btn-secondary">
                View All Transactions
              </Link>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
            <Link href="/transactions" className="text-primary-600 hover:text-primary-500 text-sm">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : error ? (
            <div className="text-danger-600 text-center py-4">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No transactions found. {user.roles?.includes('main_escrow') &&
                <Link href="/transactions/new" className="text-primary-600 hover:text-primary-500">
                  Create your first transaction
                </Link>
              }
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="text-primary-600 hover:text-primary-500 font-medium"
                        >
                          {transaction.transactionId}
                        </Link>
                        <span className={getStatusClass(transaction.status)}>
                          {getStatusDisplay(transaction.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {transaction.propertyAddress}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${transaction.purchaseAmount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Your role: {transaction.userRole || 'N/A'}
                      </div>
                      {getActionItems(transaction).length > 0 && (
                        <div className="text-xs text-warning-600 mt-1">
                          Action required
                        </div>
                      )}
                    </div>
                  </div>
                  {getActionItems(transaction).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-600">
                        Next steps: {getActionItems(transaction).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}