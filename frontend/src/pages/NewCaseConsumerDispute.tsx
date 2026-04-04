
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Calendar, Store, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NewCaseConsumerDispute = () => {
  const [disputeType, setDisputeType] = useState('');
  const [productService, setProductService] = useState('');
  const [sellerInfo, setSellerInfo] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleFileUpload = (type: string) => {
    const fileName = `${type}_${Date.now()}.pdf`;
    setUploadedFiles(prev => [...prev, fileName]);
  };

  const canSubmit = disputeType && productService && description.trim().length > 10;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Back Button */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/new-case">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Consumer Dispute Case</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Report issues with products, services, or unfair business practices to receive targeted consumer protection guidance.
          </p>
        </div>

        {/* Dispute Details */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Consumer Dispute Details</CardTitle>
            <CardDescription>
              Please provide information about your consumer dispute or product/service issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dispute-type">Type of Dispute</Label>
                <Select value={disputeType} onValueChange={setDisputeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispute type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defective-product">Defective Product (Mangelhaftes Produkt)</SelectItem>
                    <SelectItem value="warranty-claim">Warranty Claim (Garantieanspruch)</SelectItem>
                    <SelectItem value="service-complaint">Service Complaint (Dienstleistungsbeschwerde)</SelectItem>
                    <SelectItem value="refund-issue">Refund Issue (Rückerstattungsproblem)</SelectItem>
                    <SelectItem value="misleading-advertising">Misleading Advertising (Irreführende Werbung)</SelectItem>
                    <SelectItem value="subscription-cancellation">Subscription Cancellation (Abo-Kündigung)</SelectItem>
                    <SelectItem value="other">Other Consumer Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input 
                  id="purchase-date"
                  type="date"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product-service">Product/Service Name</Label>
              <Input 
                id="product-service"
                placeholder="e.g., Samsung TV, Deutsche Telekom Internet, Amazon purchase"
                value={productService}
                onChange={(e) => setProductService(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="seller-info">Seller/Service Provider Information</Label>
              <Input 
                id="seller-info"
                placeholder="Company name, online store, physical location"
                value={sellerInfo}
                onChange={(e) => setSellerInfo(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Problem Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail: what went wrong, when you noticed it, what steps you've already taken, what response you received from the seller..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card className="bg-background border rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>
              Upload receipts, warranties, correspondence, photos, or any other relevant evidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => handleFileUpload('receipt')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Receipt/Invoice</div>
                  <div className="text-xs text-muted-foreground">Kaufbeleg, Rechnung</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('correspondence')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Upload className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Correspondence</div>
                  <div className="text-xs text-muted-foreground">Emails, letters, chat logs</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleFileUpload('evidence')}
                className="h-32 flex flex-col items-center justify-center space-y-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-medium">Evidence</div>
                  <div className="text-xs text-muted-foreground">Photos, warranty, contracts</div>
                </div>
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files:</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/30 rounded border">
                      <Upload className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{file}</span>
                      <span className="text-xs text-green-600">✓ Uploaded & Analyzed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Guidance */}
        <Card className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-lg p-6 mb-8">
          <CardHeader>
            <CardTitle className="text-green-800">Consumer Protection Guidance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 mb-4">
              German consumer protection laws (Verbraucherschutzgesetze) provide strong rights including 
              warranty claims, return rights, and protection against unfair business practices.
            </p>
            <div className="text-sm text-green-600">
              <strong>Your rights may include:</strong> 14-day return policy for online purchases, 
              2-year warranty on products, right to repair or replacement, compensation for defective services.
            </div>
          </CardContent>
        </Card>

        {/* Submission */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <CardContent className="text-center">
            <h3 className="text-xl font-semibold mb-4">Ready for Consumer Rights Analysis?</h3>
            <p className="text-muted-foreground mb-6">
              Our AI will analyze your consumer dispute, review applicable German consumer protection laws, 
              and recommend the best course of action.
            </p>
            <Button
              size="lg"
              disabled={!canSubmit}
              asChild={canSubmit}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {canSubmit ? (
                <Link to={`/case-assessment/consumer-${Date.now()}`}>
                  Analyze My Consumer Case
                </Link>
              ) : (
                <span>Please complete dispute details and description</span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCaseConsumerDispute;
