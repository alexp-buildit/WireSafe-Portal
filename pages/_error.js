import { useEffect } from 'react'

function Error({ statusCode, hasGetInitialProps, err }) {
  useEffect(() => {
    if (err) {
      console.error('Client-side error:', err)
    }
  }, [err])

  const getErrorMessage = () => {
    switch (statusCode) {
      case 400:
        return 'Bad Request - The request was invalid'
      case 401:
        return 'Unauthorized - Please log in to access this resource'
      case 403:
        return 'Forbidden - You do not have permission to access this resource'
      case 404:
        return 'Page Not Found - The requested page could not be found'
      case 429:
        return 'Too Many Requests - Please try again later'
      case 500:
        return 'Internal Server Error - Something went wrong on our end'
      case 502:
        return 'Bad Gateway - Service temporarily unavailable'
      case 503:
        return 'Service Unavailable - Please try again later'
      case 504:
        return 'Gateway Timeout - The request timed out'
      default:
        return statusCode
          ? `An error ${statusCode} occurred on server`
          : 'An error occurred on client'
    }
  }

  const getErrorIcon = () => {
    if (statusCode >= 500) return '🚨'
    if (statusCode === 404) return '🔍'
    if (statusCode === 403) return '🔒'
    if (statusCode === 401) return '🔐'
    return '⚠️'
  }

  const getErrorColor = () => {
    if (statusCode >= 500) return 'text-red-600'
    if (statusCode === 404) return 'text-blue-600'
    if (statusCode === 403 || statusCode === 401) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl mb-4">{getErrorIcon()}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {statusCode || 'Error'}
          </h1>
          <p className={`text-lg ${getErrorColor()} mb-8`}>
            {getErrorMessage()}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            If you believe this is an error, please contact support or try again later.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="w-full btn-secondary"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && err && (
          <div className="mt-8 text-left">
            <details className="bg-gray-100 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium text-gray-700">
                Developer Information
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {err.stack || err.message || 'No error details available'}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error