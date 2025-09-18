import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function Dashboard({ user, logout }) {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    flagged: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        calculateStats(data.transactions);
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (transactions) => {
    const stats = {
      total: transactions.length,
      inProgress: 0,
      completed: 0,
      flagged: 0,
    };

    transactions.forEach(transaction => {
      if (transaction.status === 'completed') {
        stats.completed++;
      } else if (transaction.status === 'flagged') {
        stats.flagged++;
      } else {
        stats.inProgress++;
      }
    });

    setStats(stats);
  };

  const getStatusColor = (status) => {
    const colors = {
      setup: "bg-status-setup text-white",
      banking_info: "bg-status-banking text-white",
      buyer_verification: "bg-status-buyerVerification text-white",
      seller_verification: "bg-status-sellerVerification text-white",
      completed: "bg-status-completed text-white",
      flagged: "bg-status-flagged text-white",
    };
    return colors[status] || "bg-primary text-white";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatStatus = (status) => {
    const statusMap = {
      setup: "Setup",
      banking_info: "Banking Info",
      buyer_verification: "Buyer Verification",
      seller_verification: "Seller Verification",
      completed: "Completed",
      flagged: "Flagged",
    };
    return statusMap[status] || status;
  };

  const getActionItems = (transaction) => {
    const userRoles = user?.roles || [];
    const actions = [];

    if (transaction.status === 'setup' && userRoles.includes('main_escrow')) {
      actions.push('Add participants to transaction');
    }

    if (transaction.status === 'banking_info') {
      if (userRoles.includes('buyer') || userRoles.includes('lender')) {
        actions.push('Submit banking information');
      }
      if (userRoles.includes('secondary_escrow')) {
        actions.push('Approve banking information');
      }
    }

    return actions;
  };

  const isMainEscrow = user?.roles?.includes("main_escrow");

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <Layout user={user} logout={logout}>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your real estate wire transfer transactions securely
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                All your transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Active transactions requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                Successfully processed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.flagged}</div>
              <p className="text-xs text-muted-foreground">
                Transactions requiring review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Only for Main Escrow */}
        {isMainEscrow && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild>
                  <Link href="/transactions/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Transaction
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/transactions">
                    <FileText className="mr-2 h-4 w-4" />
                    View All Transactions
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="text-primary hover:text-primary-hover">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-muted-foreground">Loading transactions...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No transactions found</p>
                {isMainEscrow && (
                  <Button asChild className="mt-4">
                    <Link href="/transactions/new">Create your first transaction</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="font-semibold text-primary hover:text-primary-hover"
                          >
                            {transaction.transactionId}
                          </Link>
                          <Badge className={getStatusColor(transaction.status)}>
                            {formatStatus(transaction.status)}
                          </Badge>
                          {getActionItems(transaction).length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.propertyAddress}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(transaction.purchaseAmount)}
                          </span>
                          <span className="text-muted-foreground">
                            Role: {transaction.userRole || 'N/A'}
                          </span>
                        </div>
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
  );
}