import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, DollarSign, Calendar, User } from "lucide-react";
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

// Mock data - expanded list
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
  {
    id: "TXN-004",
    status: "sellerVerification",
    propertyAddress: "321 Cedar Lane, Pasadena, CA 91101",
    purchaseAmount: 680000,
    userRole: "Secondary Escrow Officer",
    actionRequired: true,
    createdAt: "2024-01-08",
  },
  {
    id: "TXN-005",
    status: "setup",
    propertyAddress: "555 Willow Way, Manhattan Beach, CA 90266",
    purchaseAmount: 1850000,
    userRole: "Main Escrow Officer",
    actionRequired: false,
    createdAt: "2024-01-05",
  },
  {
    id: "TXN-006",
    status: "flagged",
    propertyAddress: "987 Oak Park Blvd, West Hollywood, CA 90069",
    purchaseAmount: 420000,
    userRole: "Main Escrow Officer",
    actionRequired: true,
    createdAt: "2024-01-03",
  },
];

const mockUser = {
  roles: ["Main Escrow Officer"],
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      try {
        setTransactions(mockTransactions);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load transactions");
        setIsLoading(false);
      }
    }, 800);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isMainEscrow = mockUser.roles.includes("Main Escrow Officer");

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Transactions</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all your real estate wire transfer transactions
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-destructive mb-4">
              <FileText className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Transactions</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all your real estate wire transfer transactions
          </p>
        </div>
        {isMainEscrow && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Link>
          </Button>
        )}
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading transactions...</div>
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {isMainEscrow 
                  ? "Create your first transaction to get started" 
                  : "No transactions have been shared with you yet"
                }
              </p>
              {isMainEscrow && (
                <Button asChild>
                  <Link to="/transactions/new">Create your first transaction</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/transactions/${transaction.id}`}
                        className="text-xl font-semibold text-primary hover:text-primary-hover transition-colors"
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

                    {/* Property Address */}
                    <p className="text-muted-foreground">
                      {transaction.propertyAddress}
                    </p>

                    {/* Details Row */}
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-4 w-4 text-success" />
                        {formatCurrency(transaction.purchaseAmount)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {transaction.userRole}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Created {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <Button variant="outline" asChild>
                      <Link to={`/transactions/${transaction.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}