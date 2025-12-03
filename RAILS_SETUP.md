# 🚂 Rails Backend Setup Guide

You now have a **polyglot distributed tracing demo** with Ruby on Rails!

## 🎯 What Was Added

### New Service: Rails Backend (Port 5000)

A Ruby on Rails API backend with:
- ✅ OpenTelemetry automatic instrumentation
- ✅ Custom spans and attributes  
- ✅ **Distributed tracing with Node.js** backend
- ✅ Same OTLP → Collector → Sentry flow

### Key Feature: Cross-Language Distributed Tracing

The `/api/call-node` endpoint demonstrates **Rails → Node.js** distributed tracing:

```
User Request
    ↓
Rails Backend (Ruby)
    ↓ (HTTP call with trace context)
Node.js Backend
    ↓
Single distributed trace in Sentry!
```

## 🚀 How to Run

### Start All Services

```bash
cd /Users/angelodevoer/Desktop/Uprate/otel-sentry-demo
docker-compose up --build
```

**Services will start on:**
- Frontend: http://localhost:5173
- Node.js Backend: http://localhost:4000
- **Rails Backend: http://localhost:5000** ← New!
- Collector: ports 4317, 4318

## 🧪 Test the Rails Backend

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "service": "demo-rails-backend",
  "timestamp": "2024-12-02T10:00:00Z"
}
```

### 2. Get Ruby Data (with custom spans)

```bash
curl http://localhost:5000/api/ruby-data
```

**What you'll see in Sentry:**
- Trace with `demo-rails-backend` service
- Spans: `GET /api/ruby-data`, `fetch-ruby-data`
- Attributes: `demo.language=ruby`, `demo.framework=rails`

### 3. Slow Endpoint (1 second delay)

```bash
curl http://localhost:5000/api/ruby-slow
```

**What you'll see:**
- Span showing 1-second duration
- Timing breakdown in Sentry waterfall

### 4. Error Endpoint

```bash
curl http://localhost:5000/api/ruby-error
```

**What you'll see:**
- Error span with exception details
- Stack trace in Sentry
- Service: `demo-rails-backend`

### 5. 🔥 Distributed Tracing: Rails → Node.js

```bash
curl http://localhost:5000/api/call-node
```

**This is the killer feature!**

**What happens:**
1. Rails receives your request
2. Rails makes HTTP call to Node.js backend at `http://backend:4000/api/data`
3. OpenTelemetry automatically propagates trace context via W3C headers
4. Node.js creates child spans linked to the Rails parent span

**What you'll see in Sentry:**
```
Trace ID: abc123def456...
├─ [demo-rails-backend] GET /api/call-node
│  └─ [demo-rails-backend] call-node-backend
│     └─ [demo-backend] HTTP GET /api/data
│        └─ [demo-backend] fetch-data
```

**A single trace across two different programming languages!** 🎉

## 📊 Sentry Configuration

### Option 1: Use Same Project as Node.js Backend (Default)

The Rails backend defaults to using the same Sentry project as your Node.js backend.

**No additional configuration needed!**

Your `.env` already has:
```bash
SENTRY_BACKEND_OTLP_ENDPOINT=...
SENTRY_BACKEND_AUTH_HEADER=...
```

Rails will use these by default (see `docker-compose.yml` line 28).

### Option 2: Separate Sentry Project for Rails

If you want Rails in its own Sentry project:

**1. Add to your `.env`:**
```bash
SENTRY_RAILS_OTLP_ENDPOINT=https://oYOUR_ORG.ingest.sentry.io/api/RAILS_PROJECT_ID/integration/otlp
SENTRY_RAILS_AUTH_HEADER=sentry sentry_key=RAILS_PUBLIC_KEY
```

**2. Restart:**
```bash
docker-compose restart otel-collector rails-backend
```

The collector will route `demo-rails-backend` telemetry to the Rails project.

## 🔍 Verify It's Working

### Check Rails Logs

```bash
docker logs otel-rails-backend
```

You should see:
```
✅ OpenTelemetry tracing initialized for Rails
Puma starting in production mode...
* Listening on http://0.0.0.0:5000
```

### Check Collector Routing

```bash
docker logs otel-collector | grep "demo-rails-backend"
```

You should see spans being routed and exported.

### Check Sentry

Go to your Sentry project and filter by:
```
service.name:demo-rails-backend
```

You should see Rails traces!

## 🎓 What This Demonstrates

### 1. Polyglot Observability

- **Frontend**: JavaScript/TypeScript (React)
- **Backend**: JavaScript/TypeScript (Node.js)
- **Backend**: Ruby (Rails)

All using the same OpenTelemetry standard!

### 2. Vendor-Neutral Instrumentation

No Sentry SDKs used. Pure OpenTelemetry means you can:
- Switch from Sentry to Datadog/Honeycomb/etc. by changing collector config
- Add multiple backends (send to Sentry AND Jaeger simultaneously)
- Use same instrumentation regardless of backend

### 3. Distributed Tracing Standards

W3C Trace Context headers automatically propagated:
- `traceparent`: Carries trace ID, span ID, flags
- `tracestate`: Vendor-specific trace info

Works across any language that supports OpenTelemetry!

### 4. Collector-Based Architecture

All services → Collector → Multiple backends

Benefits:
- Centralized configuration
- Rate limiting/sampling at collector
- Easy to add new backends
- Services don't know about Sentry

## 📚 Rails OpenTelemetry Code

### Initialization

```ruby
# config/initializers/opentelemetry.rb
OpenTelemetry::SDK.configure do |c|
  c.service_name = 'demo-rails-backend'
  c.add_span_processor(...)
  c.use_all  # Auto-instrument everything
end
```

### Custom Spans

```ruby
# app/controllers/api/demo_controller.rb
tracer.in_span('fetch-ruby-data') do |span|
  span.set_attribute('demo.language', 'ruby')
  # Your code here
end
```

### Current Span

```ruby
current_span = OpenTelemetry::Trace.current_span
current_span.set_attribute('key', 'value')
```

## 🐛 Troubleshooting

### Rails container won't start

**Check dependencies:**
```bash
docker-compose logs rails-backend
```

Common issue: Gemfile.lock mismatch. Delete and rebuild:
```bash
rm rails-backend/Gemfile.lock
docker-compose build rails-backend
```

### No traces in Sentry

**Verify OTEL is initialized:**
```bash
docker exec otel-rails-backend bundle exec rails runner "puts OpenTelemetry::SDK.configured?"
```

Should output: `true`

### Distributed trace not connecting

**Check Net::HTTP instrumentation:**
```bash
docker logs otel-rails-backend | grep "Net::HTTP"
```

Should see instrumentation loaded.

## 🎉 Success Criteria

You know it's working when:

✅ Rails health check responds
✅ Traces appear in Sentry with `service.name:demo-rails-backend`  
✅ Distributed trace shows Rails → Node.js connection  
✅ Single trace ID spans both Ruby and Node.js code  
✅ Collector routes Rails telemetry correctly  

## 📖 Further Reading

- [OpenTelemetry Ruby Documentation](https://opentelemetry.io/docs/instrumentation/ruby/)
- [Rails Instrumentation](https://github.com/open-telemetry/opentelemetry-ruby-contrib/tree/main/instrumentation/rails)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)

Enjoy your polyglot distributed tracing! 🚀

