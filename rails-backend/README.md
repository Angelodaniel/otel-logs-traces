# 🚂 Rails Backend with OpenTelemetry

Ruby on Rails API backend demonstrating OpenTelemetry tracing and distributed tracing with Node.js.

## 📋 Features

- ✅ **Rails 7.1** API-only mode
- ✅ **OpenTelemetry** automatic instrumentation
- ✅ **Distributed Tracing** across Ruby → Node.js backends
- ✅ **Custom Spans** with manual instrumentation
- ✅ **OTLP Export** to collector
- ✅ **Docker** ready

## 🎯 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/ruby-data` | GET | Returns sample data with custom spans |
| `/api/ruby-slow` | GET | Slow endpoint (1 second delay) |
| `/api/ruby-error` | GET | Triggers an error for testing |
| `/api/call-node` | GET | **Calls Node.js backend** (distributed tracing demo!) |

## 🔍 Key OpenTelemetry Features Demonstrated

### 1. **Automatic Instrumentation**

```ruby
# config/initializers/opentelemetry.rb
c.use_all({
  'OpenTelemetry::Instrumentation::Rack' => {},
  'OpenTelemetry::Instrumentation::Rails' => { enable_recognize_route: true },
  'OpenTelemetry::Instrumentation::Net::HTTP' => {}  # For outgoing requests
})
```

**Auto-instrumented:**
- HTTP requests (Rack)
- Rails routing and controllers
- Action Pack/View rendering
- Net::HTTP outgoing requests

### 2. **Custom Spans**

```ruby
tracer.in_span('fetch-ruby-data') do |span|
  span.set_attribute('demo.language', 'ruby')
  # ... your code
end
```

### 3. **Error Tracking**

```ruby
def record_exception(exception)
  current_span.record_exception(exception)
  current_span.status = OpenTelemetry::Trace::Status.error(exception.message)
end
```

### 4. **Distributed Tracing (Ruby → Node.js)**

The `/api/call-node` endpoint demonstrates cross-language distributed tracing:

```ruby
uri = URI("http://backend:4000/api/data")
response = Net::HTTP.get_response(uri)  # Context automatically propagated!
```

**What happens:**
1. Rails creates a span for the operation
2. `Net::HTTP` instrumentation injects W3C trace headers
3. Node.js backend receives the request with trace context
4. Node.js creates a child span linked to the Rails parent span
5. Both spans appear in Sentry as a connected distributed trace!

## 🚀 Running Locally

### With Docker (Recommended)

```bash
# From project root
docker-compose up --build
```

Rails backend will be available at http://localhost:5000

### Without Docker

```bash
cd rails-backend

# Install dependencies
bundle install

# Run the server
bundle exec rails server -p 5000
```

## 📊 OpenTelemetry Configuration

### Resource Attributes

```ruby
c.resource = OpenTelemetry::SDK::Resources::Resource.create({
  'service.name' => 'demo-rails-backend',
  'service.version' => '1.0.0',
  'service.environment' => 'demo',
  'telemetry.sdk.language' => 'ruby'
})
```

These attributes help identify Rails traces in Sentry.

### OTLP Exporter

```ruby
OpenTelemetry::Exporter::OTLP::Exporter.new(
  endpoint: "http://otel-collector:4318/v1/traces",
  headers: {},
  compression: 'gzip'
)
```

Sends traces to the OpenTelemetry Collector via OTLP/HTTP.

## 🔗 Distributed Tracing Example

**Scenario:** Frontend → Rails → Node.js

1. **User clicks button** in React frontend
2. **Frontend sends request** to `/api/call-node` (Rails)
3. **Rails receives request**, creates span with trace context
4. **Rails calls Node.js** `/api/data` endpoint
5. **Node.js receives request**, extracts trace context, creates child span
6. **All spans linked** by the same trace ID

**Result in Sentry:**
```
Trace ID: abc123...
├─ [Frontend] fetch GET /api/call-node
│  └─ [Rails] GET /api/call-node
│     └─ [Rails] call-node-backend
│        └─ [Node] HTTP GET /api/data
│           └─ [Node] fetch-data
```

## 🐛 Debugging

### Check if OpenTelemetry is loaded

```bash
docker exec -it otel-rails-backend bundle exec rails runner "puts OpenTelemetry::SDK.configured? ? 'OTEL Configured' : 'Not Configured'"
```

### View Rails logs

```bash
docker logs -f otel-rails-backend
```

You should see:
```
✅ OpenTelemetry tracing initialized for Rails
```

### Test endpoints

```bash
# Health check
curl http://localhost:5000/health

# Ruby data
curl http://localhost:5000/api/ruby-data

# Call Node.js (distributed tracing)
curl http://localhost:5000/api/call-node
```

## 📚 Dependencies

### OpenTelemetry Gems

```ruby
gem 'opentelemetry-sdk'                    # Core SDK
gem 'opentelemetry-exporter-otlp'          # OTLP exporter
gem 'opentelemetry-instrumentation-all'    # Auto-instrumentation for common libraries
```

**Includes instrumentation for:**
- Rack
- Rails
- Action Pack
- Action View  
- Active Support
- Net::HTTP
- And many more...

## 🎓 Learn More

- [OpenTelemetry Ruby](https://opentelemetry.io/docs/instrumentation/ruby/)
- [Rails Instrumentation](https://github.com/open-telemetry/opentelemetry-ruby-contrib/tree/main/instrumentation/rails)
- [OTLP Exporter](https://github.com/open-telemetry/opentelemetry-ruby/tree/main/exporter/otlp)

## 💡 Tips

1. **View trace context in Rails logs:**
   ```ruby
   Rails.logger.info "Trace ID: #{OpenTelemetry::Trace.current_span.context.trace_id.unpack1('H*')}"
   ```

2. **Add custom attributes anywhere:**
   ```ruby
   OpenTelemetry::Trace.current_span.set_attribute('custom.key', 'value')
   ```

3. **Create nested spans:**
   ```ruby
   tracer.in_span('parent') do
     tracer.in_span('child') do
       # Work here
     end
   end
   ```

Enjoy distributed tracing with Rails! 🎉

