import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// Phoenix endpoint configuration - supports both local and cloud deployments
const PHOENIX_OTEL_ENDPOINT = process.env.PHOENIX_OTEL_ENDPOINT || 'http://localhost:6006/v1/traces';
const PHOENIX_API_KEY = process.env.PHOENIX_API_KEY;

// Configure OTLP exporter with optional authentication
const exporterConfig: any = {
  url: PHOENIX_OTEL_ENDPOINT,
};

// Add authentication headers if API key is provided
if (PHOENIX_API_KEY) {
  exporterConfig.headers = {
    'Authorization': `Bearer ${PHOENIX_API_KEY}`,
    'api_key': PHOENIX_API_KEY
  };
}

const otlpExporter = new OTLPTraceExporter(exporterConfig);

const otelSDK = new NodeSDK({
  traceExporter: otlpExporter,
  serviceName: 'OriginLedger-SupplyChain',
});

// Initialize OpenTelemetry SDK
let isInitialized = false;

export function initializePhoenixTelemetry() {
  if (!isInitialized) {
    otelSDK.start();
    isInitialized = true;
    console.log('🔍 Phoenix OpenTelemetry initialized for OriginLedger');
  }
}

// Helper function to trace supply chain events with Phoenix observability
export async function traceSupplyChainEvent<T>(
  eventName: string,
  attributes: Record<string, unknown>,
  action: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer('originledger-tracer');
  return tracer.startActiveSpan(eventName, { 
    attributes: {
      ...attributes,
      service: 'OriginLedger',
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development'
    }
  }, async (span) => {
    try {
      const result = await action();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.setAttribute('error', true);
      span.setAttribute('error.message', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      span.end();
    }
  });
}

// Specialized tracing functions for different OriginLedger operations

export async function traceBlockchainOperation<T>(
  operation: string,
  blockData: any,
  action: () => Promise<T>
): Promise<T> {
  return traceSupplyChainEvent(
    `Blockchain.${operation}`,
    {
      operation,
      blockIndex: blockData.index,
      blockHash: blockData.hash,
      participantId: blockData.data?.user,
      assetId: blockData.data?.asset_id,
      action: blockData.data?.action
    },
    action
  );
}

export async function traceAssetOperation<T>(
  operation: string,
  assetData: any,
  action: () => Promise<T>,
  participantId?: string
): Promise<T> {
  return traceSupplyChainEvent(
    `Asset.${operation}`,
    {
      operation,
      assetId: assetData.assetId || assetData.id,
      assetName: assetData.name,
      category: assetData.category,
      currentStatus: assetData.currentStatus,
      currentLocation: assetData.currentLocation,
      batch: assetData.batch,
      participantId
    },
    action
  );
}

export async function traceParticipantOperation<T>(
  operation: string,
  participantData: any,
  action: () => Promise<T>
): Promise<T> {
  return traceSupplyChainEvent(
    `Participant.${operation}`,
    {
      operation,
      participantId: participantData.id,
      username: participantData.username,
      role: participantData.role,
      status: participantData.status
    },
    action
  );
}

export async function traceAPIOperation<T>(
  endpoint: string,
  method: string,
  action: () => Promise<T>,
  userId?: string,
  userRole?: string
): Promise<T> {
  return traceSupplyChainEvent(
    `API.${method}.${endpoint.replace(/\//g, '.')}`,
    {
      endpoint,
      method,
      userId,
      userRole,
      requestTime: new Date().toISOString()
    },
    action
  );
}

export async function traceSubscriptionOperation<T>(
  operation: string,
  subscriptionData: any,
  action: () => Promise<T>
): Promise<T> {
  return traceSupplyChainEvent(
    `Subscription.${operation}`,
    {
      operation,
      subscriptionId: subscriptionData.id,
      organizationId: subscriptionData.organizationId,
      planId: subscriptionData.planId,
      status: subscriptionData.status,
      userCount: subscriptionData.userCount,
      assetCount: subscriptionData.assetCount
    },
    action
  );
}

// Blockchain validation tracing
export async function traceChainValidation<T>(
  chainLength: number,
  action: () => Promise<T>
): Promise<T> {
  return traceSupplyChainEvent(
    'Blockchain.Validation',
    {
      operation: 'validate_chain',
      chainLength,
      validationType: 'integrity_check'
    },
    action
  );
}

// Graceful shutdown
export function shutdownPhoenixTelemetry(): Promise<void> {
  if (isInitialized) {
    return otelSDK.shutdown()
      .then(() => {
        console.log('🔍 Phoenix telemetry shut down gracefully');
        isInitialized = false;
      })
      .catch((error) => {
        console.error('Error shutting down Phoenix telemetry:', error);
      });
  }
  return Promise.resolve();
}

// Process event handlers
process.on('SIGTERM', () => {
  shutdownPhoenixTelemetry()
    .finally(() => process.exit(0));
});

process.on('SIGINT', () => {
  shutdownPhoenixTelemetry()
    .finally(() => process.exit(0));
});