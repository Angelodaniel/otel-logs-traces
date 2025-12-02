# 🎯 Sentry Configuration Guide

This guide walks you through setting up Sentry to receive OpenTelemetry data from this demo.

**Official Documentation**: [Sentry OpenTelemetry Collector Integration](https://docs.sentry.io/product/drains/integration/opentelemetry-collector/)

## Quick Setup

### 1. Create or Select a Sentry Project

1. Go to https://sentry.io
2. Create a new project or select an existing one
3. Choose "JavaScript" or "Node.js" as the platform (doesn't matter since we're using OTLP)

### 2. Get Your OTLP Credentials from Sentry

1. Go to **Settings → Projects → [Your Project]**
2. Navigate to **Client Keys (DSN)**
3. Look for the **"OpenTelemetry (OTLP)"** section

You'll see two pieces of information you need:

#### OTLP Endpoint

The endpoint format is:
```
https://o[ORG_ID].ingest.sentry.io/api/[PROJECT_ID]/integration/otlp
```

For example:
```
https://o123456.ingest.sentry.io/api/7891011/integration/otlp
```

**Note**: Don't include `/v1/logs` or `/v1/traces` at the end - the collector adds these automatically.

#### Authentication Header

The auth header format is:
```
x-sentry-auth: sentry sentry_key=YOUR_PUBLIC_KEY
```

You can either:
- **Option A**: Copy the authentication header directly from the OTLP section
- **Option B**: Extract the public key from your DSN

Your DSN looks like:
```
https://PUBLIC_KEY@oORG_ID.ingest.sentry.io/PROJECT_ID
```

The `PUBLIC_KEY` is the part before the `@` symbol.

### 3. No Auth Token Required!

Unlike my initial implementation, Sentry's OTLP integration uses the **public key from your DSN**, not an auth token. This is simpler and more secure for OTLP specifically.

### 4. Configure the Demo

Create a `.env` file:

```bash
cp env.example .env
```

Edit `.env` with your values from the OTLP section:

```bash
# Base endpoint (without /v1/logs or /v1/traces)
SENTRY_OTLP_ENDPOINT=https://o123456.ingest.sentry.io/api/7891011/integration/otlp

# Auth header with your public key (not a bearer token!)
SENTRY_AUTH_HEADER=sentry sentry_key=abc123def456ghi789
```

**Important**: 
- The endpoint should end with `/integration/otlp` (not `/envelope/`)
- The auth header format is `sentry sentry_key=YOUR_KEY` (not `Bearer ...`)
- Use the public key from your DSN, not an auth token

## Verification

### Test the Configuration

1. Start the demo:
   ```bash
   docker-compose up --build
   ```

2. Check collector logs:
   ```bash
   docker-compose logs otel-collector
   ```
   
   Look for:
   - ✅ No authentication errors
   - ✅ "Traces sent successfully" or similar messages

3. Generate telemetry:
   - Open http://localhost:5173
   - Click the test buttons

4. Check Sentry:
   - Go to Performance → Traces
   - You should see traces appearing within 1-2 minutes
   - Services should show as `demo-frontend` and `demo-backend`

## Troubleshooting

### Authentication Errors

If you see `401 Unauthorized` in collector logs:

**Check 1: Auth Header Format**
- Correct format: `sentry sentry_key=YOUR_PUBLIC_KEY`
- NOT: `Bearer YOUR_TOKEN`
- The word "sentry" appears twice (this is correct!)

**Check 2: Public Key**
- Use the public key from your DSN
- Find it in: Project Settings → Client Keys (DSN) → OpenTelemetry (OTLP)
- Or extract from DSN: `https://PUBLIC_KEY@o123.ingest.sentry.io/456`

**Check 3: Correct Header Name**
- Must be `x-sentry-auth` (not `Authorization`)
- The collector config should use this exact header name

### Endpoint Errors

If you see `404 Not Found` or connection errors:

**Check 1: Endpoint Format**
- Must end with `/integration/otlp` (not `/envelope/`)
- Format: `https://o[ORG_ID].ingest.sentry.io/api/[PROJECT_ID]/integration/otlp`
- Don't append `/v1/logs` or `/v1/traces` - the collector does this automatically

**Check 2: OTLP Support**
- Verify your Sentry plan supports OTLP ingestion
- Look for "OpenTelemetry (OTLP)" section in Client Keys settings
- If you don't see this section, your plan may not support OTLP

**Check 3: Region**
- EU region: `https://o[ORG_ID].ingest.sentry.io/...`
- US region: `https://o[ORG_ID].ingest.us.sentry.io/...` (some accounts)
- Check your project settings for the correct ingest URL

### Data Not Appearing in Sentry

**Check 1: Collector is Receiving Data**
```bash
docker-compose logs otel-collector | grep "traces"
```
You should see traces being received from frontend/backend.

**Check 2: Sentry Ingestion Delay**
- First-time ingestion can take 5-10 minutes
- Subsequent data appears within 1-2 minutes
- Check Sentry's system status: https://status.sentry.io

**Check 3: Project Configuration**
- Ensure your project is configured to accept OpenTelemetry data
- Some projects may need OTLP explicitly enabled

## Configuration Examples

### Example 1: Combined Logs and Traces (Recommended)

This is the simplest configuration - one endpoint for both signals:

```yaml
exporters:
  otlphttp/sentry:
    endpoint: https://o123456.ingest.sentry.io/api/7891011/integration/otlp
    headers:
      x-sentry-auth: "sentry sentry_key=abc123def456"
    compression: gzip
    encoding: proto
```

### Example 2: Separate Endpoints for Logs and Traces

If you want more control, use separate endpoints:

```yaml
exporters:
  otlphttp/sentry:
    logs_endpoint: https://o123456.ingest.sentry.io/api/7891011/integration/otlp/v1/logs
    traces_endpoint: https://o123456.ingest.sentry.io/api/7891011/integration/otlp/v1/traces
    headers:
      x-sentry-auth: "sentry sentry_key=abc123def456"
    compression: gzip
    encoding: proto
```

### Example 3: Multiple Sentry Projects

Route different services to different projects using the routing connector:

```yaml
connectors:
  routing:
    table:
      - statement: route() where attributes["service.name"] == "demo-backend"
        pipelines: [logs/backend-project]
      - statement: route() where attributes["service.name"] == "demo-frontend"
        pipelines: [logs/frontend-project]

exporters:
  otlphttp/backend:
    endpoint: https://o123456.ingest.sentry.io/api/111111/integration/otlp
    headers:
      x-sentry-auth: "sentry sentry_key=backend_key_here"
  
  otlphttp/frontend:
    endpoint: https://o123456.ingest.sentry.io/api/222222/integration/otlp
    headers:
      x-sentry-auth: "sentry sentry_key=frontend_key_here"
```

## Useful Sentry Resources

- [OpenTelemetry in Sentry](https://docs.sentry.io/platforms/javascript/opentelemetry/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Auth Tokens Documentation](https://docs.sentry.io/api/auth/)
- [Ingestion Endpoints](https://docs.sentry.io/api/)

## Getting Help

If you're still having issues:

1. Check the [Sentry OpenTelemetry documentation](https://docs.sentry.io/platforms/javascript/opentelemetry/)
2. Verify your Sentry plan includes Performance Monitoring
3. Contact Sentry support with:
   - Your plan type
   - Organization and project IDs
   - Collector error logs
4. Try the Sentry Discord or forum for community help

## Success Criteria

You'll know everything is working when:

✅ Collector logs show successful exports (no errors)
✅ Sentry Performance shows traces from `demo-frontend` and `demo-backend`
✅ Traces show parent-child relationships between frontend and backend spans
✅ Span details include attributes like `http.method`, `http.url`, etc.
✅ Logs appear in Sentry (if your plan includes log ingestion)
✅ Error spans show up in Issues → All Errors

Happy tracing! 🎉

