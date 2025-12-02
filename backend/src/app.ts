import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { log } from './logging';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Get the tracer for manual instrumentation
const tracer = trace.getTracer('demo-backend', '1.0.0');

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'demo-backend' });
});

// Slow endpoint - demonstrates distributed tracing with logs
app.get('/api/slow', async (req: Request, res: Response) => {
  // Create a custom span for this operation
  const span = tracer.startSpan('slow-operation');
  
  try {
    // Log the start of the operation
    log.info('Starting slow operation', {
      'endpoint': '/api/slow',
      'operation': 'slow-operation',
    });

    // Simulate a slow operation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add span attributes
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.route', '/api/slow');
    span.setAttribute('demo.sleep_duration_ms', 1000);

    // Log completion
    log.info('Slow operation completed successfully', {
      'endpoint': '/api/slow',
      'duration_ms': 1000,
    });

    span.setStatus({ code: SpanStatusCode.OK });
    res.json({ 
      message: 'slow response',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    span.recordException(error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    throw error;
  } finally {
    span.end();
  }
});

// Error endpoint - demonstrates error handling and error logs
app.get('/api/error', (req: Request, res: Response) => {
  // Get the active span from auto-instrumentation
  const span = trace.getActiveSpan();
  
  if (span) {
    span.setAttribute('http.route', '/api/error');
    span.setAttribute('demo.will_error', true);
  }

  // Log an error-level message
  log.error('Intentional error triggered', {
    'endpoint': '/api/error',
    'error.type': 'demo_error',
    'user_triggered': true,
  });

  // Create and throw an error
  const error = new Error('This is a demo error to test error tracking');
  
  if (span) {
    span.recordException(error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }

  // Send error response
  res.status(500).json({
    error: error.message,
    timestamp: new Date().toISOString(),
  });
});

// Data endpoint - demonstrates successful API call with structured data
app.get('/api/data', async (req: Request, res: Response) => {
  const span = tracer.startSpan('fetch-data');
  
  try {
    log.info('Fetching demo data', {
      'endpoint': '/api/data',
    });

    // Simulate data fetching
    await new Promise(resolve => setTimeout(resolve, 200));

    const data = {
      items: [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 300 },
      ],
      total: 3,
      timestamp: new Date().toISOString(),
    };

    span.setAttribute('data.item_count', data.total);
    span.setStatus({ code: SpanStatusCode.OK });

    log.info('Data fetched successfully', {
      'endpoint': '/api/data',
      'item_count': data.total,
    });

    res.json(data);
  } catch (error: any) {
    span.recordException(error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    log.error('Error fetching data', {
      'endpoint': '/api/data',
      'error.message': error.message,
    });
    res.status(500).json({ error: 'Failed to fetch data' });
  } finally {
    span.end();
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  log.warn('Route not found', {
    'http.method': req.method,
    'http.url': req.url,
  });
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log.error('Unhandled error', {
    'error.message': err.message,
    'error.stack': err.stack,
    'http.method': req.method,
    'http.url': req.url,
  });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

