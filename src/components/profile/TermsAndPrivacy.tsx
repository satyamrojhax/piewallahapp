import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, ArrowLeft, ExternalLink } from 'lucide-react';
import { getCommonHeaders } from '@/lib/auth';
import { toast } from 'sonner';
import DotsLoader from '@/components/ui/DotsLoader';

interface TermsData {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  organizationId: string;
  status: string;
  displayOrder: number;
  categoryId: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  statusCode: number;
  data: TermsData[];
  success: boolean;
  dataFrom: string;
}

const TermsAndPrivacy = ({ onBack }: { onBack: () => void }) => {
  const [termsData, setTermsData] = useState<TermsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTermsAndPrivacy = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          'https://api.penpencil.co/v1/organizations/5eb393ee95fab7468a79d189/terms-and-conditions',
          {
            method: 'GET',
            headers: {
              ...getCommonHeaders(),
              'client-id': '5eb393ee95fab7468a79d189',
              'client-type': 'WEB',
              'randomid': crypto.randomUUID(),
              'x-sdk-version': '0.0.12',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch terms and conditions: ${response.status}`);
        }

        const result: ApiResponse = await response.json();
        
        if (result.success && result.data) {
          setTermsData(result.data);
        } else {
          throw new Error('No data received from server');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load terms and conditions');
        toast.error('Failed to load terms and conditions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTermsAndPrivacy();
  }, []);

  const renderHTMLContent = (htmlContent: string) => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Extract text content and preserve some basic formatting
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Convert to bullet points by splitting on common delimiters
    const bulletPoints = textContent
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      // Split into sentences and create bullet points
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 10) // Filter out very short fragments
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
    
    return bulletPoints;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-6">
                <DotsLoader size="lg" color="rgb(59, 130, 246)" />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-foreground">Loading Terms & Privacy</h1>
              <p className="mb-6 text-muted-foreground">
                Please wait...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-foreground">Error Loading Terms</h1>
              <p className="mb-6 text-muted-foreground">
                {error}
              </p>
              <Button onClick={() => window.location.reload()} className="bg-gradient-primary hover:opacity-90">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Legal Information
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms & Privacy</h1>
          <p className="text-muted-foreground">
            Read our terms of service and privacy policy
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-6">
          {termsData.map((term) => (
            <Card key={term._id} className="overflow-hidden shadow-card">
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-1">
                        {term.title}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={term.status === 'Active' ? 'default' : 'secondary'}>
                          {term.status}
                        </Badge>
                        <span>•</span>
                        <span>Last updated: {new Date(term.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {term.videoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(term.videoUrl, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Watch Video
                    </Button>
                  )}
                </div>

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="bg-muted/50 rounded-lg p-6">
                    <ul className="space-y-3">
                      {renderHTMLContent(term.description).map((point, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        {termsData.length === 0 && (
          <Card className="p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Terms Available
            </h3>
            <p className="text-muted-foreground">
              Terms and conditions are not available at the moment. Please check back later.
            </p>
          </Card>
        )}

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            If you have any questions about our terms and privacy policy, please contact us
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => window.open('https://www.physicswallah.live/', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('mailto:support@pw.live')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Email Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndPrivacy;
