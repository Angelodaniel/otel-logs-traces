import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

// Configure the OTLP trace exporter
// In production, this should point to your collector's public endpoint
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
  headers: {},
});

// Define resource attributes to identify this service
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: 'demo-frontend',
  [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  'service.environment': 'demo',
  'deployment.environment': 'demo',
});

// Create and configure the tracer provider
const provider = new WebTracerProvider({
  resource,
});

// Use SimpleSpanProcessor for demo (for production, use BatchSpanProcessor)
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

// Register the provider globally
provider.register();

// Register instrumentations for automatic tracing
registerInstrumentations({
  instrumentations: [
    // Instrument page load events
    new DocumentLoadInstrumentation(),
    
    // Instrument fetch API calls
    new FetchInstrumentation({
      // Propagate trace context to these URLs
      propagateTraceHeaderCorsUrls: [
        /localhost:4000/,  // Node.js Backend
        /http:\/\/backend:4000/, // Docker Node.js backend
        /localhost:5001/,  // Rails Backend
        /http:\/\/rails-backend:5001/, // Docker Rails backend
      ],
      // Clear timing resources (reduces memory usage)
      clearTimingResources: true,
      // Add additional attributes to fetch spans
      applyCustomAttributesOnSpan: (span, request) => {
        // Add custom attributes based on the request
        if (request instanceof Request) {
          span.setAttribute('http.url', request.url);
          span.setAttribute('http.method', request.method);
        }
      },
    }),
  ],
});

console.log('✅ OpenTelemetry instrumentation initialized');

export default provider;

