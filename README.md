# 🔭 OpenTelemetry → Collector → Sentry Demo

A complete end-to-end demonstration of sending OpenTelemetry traces and logs from a frontend and backend application through an OpenTelemetry Collector to Sentry.

## 📋 Overview

This demo shows the complete telemetry flow:

```
┌─────────────┐         ┌─────────────┐         ┌──────────────────┐         ┌─────────┐
│   Frontend  │────────▶│   Backend   │────────▶│ OTEL Collector   │────────▶│ Sentry  │
│  (React)    │  HTTP   │  (Express)  │  OTLP   │  (Aggregator)    │  OTLP   │  (APM)  │
│   + OTEL    │         │   + OTEL    │         │  (Exporter)      │         │         │
└─────────────┘         └─────────────┘         └──────────────────┘         └─────────┘
      │                                                    ▲
      │                                                    │
      └────────────────────────────────────────────────────┘
                         OTLP (traces)
```

### What This Demo Includes

- ✅ **Frontend tracing**: React SPA with OpenTelemetry browser instrumentation
- ✅ **Backend tracing**: Node.js/Express with automatic HTTP instrumentation
- ✅ **Backend logging**: Structured logs via OpenTelemetry Logs API
- ✅ **Distributed tracing**: W3C Trace Context propagation between frontend and backend
- ✅ **OTLP export**: All telemetry sent via OTLP/HTTP protocol
- ✅ **Collector pipeline**: OpenTelemetry Collector receives, processes, and exports to Sentry
- ✅ **No Sentry SDKs**: Pure OpenTelemetry implementation (vendor-neutral)
- ✅ **Docker Compose**: One command to run everything

## 🏗️ Architecture

### Components

1. **Frontend** (`frontend/`)
   - React 18 + TypeScript + Vite
   - OpenTelemetry browser SDK
   - Automatic instrumentation: document load, fetch API
   - Exports traces to collector via OTLP/HTTP

2. **Backend** (`backend/`)
   - Node.js 20 + Express + TypeScript
   - OpenTelemetry Node.js SDK
   - Automatic instrumentation: HTTP, Express
   - Exports traces and logs to collector via OTLP/HTTP

3. **OpenTelemetry Collector** (`otel-collector/`)
   - Official `otel/opentelemetry-collector` image
   - Receives: OTLP (HTTP on port 4318, gRPC on port 4317)
   - Processes: Batching, resource attributes
   - Exports: Sentry via OTLP/HTTP

### Telemetry Flow

1. **Page Load**: Frontend generates a document load span
2. **User Action**: User clicks a button to call the backend
3. **Frontend Span**: Fetch instrumentation creates a span with trace context
4. **Context Propagation**: W3C headers (`traceparent`, `tracestate`) sent to backend
5. **Backend Span**: Express instrumentation creates a child span linked to frontend trace
6. **Backend Logs**: Structured logs emitted with trace correlation
7. **OTLP Export**: Both apps send telemetry to collector
8. **Collector Processing**: Batches and enriches telemetry
9. **Sentry Export**: Collector sends everything to Sentry via OTLP

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- A Sentry account with a project configured for OpenTelemetry

### Step 1: Configure Sentry

1. Get your Sentry OTLP credentials:
   - Go to **Sentry Project Settings → Client Keys (DSN)**
   - Look for the **"OpenTelemetry (OTLP)"** section
   - Copy your endpoint and authentication header

2. Copy the environment template:
   ```bash
   cp env.example .env
   ```

