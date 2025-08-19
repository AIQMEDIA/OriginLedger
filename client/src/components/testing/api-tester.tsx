import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Play } from "lucide-react";

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  responseTime: number;
  response: any;
  error?: string;
}

const TEST_CASES = [
  {
    name: "Health Check",
    method: "GET",
    endpoint: "/api/health",
    expectedStatus: 200,
    description: "Verify system health and status"
  },
  {
    name: "Chain Validation",
    method: "GET", 
    endpoint: "/api/chain/validate",
    expectedStatus: 200,
    description: "Validate blockchain integrity"
  },
  {
    name: "Get Assets (Paginated)",
    method: "GET",
    endpoint: "/api/assets?limit=5&page=1",
    expectedStatus: 200,
    description: "Test asset retrieval with pagination"
  },
  {
    name: "Get Blockchain (Paginated)",
    method: "GET",
    endpoint: "/api/chain?limit=5&page=1", 
    expectedStatus: 200,
    description: "Test blockchain retrieval with pagination"
  },
  {
    name: "Get Audit Log",
    method: "GET",
    endpoint: "/api/audit-log",
    expectedStatus: 200,
    description: "Test audit log generation"
  },
  {
    name: "Register New User",
    method: "POST",
    endpoint: "/api/register",
    body: {
      user: `TestUser${Date.now()}`,
      role: "manufacturer", 
      email: "test@example.com",
      password: "testpass123"
    },
    expectedStatus: 201,
    description: "Test participant registration"
  }
];

export default function ApiTester() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customMethod, setCustomMethod] = useState("GET");
  const [customBody, setCustomBody] = useState("");

  const runTest = async (testCase: typeof TEST_CASES[0]) => {
    const startTime = performance.now();
    
    try {
      const options: RequestInit = {
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (testCase.body) {
        options.body = JSON.stringify(testCase.body);
      }

      const response = await fetch(testCase.endpoint, options);
      const responseData = await response.json();
      const endTime = performance.now();

      const result: TestResult = {
        endpoint: testCase.endpoint,
        method: testCase.method,
        status: response.status,
        success: response.status === testCase.expectedStatus,
        responseTime: Math.round(endTime - startTime),
        response: responseData
      };

      return result;
    } catch (error) {
      const endTime = performance.now();
      return {
        endpoint: testCase.endpoint,
        method: testCase.method,
        status: 0,
        success: false,
        responseTime: Math.round(endTime - startTime),
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    const testResults: TestResult[] = [];
    
    for (const testCase of TEST_CASES) {
      const result = await runTest(testCase);
      testResults.push(result);
      setResults([...testResults]); // Update UI incrementally
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const runCustomTest = async () => {
    if (!customEndpoint) return;

    const testCase = {
      name: "Custom Test",
      method: customMethod as "GET" | "POST",
      endpoint: customEndpoint,
      body: customBody ? JSON.parse(customBody) : undefined,
      expectedStatus: 200,
      description: "Custom API test"
    };

    const result = await runTest(testCase);
    setResults(prev => [...prev, result]);
  };

  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary dark:text-white">
            API Testing Suite
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Test all API endpoints for functionality and performance
          </p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          data-testid="button-run-all-tests"
          className="flex items-center gap-2"
        >
          {isRunning ? <Clock className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">
                {successCount}/{results.length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tests Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">
                {avgResponseTime}ms
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-500">
                {results.filter(r => r.responseTime < 100).length}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sub-100ms</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Custom Test */}
      <Card>
        <CardHeader>
          <CardTitle>Custom API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="custom-method">Method</Label>
              <Select value={customMethod} onValueChange={setCustomMethod}>
                <SelectTrigger data-testid="select-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-endpoint">Endpoint</Label>
              <Input
                id="custom-endpoint"
                placeholder="/api/custom-endpoint"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                data-testid="input-custom-endpoint"
              />
            </div>
          </div>
          {(customMethod === "POST" || customMethod === "PUT") && (
            <div className="space-y-2">
              <Label htmlFor="custom-body">Request Body (JSON)</Label>
              <Textarea
                id="custom-body"
                placeholder='{"key": "value"}'
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="font-mono text-sm"
                data-testid="textarea-custom-body"
              />
            </div>
          )}
          <Button 
            onClick={runCustomTest} 
            disabled={!customEndpoint}
            data-testid="button-run-custom-test"
          >
            Run Custom Test
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} data-testid={`test-result-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <Badge variant="outline" className="mr-2">
                      {result.method}
                    </Badge>
                    <span className="font-mono text-sm">{result.endpoint}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={result.success ? "default" : "destructive"}
                    data-testid={`status-${result.status}`}
                  >
                    {result.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {result.responseTime}ms
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.error ? (
                <div className="text-red-600 dark:text-red-400 text-sm font-mono">
                  Error: {result.error}
                </div>
              ) : (
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-32">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}