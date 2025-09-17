import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

export default function Profile({ user, logout }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (user && authenticated) {
      fetchProfile()
    }
  }, [user, authenticated])

  const verifyPassword = async () => {
    try {
      setAuthError('')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: user.username,
          password: password
        })
      })

      if (response.ok) {
        setAuthenticated(true)
        setPassword('')
      } else {
        const data = await response.json()
        setAuthError(data.message || 'Invalid password')
      }
    } catch (error) {
      setAuthError('Network error. Please try again.')
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.username || '',
          phone: data.user.phone || ''
        })
      } else {
        setError('Failed to fetch profile')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setEditing(false)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update profile')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  if (!user) {
    return <div>Please log in to access your profile.</div>
  }

  if (!authenticated) {
    return (
      <Layout user={user} logout={logout}>
        <div className="max-w-md mx-auto mt-16">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify Your Identity</h2>
              <p className="text-gray-600 text-sm">Please enter your password to access your profile settings</p>
            </div>

            {authError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{authError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                />
              </div>

              <button
                onClick={verifyPassword}
                disabled={!password}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Verify Identity
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} logout={logout}>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-lg p-6 text-white shadow-md">
            <h1 className="text-2xl font-semibold mb-1">
              Profile Settings
            </h1>
            <p className="text-slate-300 text-sm">
              Manage your account information and preferences
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-600"></div>
            <p className="text-gray-500 ml-3 text-sm">Loading profile...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{profile?.firstName || 'Not set'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">{profile?.lastName || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile?.username || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile?.phone || 'Not set'}</p>
                    )}
                  </div>

                  {editing && (
                    <div className="flex items-center space-x-3 pt-4">
                      <button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false)
                          setFormData({
                            firstName: profile?.firstName || '',
                            lastName: profile?.lastName || '',
                            email: profile?.username || '',
                            phone: profile?.phone || ''
                          })
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.firstName} {profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{profile?.username}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">User ID:</span>
                      <span className="text-gray-900 font-mono text-xs">{profile?.id}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-500">Account Created:</span>
                      <span className="text-gray-900">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Roles</h3>
                <div className="space-y-2">
                  {profile?.roles?.length > 0 ? (
                    profile.roles.map((role, index) => (
                      <div key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mr-2">
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No roles assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}