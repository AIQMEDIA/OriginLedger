import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const apiEndpoints = [
  {
    method: "POST",
    path: "/api/register",
    description: "Register new participant",
    requestBody: {
      user: "string",
      role: "manufacturer|shipper|retailer|other"
    },
    response: {
      msg: "User {user} registered as {role}.",
      participant: { username: "string", role: "string" }
    }
  },
  {
    method: "POST", 
    path: "/api/add-event",
    description: "Add supply chain event",
    requestBody: {
      user: "string",
      action: "string",
      asset_id: "string",
      meta: {
        location: "string",
        timestamp: "string",
        additional_data: "object"
      }
    },
    response: {
      msg: "Event added.",
      block: {
        index: 1,
        timestamp: 1640995200,
        hash: "0x1a2b3c...",
        data: "object"
      }
    }
  },
  {
    method: "GET",
    path: "/api/chain", 
    description: "Get blockchain data",
    response: {
      chain: "array of blocks",
      length: "number",
      is_valid: "boolean"
    }
  },
  {
    method: "GET",
    path: "/api/participants",
    description: "Get all participants",
    response: {
      "techcorp": "manufacturer",
      "globallogistics": "shipper", 
      "retailchain": "retailer"
    }
  },
  {
    method: "GET",
    path: "/api/assets",
    description: "Get all assets",
    response: {
      assets: "array of assets",
      total_count: "number"
    }
  },
  {
    method: "GET",
    path: "/api/dashboard-stats",
    description: "Get dashboard statistics", 
    response: {
      totalAssets: "number",
      totalEvents: "number",
      activeParticipants: "number",
      chainIntegrity: "number"
    }
  }
];

const codeExamples = {
  python: `import requests

# Register a new participant
response = requests.post('http://localhost:8000/api/register', 
    json={'user': 'MyCompany', 'role': 'manufacturer'},
    headers={'Content-Type': 'application/json'})

# Add an event
response = requests.post('http://localhost:8000/api/add-event',
    json={
        'user': 'MyCompany',
        'action': 'manufactured',
        'asset_id': 'PRD-2024-001',
        'meta': {'location': 'Factory A', 'batch': 'BT-001'}
    },
    headers={'Content-Type': 'application/json'})`,
  
  javascript: `const ChainTrackAPI = {
  baseURL: 'http://localhost:8000/api',
  
  async addEvent(eventData) {
    const response = await fetch(\`\${this.baseURL}/add-event\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });
    return await response.json();
  }
};

// Usage
ChainTrackAPI.addEvent({
  user: 'MyCompany',
  action: 'shipped',
  asset_id: 'PRD-2024-001',
  meta: { tracking_id: 'TRK-123', destination: 'Store A' }
});`
};

export default function ApiDocs() {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code example has been copied to your clipboard.",
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'POST':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* API Overview */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            Supply Chain Blockchain API
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            RESTful API for supply chain blockchain operations
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-secondary dark:text-white mb-2">Base URL</h4>
              <code className="block bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded text-sm font-mono">
                http://localhost:8000/api
              </code>
            </div>
            <div>
              <h4 className="font-medium text-secondary dark:text-white mb-2">Content Type</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All requests should use <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded text-xs">application/json</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            API Endpoints
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Available endpoints and their usage
          </p>
        </CardHeader>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {apiEndpoints.map((endpoint, index) => (
            <div key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Badge className={getMethodColor(endpoint.method)}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono text-secondary dark:text-white">
                    {endpoint.path}
                  </code>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {endpoint.description}
                </span>
              </div>
              
              <div className="ml-0 md:ml-16 space-y-4">
                {endpoint.requestBody && (
                  <div>
                    <h5 className="font-medium text-secondary dark:text-white mb-2">Request Body</h5>
                    <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                      {JSON.stringify(endpoint.requestBody, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div>
                  <h5 className="font-medium text-secondary dark:text-white mb-2">Response</h5>
                  <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {JSON.stringify(endpoint.response, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SDK Examples */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            SDK Examples
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Code examples for common operations
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary dark:text-white">Python Example</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(codeExamples.python)}
                  data-testid="button-copy-python"
                >
                  <Copy size={16} className="mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
                {codeExamples.python}
              </pre>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary dark:text-white">JavaScript Example</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(codeExamples.javascript)}
                  data-testid="button-copy-javascript"
                >
                  <Copy size={16} className="mr-2" />
                  Copy
                </Button>
              </div>
              <pre className="bg-gray-900 text-blue-400 rounded-lg p-4 text-sm overflow-x-auto">
                {codeExamples.javascript}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <CardTitle className="text-lg font-semibold text-secondary dark:text-white">
            Error Handling
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Common error responses and status codes
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mb-2">
                  400 Bad Request
                </Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Invalid input data or missing required fields
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 mb-2">
                  403 Forbidden
                </Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unauthorized user or participant not registered
                </p>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 mb-2">
                  404 Not Found
                </Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Requested resource or endpoint does not exist
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-medium text-secondary dark:text-white mb-2">Example Error Response</h5>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
{`{
  "error": "Unauthorized. Please register first.",
  "hint": "Use /api/register endpoint to register as a participant"
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
