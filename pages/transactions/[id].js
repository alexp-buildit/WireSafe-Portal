import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'

export default function TransactionDetail({ user, logout }) {
  const router = useRouter()
  const { id } = router.query
  const [transaction, setTransaction] = useState(null)
  const [participants, setParticipants] = useState([])
  const [bankingInfo, setBankingInfo] = useState([])
  const [verificationActions, setVerificationActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    username: '',
    role: 'buyer'
  })

  useEffect(() => {
    if (id) {
      fetchTransactionDetails()
    }
  }, [id])

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setTransaction(data.transaction)
        setParticipants(data.participants || [])
        setBankingInfo(data.bankingInfo || [])
        setVerificationActions(data.verificationActions || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to fetch transaction details')
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

  const getRoleDisplay = (role) => {
    const roleMap = {
      'main_escrow': 'Main Escrow',
      'secondary_escrow': 'Secondary Escrow',
      'buyer': 'Buyer',
      'seller': 'Seller',
      'lender': 'Lender'
    }
    return roleMap[role] || role
  }

  const handleAddParticipant = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/transactions/${id}/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newParticipant)
      })

      if (response.ok) {
        setShowAddParticipantModal(false)
        setNewParticipant({
          username: '',
          role: 'buyer'
        })
        fetchTransactionDetails()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to add participant')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  if (!user) {
    return <div>Please log in to access this transaction.</div>
  }

  if (loading) {
    return (
      <Layout user={user} logout={logout}>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading transaction details...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout user={user} logout={logout}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Transaction</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={fetchTransactionDetails}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
              <Link
                href="/transactions"
                className="bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Back to Transactions
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} logout={logout}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Link
                  href="/transactions"
                  className="mr-4 p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{transaction.transactionId}</h1>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusClass(transaction.status)} bg-white/90`}>
                      <div className="w-3 h-3 rounded-full bg-current mr-2"></div>
                      {getStatusDisplay(transaction.status)}
                    </span>
                    <span className="text-blue-100">
                      Created: {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Transaction Overview */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Transaction Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Property Address</label>
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 mr-3 mt-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-800 font-medium">{transaction.propertyAddress}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Purchase Amount</label>
                  <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-2xl font-bold text-green-600">${transaction.purchaseAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Main Escrow Officer</label>
                  <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">
                          {transaction.mainEscrow.firstName?.[0]}{transaction.mainEscrow.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{transaction.mainEscrow.firstName} {transaction.mainEscrow.lastName}</p>
                        <p className="text-sm text-gray-600">@{transaction.mainEscrow.username}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Secondary Escrow Officer</label>
                  <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">
                          {transaction.secondaryEscrow.firstName?.[0]}{transaction.secondaryEscrow.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{transaction.secondaryEscrow.firstName} {transaction.secondaryEscrow.lastName}</p>
                        <p className="text-sm text-gray-600">@{transaction.secondaryEscrow.username}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            {participants.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  Transaction Participants
                </h2>
                <div className="space-y-6">
                  {participants.map((participant, index) => (
                    <div key={index} className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center flex-1">
                          <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                              {participant.firstName?.[0]}{participant.lastName?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-gray-800 text-lg">{participant.firstName} {participant.lastName}</h4>
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0">
                                {getRoleDisplay(participant.role)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">@{participant.username}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          <p><span className="font-medium text-gray-700">Email:</span><br/>{participant.email}</p>
                          <p><span className="font-medium text-gray-700">Phone:</span><br/>{participant.phoneNumber}</p>
                        </div>
                        <div className="space-y-2">
                          {participant.companyName && (
                            <p><span className="font-medium text-gray-700">Company:</span><br/>{participant.companyName}</p>
                          )}
                          <p><span className="font-medium text-gray-700">Added:</span><br/>{new Date(participant.addedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAddParticipantModal(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 text-sm"
                >
                  Add Participants
                </button>
                <button className="w-full bg-white border-2 border-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:border-gray-300 transition-colors duration-200 text-sm">
                  Update Status
                </button>
                <button className="w-full bg-white border-2 border-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:border-gray-300 transition-colors duration-200 text-sm">
                  View Documents
                </button>
              </div>
            </div>

            {/* Transaction Timeline */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Timeline
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800">Transaction Created</p>
                    <p className="text-gray-600">{new Date(transaction.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {transaction.updatedAt !== transaction.createdAt && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <div>
                      <p className="font-medium text-gray-800">Last Updated</p>
                      <p className="text-gray-600">{new Date(transaction.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Add Participant Modal */}
        {showAddParticipantModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Add Participant</h3>
                <button
                  onClick={() => setShowAddParticipantModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddParticipant} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newParticipant.username}
                    onChange={(e) => setNewParticipant({...newParticipant, username: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter existing user's username"
                  />
                  <p className="text-sm text-gray-500 mt-1">The user must already be registered in the system</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant({...newParticipant, role: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="lender">Lender</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddParticipantModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Add Participant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}