# Configuration Updates

## ✅ Updated to Match Official Sentry Documentation

Based on the [official Sentry OpenTelemetry Collector documentation](https://docs.sentry.io/product/drains/integration/opentelemetry-collector/), the following corrections have been made:

### Authentication Header Format

**Before (Incorrect):**
```yaml
headers:
  Authorization: "Bearer sntrys_YOUR_TOKEN"
```

**After (Correct):**
```yaml
headers:
  x-sentry-auth: "sentry sentry_key=YOUR_PUBLIC_KEY"
```

**Key Changes:**
- Use `x-sentry-auth` header instead of `Authorization`
- Format is `sentry sentry_key=KEY` not `Bearer TOKEN`
- Use the public key from your DSN, not an auth token

### Endpoint Format

**Before (Incorrect):**
```
https://o123456.ingest.sentry.io/api/7891011/envelope/
```

**After (Correct):**
```
https://o123456.ingest.sentry.io/api/7891011/integration/otlp
```

**Key Changes:**
- Path ends with `/integration/otlp` not `/envelope/`
- The collector automatically appends `/v1/logs` or `/v1/traces`
- Can also use specific `logs_endpoint` and `traces_endpoint` if needed

### Additional Recommended Settings

Added per Sentry's official docs:
```yaml
compression: gzip
encoding: proto
```

### Where to Find Credentials

1. Go to Sentry Project Settings
2. Navigate to **Client Keys (DSN)**
3. Look for **"OpenTelemetry (OTLP)"** section
4. Copy the endpoint and authentication header shown there

### Extracting Public Key from DSN

Your DSN looks like:
```
https://PUBLIC_KEY@oORG_ID.ingest.sentry.io/PROJECT_ID
```

The `PUBLIC_KEY` is the part before the `@` symbol. Use this in your auth header:
```
sentry sentry_key=PUBLIC_KEY
```

## Files Updated

1. ✅ `otel-collector/otel-collector-config.yaml` - Corrected exporter configuration
2. ✅ `env.example` - Updated with correct format and examples
3. ✅ `docker-compose.yml` - Fixed environment variable defaults
4. ✅ `SENTRY_SETUP.md` - Completely revised with accurate instructions
5. ✅ `README.md` - Updated quick start section with correct format

## Testing

After making these changes:

1. Update your `.env` file with the correct format
2. Restart the services: `docker-compose down && docker-compose up --build`
3. Check collector logs: `docker-compose logs -f otel-collector`
4. You should see successful exports without authentication errors

## References

- [Sentry OpenTelemetry Collector Integration](https://docs.sentry.io/product/drains/integration/opentelemetry-collector/)
- [OpenTelemetry Collector OTLP HTTP Exporter](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/otlphttpexporter)

