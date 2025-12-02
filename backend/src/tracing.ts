import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Configure the OTLP trace exporter to send to the collector
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT 
    ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
    : 'http://otel-collector:4318/v1/traces',
  headers: {},
});

// Define resource attributes to identify this service
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: 'demo-backend',
  [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  'service.environment': 'demo',
  'deployment.environment': 'demo',
});

// Initialize the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable all auto-instrumentations
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Disable fs instrumentation to reduce noise
      },
    }),
  ],
});

// Start the SDK
sdk.start();
console.log('✅ OpenTelemetry tracing initialized');

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('✅ OpenTelemetry SDK shut down successfully'))
    .catch((error) => console.error('❌ Error shutting down OpenTelemetry SDK', error))
    .finally(() => process.exit(0));
});

export default sdk;

