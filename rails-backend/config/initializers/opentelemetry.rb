# OpenTelemetry Initialization for Rails
# This file configures tracing and logging for the Rails application

require 'opentelemetry/sdk'
require 'opentelemetry/exporter/otlp'
require 'opentelemetry/instrumentation/all'

# Configure OpenTelemetry
OpenTelemetry::SDK.configure do |c|
  # Service name and resource attributes
  c.service_name = 'demo-rails-backend'
  c.service_version = '1.0.0'
  
  c.resource = OpenTelemetry::SDK::Resources::Resource.create({
    'service.name' => 'demo-rails-backend',
    'service.version' => '1.0.0',
    'service.environment' => 'demo',
    'deployment.environment' => 'demo',
    'telemetry.sdk.language' => 'ruby',
    'telemetry.sdk.name' => 'opentelemetry'
  })

  # Configure OTLP exporter
  otlp_endpoint = ENV.fetch('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://otel-collector:4318')
  
  c.add_span_processor(
    OpenTelemetry::SDK::Trace::Export::BatchSpanProcessor.new(
      OpenTelemetry::Exporter::OTLP::Exporter.new(
        endpoint: "#{otlp_endpoint}/v1/traces",
        headers: {},
        compression: 'gzip'
      )
    )
  )

  # Auto-instrument all supported libraries
  c.use_all({
    'OpenTelemetry::Instrumentation::Rack' => { 
      untraced_endpoints: ['/health'] 
    },
    'OpenTelemetry::Instrumentation::Rails' => { 
      enable_recognize_route: true 
    },
    'OpenTelemetry::Instrumentation::ActionPack' => {},
    'OpenTelemetry::Instrumentation::ActionView' => {},
    'OpenTelemetry::Instrumentation::ActiveSupport' => {},
    'OpenTelemetry::Instrumentation::Net::HTTP' => {}
  })
end

Rails.logger.info '✅ OpenTelemetry tracing initialized for Rails'

