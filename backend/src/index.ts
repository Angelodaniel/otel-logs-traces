// IMPORTANT: Import tracing and logging BEFORE importing the app
// This ensures that auto-instrumentation is registered before any other modules
import './tracing';
import './logging';

import app from './app';

const PORT = process.env.PORT || 4000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend server listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Sending telemetry to: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318'}`);
});

