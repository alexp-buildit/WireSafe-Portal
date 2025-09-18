import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, DollarSign, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function NewTransaction() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyAddress: "",
    purchaseAmount: "",
    buyerName: "",
    buyerEmail: "",
    sellerName: "",
    sellerEmail: "",
    lenderName: "",
    lenderEmail: "",
    escrowOfficer: "",
    escrowEmail: "",
    transactionType: "",
    closingDate: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Transaction Created",
        description: "New transaction has been successfully created and all parties have been notified.",
      });

      navigate("/transactions");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/transactions")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Transaction</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new secure wire transfer transaction for real estate closing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Property Information
              </CardTitle>
              <CardDescription>
                Basic information about the property being transferred
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="propertyAddress">Property Address *</Label>
                  <Input
                    id="propertyAddress"
                    placeholder="123 Main St, City, State, ZIP"
                    value={formData.propertyAddress}
                    onChange={(e) => handleInputChange("propertyAddress", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="purchaseAmount">Purchase Amount *</Label>
                  <Input
                    id="purchaseAmount"
                    type="number"
                    placeholder="500000"
                    value={formData.purchaseAmount}
                    onChange={(e) => handleInputChange("purchaseAmount", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="transactionType">Transaction Type *</Label>
                  <Select onValueChange={(value) => handleInputChange("transactionType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="refinance">Refinance</SelectItem>
                      <SelectItem value="cash-out-refinance">Cash-Out Refinance</SelectItem>
                      <SelectItem value="equity-loan">Home Equity Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="closingDate">Expected Closing Date</Label>
                <Input
                  id="closingDate"
                  type="date"
                  value={formData.closingDate}
                  onChange={(e) => handleInputChange("closingDate", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Buyer Information
              </CardTitle>
              <CardDescription>
                Contact information for the property buyer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyerName">Buyer Name *</Label>
                  <Input
                    id="buyerName"
                    placeholder="John Doe"
                    value={formData.buyerName}
                    onChange={(e) => handleInputChange("buyerName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="buyerEmail">Buyer Email *</Label>
                  <Input
                    id="buyerEmail"
                    type="email"
                    placeholder="john.doe@email.com"
                    value={formData.buyerEmail}
                    onChange={(e) => handleInputChange("buyerEmail", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Seller Information
              </CardTitle>
              <CardDescription>
                Contact information for the property seller
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sellerName">Seller Name *</Label>
                  <Input
                    id="sellerName"
                    placeholder="Jane Smith"
                    value={formData.sellerName}
                    onChange={(e) => handleInputChange("sellerName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sellerEmail">Seller Email *</Label>
                  <Input
                    id="sellerEmail"
                    type="email"
                    placeholder="jane.smith@email.com"
                    value={formData.sellerEmail}
                    onChange={(e) => handleInputChange("sellerEmail", e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lender Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Lender Information
              </CardTitle>
              <CardDescription>
                Financial institution providing the loan (if applicable)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lenderName">Lender/Bank Name</Label>
                  <Input
                    id="lenderName"
                    placeholder="First National Bank"
                    value={formData.lenderName}
                    onChange={(e) => handleInputChange("lenderName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lenderEmail">Lender Contact Email</Label>
                  <Input
                    id="lenderEmail"
                    type="email"
                    placeholder="loan.officer@bank.com"
                    value={formData.lenderEmail}
                    onChange={(e) => handleInputChange("lenderEmail", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Escrow Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Escrow Information
              </CardTitle>
              <CardDescription>
                Escrow company and officer handling the transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="escrowOfficer">Escrow Officer Name</Label>
                  <Input
                    id="escrowOfficer"
                    placeholder="Sarah Johnson"
                    value={formData.escrowOfficer}
                    onChange={(e) => handleInputChange("escrowOfficer", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="escrowEmail">Escrow Officer Email</Label>
                  <Input
                    id="escrowEmail"
                    type="email"
                    placeholder="sarah.johnson@escrow.com"
                    value={formData.escrowEmail}
                    onChange={(e) => handleInputChange("escrowEmail", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any special instructions or additional information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any special instructions or notes for this transaction..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/transactions")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating Transaction..." : "Create Transaction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}