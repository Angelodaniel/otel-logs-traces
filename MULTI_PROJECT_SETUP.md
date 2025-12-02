# Multi-Project Setup Guide

This guide explains how to route frontend and backend telemetry to **separate Sentry projects**.

## ⚠️ Important Note

**For most use cases, using a single Sentry project is recommended** because:
- Distributed traces stay connected across frontend and backend
- Simpler configuration
- Better visibility into full user journeys

**Use separate projects only if:**
- Different teams own frontend vs backend with separate access control needs
- You need separate rate limits and billing
- Services are truly independent and don't share traces

## 📋 Setup Steps

### 1. Create Two Sentry Projects

1. Go to Sentry and create two projects:
   - **Project 1**: "Demo Frontend" (or similar)
   - **Project 2**: "Demo Backend" (or similar)

2. For each project, get the OTLP credentials:
   - Go to Settings → Client Keys (DSN) → OpenTelemetry (OTLP)
   - Note the endpoint and auth header

### 2. Configure Environment Variables

Edit your `.env` file:

```bash
# Backend Sentry project
SENTRY_BACKEND_OTLP_ENDPOINT=https://o123456.ingest.sentry.io/api/BACKEND_PROJECT_ID/integration/otlp
SENTRY_BACKEND_AUTH_HEADER=sentry sentry_key=BACKEND_PUBLIC_KEY

# Frontend Sentry project
SENTRY_FRONTEND_OTLP_ENDPOINT=https://o123456.ingest.sentry.io/api/FRONTEND_PROJECT_ID/integration/otlp
SENTRY_FRONTEND_AUTH_HEADER=sentry sentry_key=FRONTEND_PUBLIC_KEY
```

### 3. Use the Multi-Project Collector Config

Update `docker-compose.yml` to use the routing configuration:

```yaml
otel-collector:
  image: otel/opentelemetry-collector-contrib:latest  # Note: need contrib for routing
  command: ["--config=/etc/otel-collector-config.yaml"]
  volumes:
    - ./otel-collector/otel-collector-config-multi-project.yaml:/etc/otel-collector-config.yaml
  ports:
    - "4317:4317"
    - "4318:4318"
    - "13133:13133"
  environment:
    SENTRY_BACKEND_OTLP_ENDPOINT: ${SENTRY_BACKEND_OTLP_ENDPOINT}
    SENTRY_BACKEND_AUTH_HEADER: ${SENTRY_BACKEND_AUTH_HEADER}
    SENTRY_FRONTEND_OTLP_ENDPOINT: ${SENTRY_FRONTEND_OTLP_ENDPOINT}
    SENTRY_FRONTEND_AUTH_HEADER: ${SENTRY_FRONTEND_AUTH_HEADER}
```

**Important:** Change the image to `otel/opentelemetry-collector-contrib:latest` because the routing connector is only available in the contrib distribution.

### 4. Restart and Test

```bash
docker-compose down
docker-compose up --build
```

Check the collector logs to verify routing:

```bash
docker-compose logs -f otel-collector
```

You should see traces being routed to different exporters based on `service.name`.

## 🔍 How It Works

The routing connector uses the `service.name` attribute to route telemetry:

```yaml
connectors:
  routing:
    table:
      - statement: route() where attributes["service.name"] == "demo-backend"
        pipelines: [traces/backend]
      - statement: route() where attributes["service.name"] == "demo-frontend"
        pipelines: [traces/frontend]
```

**Pipeline flow:**

```
Frontend → Collector
  ├─ Check service.name == "demo-frontend" ✓
  └─ Route to traces/frontend pipeline
     └─ Export to Frontend Sentry Project

Backend → Collector
  ├─ Check service.name == "demo-backend" ✓
  └─ Route to traces/backend pipeline
     └─ Export to Backend Sentry Project
```

## ⚠️ Limitations of Separate Projects

### Lost Distributed Traces

When frontend and backend are in separate projects, you **lose the connection** between them:

**Single Project (Connected):**
```
Trace abc123:
├─ [Frontend Project] fetch /api/slow
│  └─ [Backend Project] HTTP GET /api/slow  ← Connected!
```

**Separate Projects (Disconnected):**
```
[Frontend Project]
  Trace abc123:
  └─ fetch /api/slow (orphaned span)

[Backend Project]
  Trace abc123:
  └─ HTTP GET /api/slow (shows as root span)
```

Sentry won't show these as a connected trace unless you have cross-project trace linking (enterprise feature).

### Workarounds

1. **Use Trace Links**: Include trace IDs in logs/tags to manually correlate
2. **Shared Tags**: Add common tags like `transaction_id` or `user_id`
3. **Dual Export**: Export to both a shared project AND individual projects

## 🎯 Recommendation

**Start with a single project.** Only split if you have a clear organizational need.

If you need team separation within a single project, use:
- Sentry's team-based access controls
- Notification routing based on `service.name`
- Custom dashboards per team

## 📚 References

- [OpenTelemetry Routing Connector](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/routingconnector)
- [Sentry Multi-Project Setup](https://docs.sentry.io/product/sentry-basics/integrate-backend/opentelemetry/)