3. Edit `.env` and add your Sentry configuration:
   ```bash
   SENTRY_OTLP_ENDPOINT=https://o123456.ingest.sentry.io/api/7891011/integration/otlp
   SENTRY_AUTH_HEADER=sentry sentry_key=abc123def456
   ```

   **Finding Your Sentry Credentials:**
   
   - **OTLP Endpoint**: 
     - Format: `https://o[ORG_ID].ingest.sentry.io/api/[PROJECT_ID]/integration/otlp`
     - Don't include `/v1/logs` or `/v1/traces` - the collector adds these automatically
   
   - **Authentication Header**: 
     - Format: `sentry sentry_key=YOUR_PUBLIC_KEY`
     - Extract the public key from your DSN (the part before the `@`)
     - DSN format: `https://PUBLIC_KEY@oORG_ID.ingest.sentry.io/PROJECT_ID`

   **Reference:**
   - [Official Sentry OTLP Collector Guide](https://docs.sentry.io/product/drains/integration/opentelemetry-collector/)

### Step 2: Build and Run

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:4000
- **Collector**: HTTP on port 4318, gRPC on port 4317

### Step 3: Generate Telemetry

1. Open http://localhost:5173 in your browser
2. Click the test buttons:
   - **Health Check**: Simple successful request
   - **Fetch Data**: Successful API call with data
   - **Slow Request**: 1-second delay to see span timing
   - **Trigger Error**: Intentional error to test error tracking

### Step 4: View in Sentry

1. Go to your Sentry project
2. Navigate to **Performance** (or **Traces**) to see distributed traces
3. Look for traces with spans from both:
   - `demo-frontend` service
   - `demo-backend` service
4. Check **Logs** (if available in your Sentry plan) to see correlated backend logs
5. Verify trace IDs match between frontend spans, backend spans, and logs

## 📁 Project Structure

```
otel-sentry-demo/
├── docker-compose.yml              # Orchestrates all services
├── env.example                     # Sentry configuration template
├── README.md                       # This file
│
├── backend/                        # Node.js backend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts               # Entry point (imports tracing first)
│       ├── tracing.ts             # OpenTelemetry tracing setup
│       ├── logging.ts             # OpenTelemetry logging setup
│       └── app.ts                 # Express app with instrumented routes
│
├── frontend/                       # React frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx               # Entry point (initializes OTEL)
│       ├── otel-setup.ts          # OpenTelemetry browser setup
│       └── App.tsx                # UI with API call buttons
│
└── otel-collector/                 # OpenTelemetry Collector
    └── otel-collector-config.yaml # Collector configuration
```

## 🔧 Development

### Running Services Individually

**Backend (local development):**
```bash
cd backend
npm install
npm run dev
```

**Frontend (local development):**
```bash
cd frontend
npm install
npm run dev
```

**Collector (local):**
```bash
docker run -p 4317:4317 -p 4318:4318 \
  -v $(pwd)/otel-collector/otel-collector-config.yaml:/etc/otel-collector-config.yaml \
  -e SENTRY_OTLP_ENDPOINT="your-endpoint" \
  -e SENTRY_AUTH_HEADER="Bearer your-token" \
  otel/opentelemetry-collector:latest \
  --config=/etc/otel-collector-config.yaml
```

### Viewing Collector Logs

```bash
# View collector logs to see telemetry flowing through
docker-compose logs -f otel-collector

# View backend logs
docker-compose logs -f backend

# View all logs
docker-compose logs -f
```

### Debugging Tips

1. **Check collector health**:
   ```bash
   curl http://localhost:13133/
   ```

2. **Verify backend is sending telemetry**:
   - Check backend logs for "✅ OpenTelemetry initialized"
   - Look for OTLP export messages in collector logs

3. **Verify frontend is sending telemetry**:
   - Open browser DevTools → Console
   - Look for "✅ OpenTelemetry instrumentation initialized"
   - Check Network tab for requests to `localhost:4318/v1/traces`

4. **Test without Sentry**:
   - The collector config includes a `logging` exporter
   - Telemetry will be printed to collector stdout for debugging
   - This works even if Sentry credentials are invalid

## 🔍 What You'll See in Sentry

### Traces

Each user action creates a distributed trace with spans like:

```
📊 Trace: user-action: /api/slow
├─ 🌐 fetch GET http://localhost:4000/api/slow  [demo-frontend]
│  ├─ 📡 HTTP GET /api/slow                     [demo-backend]
│  │  └─ ⚡ slow-operation                      [demo-backend]
└─ ⏱️ Total: ~1.2s
```

**Span Attributes** you'll see:
- `service.name`: `demo-frontend` or `demo-backend`
- `service.environment`: `demo`
- `http.method`, `http.url`, `http.status_code`
- Custom attributes like `demo.sleep_duration_ms`

### Logs

Backend logs appear in Sentry with attributes like:

- `severityText`: INFO, WARN, ERROR
- `body`: Log message
- `service.name`: `demo-backend`
- Custom attributes: `endpoint`, `duration_ms`, etc.
- **Trace correlation**: Logs include trace IDs so you can jump from log → trace

### Error Tracking

When you click "Trigger Error":
- An error span is created with `status: ERROR`
- An exception is recorded on the span
- An error-level log is emitted
- All three are correlated by trace ID
- You'll see the full stack trace in Sentry

## 🎯 Key Implementation Details

### Context Propagation

The frontend's `FetchInstrumentation` is configured to propagate trace context:

```typescript
new FetchInstrumentation({
  propagateTraceHeaderCorsUrls: [/localhost:4000/],
})
```

This injects `traceparent` and `tracestate` headers into fetch requests. The backend's auto-instrumentation extracts these headers and creates child spans.

### Resource Attributes

Both apps define identical resource attributes so Sentry can group them:

```typescript
{
  'service.name': 'demo-frontend',  // or 'demo-backend'
  'service.environment': 'demo',
  'service.version': '1.0.0',
}
```

### OTLP Endpoints

- **Backend → Collector**: `http://otel-collector:4318` (internal Docker network)
- **Frontend → Collector**: `http://localhost:4318` (browser → host → container)
- **Collector → Sentry**: Configured via `SENTRY_OTLP_ENDPOINT` env var

### No Sentry SDKs

This demo intentionally does **not** use `@sentry/browser` or `@sentry/node`. Everything is pure OpenTelemetry. This demonstrates:
- Vendor neutrality (can switch from Sentry to Honeycomb/Datadog/etc. by just changing collector config)
- Standard OTLP protocol
- Collector-based architecture (centralized config)

## 🐛 Troubleshooting

### Telemetry not appearing in Sentry

1. **Check Sentry credentials**:
   - Verify `SENTRY_OTLP_ENDPOINT` format
   - Verify `SENTRY_AUTH_HEADER` has correct auth token
   - Check Sentry docs for your specific plan's OTLP endpoint format

2. **Check collector logs**:
   ```bash
   docker-compose logs otel-collector
   ```
   - Look for export errors
   - Verify data is being received (should see detailed logs)

3. **Verify Sentry project supports OTLP**:
   - Some Sentry plans may have limited OTLP support
   - Check your plan's features
   - Make sure project is configured for OpenTelemetry (not just error tracking)

### Frontend can't reach backend

- Make sure backend is running: `curl http://localhost:4000/health`
- Check CORS settings in `backend/src/app.ts`
- Verify `VITE_BACKEND_URL` is correct in frontend environment

### Collector not receiving data

- Check collector health: `curl http://localhost:13133/`
- Verify ports 4317 and 4318 are exposed
- Check firewall/network settings

### Traces not linking frontend + backend

- Verify `FetchInstrumentation` has correct `propagateTraceHeaderCorsUrls`
- Check browser DevTools → Network → request headers for `traceparent`
- Ensure backend auto-instrumentation is enabled (imported in `index.ts` before app)

## 📚 Learn More

### OpenTelemetry

- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/instrumentation/js/)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [Collector Documentation](https://opentelemetry.io/docs/collector/)

### Sentry + OpenTelemetry

- [Sentry OTLP Collector Integration](https://docs.sentry.io/product/drains/integration/opentelemetry-collector/)
- [Sentry OpenTelemetry Overview](https://docs.sentry.io/platforms/javascript/opentelemetry/)

### W3C Trace Context

- [W3C Trace Context Spec](https://www.w3.org/TR/trace-context/)
- [Understanding Distributed Tracing](https://opentelemetry.io/docs/concepts/signals/traces/)

## 🤝 Contributing

This is a demo project, but feel free to:
- Report issues
- Suggest improvements
- Add additional instrumentation examples
- Improve documentation

## 📄 License

MIT License - feel free to use this demo for learning and teaching.

---

**Questions?** Check the inline comments in the code for detailed explanations of how each part works.

**Next Steps:**
1. Explore the code to understand the OTEL setup
2. Modify `backend/src/app.ts` to add custom spans/logs
3. Experiment with different collector exporters (Jaeger, Prometheus, etc.)
4. Add metrics collection (currently only traces and logs)
5. Implement sampling strategies in the collector

