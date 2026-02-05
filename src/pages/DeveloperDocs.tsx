import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, FileText, Database, Shield, Network, Key, Book, Github, ExternalLink } from "lucide-react";

const DeveloperDocs = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const apiEndpoints = [
    {
      method: "POST",
      endpoint: "/api/v1/auth/send-otp",
      description: "Send OTP to mobile number",
      headers: ["Content-Type: application/json", "randomid: {UUID}", "client-id: {CLIENT_ID}"],
      body: {
        username: "string",
        countryCode: "+91",
        organizationId: "string"
      }
    },
    {
      method: "POST", 
      endpoint: "/api/v1/auth/verify-otp",
      description: "Verify OTP and get access token",
      headers: ["Content-Type: application/json", "randomid: {UUID}", "client-id: {CLIENT_ID}"],
      body: {
        username: "string",
        otp: "string",
        client_id: "system-admin",
        client_secret: "string",
        grant_type: "password",
        organizationId: "string"
      }
    },
    {
      method: "POST",
      endpoint: "/api/v1/auth/verify-token", 
      description: "Verify JWT token validity",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"],
      body: {
        randomId: "string",
        organizationId: "string"
      }
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/details",
      description: "Get batch details including subjects, schedule, and metadata",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}",
      description: "Get complete batch information with enrolled status",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/announcements",
      description: "Get batch announcements and updates",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/schedule",
      description: "Get subject schedule and topics",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/schedule/{scheduleId}",
      description: "Get detailed schedule information for specific topic",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/schedule/{scheduleId}/slides",
      description: "Get presentation slides for topic",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}", "client-version: 200"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/users/profile",
      description: "Get user profile and enrolled batches",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/topics/{topicId}",
      description: "Get topic details with video and content information",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/topics/{topicId}/content",
      description: "Get topic content including videos, PDFs, and attachments",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/topics/{topicId}/videos",
      description: "Get video streaming URLs and metadata",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/topics/{topicId}/practice",
      description: "Get Daily Practice Problems (DPP) for topic",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/subjects/{subjectId}/topics/{topicId}/notes",
      description: "Get study notes for topic",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/community/channels",
      description: "Get community channels and forums",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/community/posts/{postId}/comments",
      description: "Get community post comments",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "POST",
      endpoint: "/api/v1/community/comments",
      description: "Post comment on community post",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"],
      body: {
        postId: "string",
        content: "string",
        type: "COMMUNITY"
      }
    },
    {
      method: "GET",
      endpoint: "/api/v1/study/materials",
      description: "Get PDF bank and study materials",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}", "x-sdk-version: 0.0.12"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/schedule/today",
      description: "Get today's schedule for batch",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/schedule/weekly",
      description: "Get weekly planner and schedule",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/classes/live",
      description: "Get live class schedule and join links",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/classes/recorded",
      description: "Get recorded classes and videos",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/assignments",
      description: "Get assignments and submissions",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/assessments",
      description: "Get tests and assessments",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/doubts",
      description: "Get doubt clearing sessions and Q&A",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/progress",
      description: "Get learning progress and analytics",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    },
    {
      method: "GET",
      endpoint: "/api/v1/batches/{batchId}/certificates",
      description: "Get completion certificates",
      headers: ["Authorization: Bearer {token}", "randomid: {UUID}"]
    }
  ];

  const authConfig = {
    CLIENT_ID: "demo-client-id-12345",
    ORG_ID: "demo-org-id-67890"
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Book className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground dark:text-white mb-4">
              Developer Documentation
            </h1>
            <p className="text-lg text-muted-foreground dark:text-gray-400">
              Complete API documentation and integration guide for Pie Wallah
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="api">API Reference</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Project Overview
                  </CardTitle>
                  <CardDescription>
                    Demo Learning Platform is a comprehensive educational platform built with React and TypeScript
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Tech Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">React</Badge>
                      <Badge variant="secondary">TypeScript</Badge>
                      <Badge variant="secondary">Tailwind CSS</Badge>
                      <Badge variant="secondary">React Query</Badge>
                      <Badge variant="secondary">React Router</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Features</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>JWT-based authentication with automatic token refresh</li>
                      <li>Offline support with intelligent network detection</li>
                      <li>Progressive Web App capabilities with install prompts</li>
                      <li>Adaptive video streaming and comprehensive PDF library</li>
                      <li>Interactive community features with discussion forums</li>
                      <li>Real-time collaboration tools and live chat support</li>
                      <li>Advanced analytics and progress tracking system</li>
                      <li>Multi-language support and accessibility features</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Authentication Tab */}
            <TabsContent value="authentication" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Authentication Flow
                  </CardTitle>
                  <CardDescription>
                    JWT-based authentication with intelligent token refresh and secure session management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Authentication Steps</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Initiate OTP delivery to user's registered mobile device</li>
                      <li>Validate OTP and generate secure access tokens</li>
                      <li>Implement dual storage strategy (localStorage + sessionStorage)</li>
                      <li>Attach bearer tokens to all authenticated API requests</li>
                      <li>Execute proactive token refresh before expiration</li>
                      <li>Handle offline scenarios with cached authentication state</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Token Storage</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">
                        localStorage: demo_auth_token, demo_refresh_token, demo_token_expires_at, demo_user_data<br/>
                        sessionStorage: demo_auth_token, demo_refresh_token, demo_token_expires_at, demo_user_data
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm overflow-x-auto">
{`const AUTH_CONFIG = {
  CLIENT_ID: "${authConfig.CLIENT_ID}",
  ORG_ID: "${authConfig.ORG_ID}"
};`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Reference Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    API Endpoints
                  </CardTitle>
                  <CardDescription>
                    Complete list of available API endpoints for demo platform integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {apiEndpoints.map((endpoint, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={endpoint.method === 'GET' ? 'default' : 'secondary'}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.endpoint}</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{endpoint.description}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <h5 className="text-sm font-semibold">Headers:</h5>
                          <div className="bg-muted p-2 rounded text-xs font-mono">
                            {endpoint.headers.join('\n')}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-semibold">Body:</h5>
                          <div className="bg-muted p-2 rounded text-xs font-mono">
                            {JSON.stringify(endpoint.body, null, 2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Random ID Generation
                  </CardTitle>
                  <CardDescription>
                    All API requests require unique random identifiers for security and tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm">
{`// Generate random UUID
const generateRandomId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Or use built-in
const randomId = crypto.randomUUID();`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Examples
                  </CardTitle>
                  <CardDescription>
                    Practical implementation examples for common demo platform operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Login with OTP</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-sm overflow-x-auto">
{`// Send OTP
const sendOtp = async (mobileNumber) => {
  const response = await fetch(\`\${AUTH_CONFIG.BASE_URL_V1}/users/get-otp\`, {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify({
      username: mobileNumber,
      countryCode: '+91',
      organizationId: AUTH_CONFIG.ORG_ID
    })
  });
  return response.json();
};

// Verify OTP
const verifyOtp = async (mobileNumber, otp) => {
  const response = await fetch(\`\${AUTH_CONFIG.BASE_URL_V3}/oauth/token\`, {
    method: 'POST',
    headers: getCommonHeaders(),
    body: JSON.stringify({
      username: mobileNumber,
      otp: otp,
      client_id: 'system-admin',
      client_secret: AUTH_CONFIG.CLIENT_SECRET,
      grant_type: 'password',
      organizationId: AUTH_CONFIG.ORG_ID
    })
  });
  return response.json();
};`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Making Authenticated Requests</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-sm overflow-x-auto">
{`// Get user profile
const getUserProfile = async (token) => {
  const response = await fetch(\`\${AUTH_CONFIG.BASE_URL_V3}/users\`, {
    method: 'GET',
    headers: {
      ...getCommonHeaders(),
      'authorization': \`Bearer \${token}\`
    }
  });
  return response.json();
};`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Important Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Always use unique random IDs for each API request</li>
                    <li>Tokens have a 5-minute buffer before expiration</li>
                    <li>Store tokens in both localStorage and sessionStorage</li>
                    <li>Handle network errors gracefully with offline support</li>
                    <li>Use the provided auth utilities for consistency</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t text-center">
            <div className="flex justify-center gap-4 mb-4">
              <Button variant="outline" size="sm" asChild>
                <a href="https://t.me/satyamrojha" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Telegram
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Pie Wallah. Built with ❤️ for developers. For more info: https://t.me/satyamrojha
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDocs;
