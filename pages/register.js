import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Register({ login, user }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    companyName: '',
    password: '',
    confirmPassword: '',
    roles: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (user) {
    router.push('/dashboard')
    return null
  }

  const roleOptions = [
    { value: 'buyer', label: 'Buyer' },
    { value: 'seller', label: 'Seller' },
    { value: 'lender', label: 'Lender' },
    { value: 'main_escrow', label: 'Main Escrow Officer' },
    { value: 'secondary_escrow', label: 'Secondary Escrow Officer' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.roles.length === 0) {
      setError('Please select at least one role')
      setLoading(false)
      return
    }

    try {
      const submitData = { ...formData }
      delete submitData.confirmPassword

      console.log('Submitting registration data:', { ...submitData, password: '[HIDDEN]' });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.user)
      } else {
        console.log('Registration error response:', data)
        let errorMessage = data.message || 'Registration failed'

        if (data.details && data.details.length > 0) {
          errorMessage = data.details.map(detail => detail.message).join(', ')
        }

        setError(errorMessage)
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (type === 'checkbox') {
      if (checked) {
        setFormData({
          ...formData,
          roles: [...formData.roles, value]
        })
      } else {
        setFormData({
          ...formData,
          roles: formData.roles.filter(role => role !== value)
        })
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-primary-600">WireSafe Portal</h1>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the secure wire fraud prevention platform
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="form-input"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="form-label">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="form-input"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="companyName" className="form-label">
                Company Name (Optional)
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                className="form-input"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="form-label">
                Roles (Select all that apply)
              </label>
              <div className="mt-2 space-y-2">
                {roleOptions.map((role) => (
                  <div key={role.value} className="flex items-center">
                    <input
                      id={role.value}
                      name="roles"
                      type="checkbox"
                      value={role.value}
                      checked={formData.roles.includes(role.value)}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={role.value} className="ml-2 block text-sm text-gray-900">
                      {role.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input"
                value={formData.password}
                onChange={handleChange}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must contain at least 12 characters with uppercase, lowercase, number, and special character (@$!%*?&)
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-primary-600 hover:text-primary-500">
              Already have an account? Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}