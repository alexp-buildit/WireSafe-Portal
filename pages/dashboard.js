import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

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
    const statusVariants = {
      'setup': 'default',
      'banking_info': 'secondary',
      'buyer_verification': 'outline',
      'seller_verification': 'secondary',
      'completed': 'default',
      'flagged': 'destructive'
    }
    return statusVariants[status] || 'default'
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
          <Card className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground border-0">
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-primary-foreground/80">
                Manage your real estate wire transfer transactions securely
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Transactions</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">In Progress</p>
                  <p className="text-3xl font-bold text-warning mt-1">
                    {stats.setup + stats.bankingInfo + stats.buyerVerification + stats.sellerVerification}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-success mt-1">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 bg-success rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Flagged</p>
                  <p className="text-3xl font-bold text-destructive mt-1">{stats.flagged}</p>
                </div>
                <div className="w-12 h-12 bg-destructive rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {user.roles?.includes('main_escrow') && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <Link href="/transactions/new" className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Transaction
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/transactions" className="flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    View All Transactions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions" className="flex items-center gap-1">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>

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
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          href={`/transactions/${transaction.id}`}
                          className="text-primary hover:text-primary-hover font-medium hover:underline"
                        >
                          {transaction.transactionId}
                        </Link>
                        <Badge variant={getStatusClass(transaction.status)}>
                          {getStatusDisplay(transaction.status)}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-sm mb-1">
                        {transaction.propertyAddress}
                      </div>
                      <div className="text-success font-semibold flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {transaction.purchaseAmount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Your role: {transaction.userRole || 'N/A'}</div>
                      {getActionItems(transaction).length > 0 && (
                        <Badge variant="secondary" className="mt-1">
                          Action required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}