import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Activity, Eye, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface ObservabilityStatus {
  message: string;
  configuration: {
    enabled: boolean;
    endpoint: string;
    hasApiKey: boolean;
    serviceName: string;
  };
  features: string[];
  integrationStatus: string;
  timestamp: string;
}

export default function Observability() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [demoRunning, setDemoRunning] = useState(false);

  // Fetch observability status
  const { data: status, isLoading } = useQuery<ObservabilityStatus>({
    queryKey: ['/api/observability/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Demo mutation
  const demoMutation = useMutation({
    mutationFn: () => fetch('/api/observability/demo', { method: 'POST' }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: 'Phoenix Demo Completed',
        description: 'Observability traces have been generated successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/observability/status'] });
    },
    onError: () => {
      toast({
        title: 'Demo Failed',
        description: 'Could not run observability demo',
        variant: 'destructive'
      });
    }
  });

  const runDemo = async () => {
    setDemoRunning(true);
    try {
      await demoMutation.mutateAsync();
    } finally {
      setDemoRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Observability & Analytics</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading observability status...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Phoenix OpenTelemetry Integration</h1>
      </div>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Arize Phoenix Integration Status
          </CardTitle>
          <CardDescription>
            Enterprise-grade observability for OriginLedger supply chain operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Integration Status:</span>
            <Badge variant={status?.configuration.enabled ? "default" : "secondary"}>
              {status?.integrationStatus || 'Unknown'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Phoenix Endpoint:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {status?.configuration.endpoint || 'Not configured'}
            </code>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">API Key Configured:</span>
            {status?.configuration.hasApiKey ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Service Name:</span>
            <Badge variant="outline">{status?.configuration.serviceName}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Observability Features */}
      <Card>
        <CardHeader>
          <CardTitle>Available Observability Features</CardTitle>
          <CardDescription>
            Supply chain monitoring capabilities with Arize Phoenix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {status?.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Setup</CardTitle>
          <CardDescription>
            Configure Phoenix endpoints to start monitoring supply chain operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Environment Variables Required:</h4>
            <div className="space-y-1 text-sm">
              <div className="bg-muted p-2 rounded font-mono">
                PHOENIX_OTEL_ENDPOINT=http://localhost:6006/v1/traces
              </div>
              <div className="bg-muted p-2 rounded font-mono">
                PHOENIX_API_KEY=your_phoenix_api_key_here
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">For Phoenix Cloud Integration:</h4>
            <div className="space-y-1 text-sm">
              <div className="bg-muted p-2 rounded font-mono">
                PHOENIX_OTEL_ENDPOINT=https://app.phoenix.arize.com/v1/traces
              </div>
              <div className="bg-muted p-2 rounded font-mono">
                PHOENIX_API_KEY=your_cloud_api_key
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test Phoenix Integration</CardTitle>
          <CardDescription>
            Generate sample traces to verify observability functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Run a demonstration that generates OpenTelemetry traces for:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Blockchain validation monitoring</li>
            <li>• Supply chain event correlation</li>
            <li>• Asset tracking telemetry</li>
            <li>• API performance metrics</li>
          </ul>

          <Button 
            onClick={runDemo}
            disabled={demoRunning || demoMutation.isPending}
            className="w-full"
            data-testid="button-run-demo"
          >
            {demoRunning || demoMutation.isPending ? 'Running Demo...' : 'Run Phoenix Demo'}
          </Button>

          {demoMutation.data && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">Demo Results:</h5>
              <pre className="text-xs text-green-700 whitespace-pre-wrap">
                {JSON.stringify(demoMutation.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partnership Information */}
      <Card>
        <CardHeader>
          <CardTitle>Arize AI Partnership</CardTitle>
          <CardDescription>
            Enterprise observability integration for supply chain blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            OriginLedger integrates with Arize Phoenix to provide enterprise-grade observability 
            for blockchain supply chain operations. This integration enables:
          </p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Real-time fraud detection and anomaly alerts</li>
            <li>• Regulatory compliance automation</li>
            <li>• Predictive analytics for supply chain optimization</li>
            <li>• Cross-participant performance monitoring</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Ready for Production:</strong> This integration demonstrates OriginLedger's 
              enterprise readiness and compatibility with leading AI observability platforms.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Last updated: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Unknown'}
      </div>
    </div>
  );
}