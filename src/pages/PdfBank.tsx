import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import "@/config/firebase";
import { 
  Book, 
  ChevronRight, 
  Download, 
  FileText, 
  Home, 
  Search, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import Navbar from "@/components/Navbar";
import { 
  fetchExamsWithCategories, 
  fetchChildNodes, 
  fetchNodeByDeeplink,
  hasPdf,
  getPdfUrl,
  type Exam,
  type ExamCategory,
  type ChildNode
} from '@/services/pdfBankService';

// Breadcrumb item type
interface BreadcrumbItem {
  name: string;
  deeplink: string;
  type: string;
}

const PdfBank: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<BreadcrumbItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentDeeplink, setCurrentDeeplink] = useState<string>('');

  // Fetch exams and categories
  const { data: examsData, isLoading: examsLoading, error: examsError } = useQuery({
    queryKey: ['exams-with-categories'],
    queryFn: fetchExamsWithCategories,
    retry: 2
  });

  // Fetch child nodes for current path
  const { data: childNodesData, isLoading: childNodesLoading, error: childNodesError } = useQuery({
    queryKey: ['child-nodes', currentDeeplink],
    queryFn: () => currentDeeplink ? fetchChildNodes(currentDeeplink) : Promise.resolve({ statusCode: 200, data: [], from: '', success: true }),
    enabled: !!currentDeeplink,
    retry: 2
  });

  const exams = examsData?.data || [];
  const childNodes = childNodesData?.data || [];

  // Handle exam selection
  const handleExamSelect = (examName: string) => {
    setSelectedExam(examName);
    const exam = exams.find(e => e.exam === examName);
    if (exam) {
      setCurrentPath([
        { name: exam.exam, deeplink: '', type: 'exam' }
      ]);
    }
    setSelectedCategory('');
    setCurrentDeeplink('');
  };

  // Handle category selection
  const handleCategorySelect = (category: ExamCategory) => {
    setSelectedCategory(category.name);
    setCurrentPath(prev => [...prev, { name: category.name, deeplink: category.deeplink, type: 'category' }]);
    setCurrentDeeplink(category.deeplink);
  };

  // Helper function to generate safe filename
  const generateSafeFilename = (name: string): string => {
    return name
      .replace(/[^a-z0-9\s-]/gi, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim() || 'document';
  };

  // Handle PDF download
  const handleDownloadPdf = (node: ChildNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.file) {
      const link = document.createElement('a');
      link.href = node.file;
      link.download = `${generateSafeFilename(node.name)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle node navigation
  const handleNodeClick = (node: ChildNode) => {
    if (!hasPdf(node)) {
      // Navigate deeper for non-PDF items
      setCurrentPath(prev => [...prev, { name: node.name, deeplink: node.deeplink, type: node.type }]);
      setCurrentDeeplink(node.deeplink);
    }
    // For PDF items, don't navigate - let user click view/download buttons
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (index: number) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    
    if (newPath.length === 1) {
      // Back to exam level
      setCurrentDeeplink('');
      setSelectedCategory('');
    } else {
      // Navigate to specific level
      const targetNode = newPath[newPath.length - 1];
      setCurrentDeeplink(targetNode.deeplink);
    }
  };

  // Reset to home
  const handleBackToHome = () => {
    setSelectedExam('');
    setSelectedCategory('');
    setCurrentPath([]);
    setCurrentDeeplink('');
    setSearchQuery('');
  };

  // Filter child nodes based on search
  const filteredChildNodes = childNodes.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current exam
  const currentExam = exams.find(e => e.exam === selectedExam);

  // Loading skeletons
  const renderExamSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderNodeSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <Navbar />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Breadcrumb Navigation */}
        {currentPath.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToHome}
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
              >
                <Home className="h-3 w-3" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              {currentPath.map((item, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`text-sm ${index === currentPath.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {item.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Error States */}
        {examsError && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load exams. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {childNodesError && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load content. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Exam Selection */}
        {!selectedExam && !examsLoading && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground mb-2">PDF Bank</h1>
                  <p className="text-muted-foreground">Select your exam to access study materials</p>
                </div>
              </div>
            </div>
            
            {examsLoading ? (
              renderExamSkeleton()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => (
                  <Card 
                    key={exam.exam} 
                    className="cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50"
                    onClick={() => handleExamSelect(exam.exam)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span>{exam.exam}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {exam.categories.length} categories
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Selection */}
        {selectedExam && !selectedCategory && currentExam && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Select Category</h2>
                  <p className="text-muted-foreground">Choose a category from {selectedExam}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentExam.categories.map((category) => (
                <Card 
                  key={category.name} 
                  className="cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50"
                  onClick={() => handleCategorySelect(category)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                        <img 
                          src={category.icon} 
                          alt={category.name}
                          className="h-6 w-6"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <FileText className="h-6 w-6 text-muted-foreground hidden" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{category.type}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Child Nodes Display */}
        {selectedCategory && (
          <div>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground mb-2">Study Materials</h2>
                  <p className="text-muted-foreground">
                    {searchQuery ? `Search results for "${searchQuery}"` : `Materials in ${selectedCategory}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToHome}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {childNodesLoading ? (
              renderNodeSkeleton()
            ) : filteredChildNodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChildNodes.map((node) => (
                  <Card 
                    key={node.deeplink} 
                    className="cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50"
                    onClick={() => handleNodeClick(node)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                          {hasPdf(node) ? (
                            <FileText className="h-5 w-5 text-primary" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{node.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-muted-foreground capitalize">{node.type}</span>
                            {hasPdf(node) && (
                              <Badge variant="secondary" className="text-xs">
                                PDF
                              </Badge>
                            )}
                          </div>
                        </div>
                        {hasPdf(node) ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            onClick={(e) => handleDownloadPdf(node, e)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4 text-primary" />
                          </Button>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No materials found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'No materials available in this category'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfBank;
