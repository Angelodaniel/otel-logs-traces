class ApplicationController < ActionController::API
  # Health check endpoint
  def health
    render json: { 
      status: 'ok', 
      service: 'demo-rails-backend',
      timestamp: Time.now.iso8601
    }
  end

  private

  # Helper to get current span for adding custom attributes
  def current_span
    OpenTelemetry::Trace.current_span
  end

  # Helper to get tracer for creating custom spans
  def tracer
    OpenTelemetry.tracer_provider.tracer('demo-rails-backend', '1.0.0')
  end

  # Helper to add span attributes
  def add_span_attribute(key, value)
    current_span.set_attribute(key, value) if current_span
  end

  # Helper to record an exception
  def record_exception(exception)
    current_span.record_exception(exception) if current_span
    current_span.status = OpenTelemetry::Trace::Status.error(exception.message) if current_span
  end
end

