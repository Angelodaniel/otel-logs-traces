import { useState } from 'react';
import { trace } from '@opentelemetry/api';

// Get backend URL from environment or use default
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function App() {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Get tracer for manual instrumentation
  const tracer = trace.getTracer('demo-frontend', '1.0.0');

  const makeRequest = async (endpoint: string, expectError = false) => {
    setLoading(true);
    setError('');
    setResponse('');

    // Create a custom span for this user action
    const span = tracer.startSpan(`user-action: ${endpoint}`);
    span.setAttribute('user.action', endpoint);

    try {
      console.log(`Making request to: ${BACKEND_URL}${endpoint}`);
      
      // The fetch will be automatically instrumented and will propagate trace context
      const res = await fetch(`${BACKEND_URL}${endpoint}`);
      const data = await res.json();

      if (!res.ok && !expectError) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      span.setAttribute('http.status_code', res.status);
      setResponse(JSON.stringify(data, null, 2));
      
      console.log('Response received:', data);
    } catch (err: any) {
      console.error('Request failed:', err);
      span.recordException(err);
      setError(err.message);
    } finally {
      span.end();
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔭 OpenTelemetry Demo</h1>
        <p style={styles.subtitle}>
          Frontend → OTEL Collector → Sentry
        </p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Test Endpoints</h2>
          <p style={styles.description}>
            Click the buttons below to send requests to the backend.
            Each request will generate traces that flow through the OpenTelemetry Collector to Sentry.
          </p>

          <div style={styles.buttonGroup}>
            <button
              style={styles.button}
              onClick={() => makeRequest('/health')}
              disabled={loading}
            >
              🏥 Health Check
            </button>

            <button
              style={styles.button}
              onClick={() => makeRequest('/api/data')}
              disabled={loading}
            >
              📊 Fetch Data
            </button>

            <button
              style={{ ...styles.button, ...styles.buttonWarning }}
              onClick={() => makeRequest('/api/slow')}
              disabled={loading}
            >
              🐌 Slow Request (1s)
            </button>

            <button
              style={{ ...styles.button, ...styles.buttonDanger }}
              onClick={() => makeRequest('/api/error', true)}
              disabled={loading}
            >
              💥 Trigger Error
            </button>
          </div>
        </div>

        {loading && (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p>Loading...</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <h3 style={styles.errorTitle}>❌ Error</h3>
            <pre style={styles.pre}>{error}</pre>
          </div>
        )}

        {response && (
          <div style={styles.responseBox}>
            <h3 style={styles.responseTitle}>✅ Response</h3>
            <pre style={styles.pre}>{response}</pre>
          </div>
        )}

        <div style={styles.info}>
          <h3 style={styles.infoTitle}>ℹ️ What's Happening?</h3>
          <ul style={styles.list}>
            <li>Frontend generates OTEL traces for page load and fetch calls</li>
            <li>Trace context is propagated to backend via W3C Trace Context headers</li>
            <li>Backend receives requests and creates child spans + logs</li>
            <li>All telemetry flows to the OTEL Collector via OTLP/HTTP</li>
            <li>Collector exports everything to Sentry</li>
            <li>View correlated traces and logs in Sentry UI</li>
          </ul>
        </div>

        <div style={styles.footer}>
          <p>Backend: <code>{BACKEND_URL}</code></p>
          <p>Collector: <code>http://localhost:4318</code></p>
        </div>
      </div>
    </div>
  );
}

// Inline styles for simplicity
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: '2.5rem',
    margin: '0 0 0.5rem 0',
    color: '#2d3748',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#718096',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#2d3748',
    marginBottom: '0.5rem',
  },
  description: {
    color: '#4a5568',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  button: {
    padding: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: '#4299e1',
    color: 'white',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  buttonWarning: {
    background: '#ed8936',
  },
  buttonDanger: {
    background: '#f56565',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#4a5568',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #4299e1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem',
  },
  errorBox: {
    background: '#fff5f5',
    border: '2px solid #fc8181',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
  },
  errorTitle: {
    color: '#c53030',
    margin: '0 0 0.5rem 0',
  },
  responseBox: {
    background: '#f0fff4',
    border: '2px solid #68d391',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
  },
  responseTitle: {
    color: '#2f855a',
    margin: '0 0 0.5rem 0',
  },
  pre: {
    background: '#2d3748',
    color: '#e2e8f0',
    padding: '1rem',
    borderRadius: '6px',
    overflow: 'auto',
    fontSize: '0.875rem',
    margin: 0,
  },
  info: {
    background: '#ebf8ff',
    border: '2px solid #90cdf4',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '2rem',
  },
  infoTitle: {
    color: '#2c5282',
    margin: '0 0 0.5rem 0',
  },
  list: {
    color: '#2d3748',
    lineHeight: '1.8',
    paddingLeft: '1.5rem',
    margin: 0,
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '2px solid #e2e8f0',
    fontSize: '0.875rem',
    color: '#718096',
    textAlign: 'center',
  },
};

export default App;

