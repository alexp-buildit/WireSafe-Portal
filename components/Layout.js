import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BarChart3, FileText, User, Lock, Menu, X } from 'lucide-react'

export default function Layout({ children, user, logout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: <FileText className="w-4 h-4" />
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: <User className="w-4 h-4" />
    },
  ]

  if (!user) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-80 max-w-sm bg-white h-full shadow-2xl">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent navigation={navigation} router={router} user={user} logout={logout} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent navigation={navigation} router={router} user={user} logout={logout} />
      </div>

      {/* Main content */}
      <div className="flex flex-col md:ml-64 flex-1">
        {/* Top header bar for mobile */}
        <div className="md:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">{user?.firstName?.[0]}</span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, router, user, logout }) {
  return (
    <div className="flex flex-col h-full bg-white shadow-lg">
      {/* Logo section */}
      <div className="flex items-center px-4 py-6">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">WireSafe</h1>
            <p className="text-xs text-gray-500">Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User profile section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-gray-500">{user?.username}</div>
          </div>
          <button
            onClick={logout}
            className="ml-2 p-1 rounded text-gray-400 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {user?.roles?.map(role => role.replace('_', ' ')).join(', ')}
        </div>
      </div>
    </div>
  )
}