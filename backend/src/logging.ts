import { SeverityNumber, logs } from '@opentelemetry/api-logs';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// Configure the OTLP logs exporter to send to the collector
const logExporter = new OTLPLogExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT 
    ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`
    : 'http://otel-collector:4318/v1/logs',
  headers: {},
});

// Define resource attributes (same as tracing)
const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: 'demo-backend',
  [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  'service.environment': 'demo',
  'deployment.environment': 'demo',
});

// Create and configure the logger provider
const loggerProvider = new LoggerProvider({ resource });

// Add a batch processor to export logs
loggerProvider.addLogRecordProcessor(
  new BatchLogRecordProcessor(logExporter, {
    maxQueueSize: 1000,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
  })
);

// Register the logger provider globally
logs.setGlobalLoggerProvider(loggerProvider);

// Get a logger instance for the application to use
const logger = loggerProvider.getLogger('demo-backend', '1.0.0');

console.log('✅ OpenTelemetry logging initialized');

// Gracefully shut down the logger provider on process exit
process.on('SIGTERM', () => {
  loggerProvider
    .shutdown()
    .then(() => console.log('✅ OpenTelemetry logging shut down successfully'))
    .catch((error) => console.error('❌ Error shutting down OpenTelemetry logging', error));
});

// Export a simple logging helper
export { logger, SeverityNumber };

// Helper function for easier logging
export const log = {
  info: (message: string, attributes?: Record<string, any>) => {
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: 'INFO',
      body: message,
      attributes: attributes || {},
    });
  },
  warn: (message: string, attributes?: Record<string, any>) => {
    logger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: 'WARN',
      body: message,
      attributes: attributes || {},
    });
  },
  error: (message: string, attributes?: Record<string, any>) => {
    logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: 'ERROR',
      body: message,
      attributes: attributes || {},
    });
  },
};

