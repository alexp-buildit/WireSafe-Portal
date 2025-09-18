import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  status: "setup" | "banking" | "buyerVerification" | "sellerVerification" | "completed" | "flagged";
  propertyAddress: string;
  purchaseAmount: number;
  userRole: string;
  actionRequired: boolean;
  createdAt: string;
}

// Mock data - in a real app, this would come from an API
const mockTransactions: Transaction[] = [
  {
    id: "TXN-001",
    status: "banking",
    propertyAddress: "123 Oak Street, Los Angeles, CA 90210",
    purchaseAmount: 750000,
    userRole: "Main Escrow Officer",
    actionRequired: true,
    createdAt: "2024-01-15",
  },
  {
    id: "TXN-002",
    status: "buyerVerification",
    propertyAddress: "456 Pine Avenue, Beverly Hills, CA 90212",
    purchaseAmount: 1250000,
    userRole: "Main Escrow Officer",
    actionRequired: false,
    createdAt: "2024-01-14",
  },
  {
    id: "TXN-003",
    status: "completed",
    propertyAddress: "789 Maple Drive, Santa Monica, CA 90401",
    purchaseAmount: 950000,
    userRole: "Main Escrow Officer",
    actionRequired: false,
    createdAt: "2024-01-10",
  },
];

const mockStats = {
  total: 15,
  inProgress: 8,
  completed: 6,
  flagged: 1,
};

const mockUser = {
  firstName: "John",
  roles: ["Main Escrow Officer"],
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState(mockStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTransactions(mockTransactions);
      setIsLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status: Transaction["status"]) => {
    const colors = {
      setup: "bg-status-setup text-white",
      banking: "bg-status-banking text-white",
      buyerVerification: "bg-status-buyerVerification text-white",
      sellerVerification: "bg-status-sellerVerification text-white",
      completed: "bg-status-completed text-white",
      flagged: "bg-status-flagged text-white",
    };
    return colors[status];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatStatus = (status: Transaction["status"]) => {
    const statusMap = {
      setup: "Setup",
      banking: "Banking Info",
      buyerVerification: "Buyer Verification",
      sellerVerification: "Seller Verification",
      completed: "Completed",
      flagged: "Flagged",
    };
    return statusMap[status];
  };

  const isMainEscrow = mockUser.roles.includes("Main Escrow Officer");

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {mockUser.firstName}
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
              +2.1% from last month
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
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to="/transactions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Transaction
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/transactions">
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
            <Link to="/transactions" className="text-primary hover:text-primary-hover">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No transactions found</p>
              {isMainEscrow && (
                <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Link to="/transactions/new">Create your first transaction</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/transactions/${transaction.id}`}
                          className="font-semibold text-primary hover:text-primary-hover"
                        >
                          {transaction.id}
                        </Link>
                        <Badge className={getStatusColor(transaction.status)}>
                          {formatStatus(transaction.status)}
                        </Badge>
                        {transaction.actionRequired && (
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
                          Role: {transaction.userRole}
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
  );
}