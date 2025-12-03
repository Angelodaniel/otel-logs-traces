module Api
  class DemoController < ApplicationController
    # GET /api/ruby-data
    # Returns sample data with custom span attributes
    def ruby_data
      tracer.in_span('fetch-ruby-data') do |span|
        span.set_attribute('demo.language', 'ruby')
        span.set_attribute('demo.framework', 'rails')
        
        # Simulate data fetching
        sleep(0.1)
        
        data = {
          language: 'Ruby',
          framework: 'Rails',
          version: Rails.version,
          items: [
            { id: 1, name: 'Ruby Item 1', value: 100 },
            { id: 2, name: 'Ruby Item 2', value: 200 },
            { id: 3, name: 'Ruby Item 3', value: 300 }
          ],
          timestamp: Time.now.iso8601
        }
        
        span.set_attribute('data.item_count', data[:items].length)
        
        Rails.logger.info "Fetched Ruby data with #{data[:items].length} items"
        
        render json: data
      end
    end

    # GET /api/ruby-slow
    # Slow endpoint with 1 second delay
    def ruby_slow
      tracer.in_span('slow-ruby-operation') do |span|
        span.set_attribute('demo.sleep_duration_ms', 1000)
        span.set_attribute('demo.language', 'ruby')
        
        Rails.logger.info 'Starting slow Ruby operation'
        
        # Simulate slow operation
        sleep(1)
        
        Rails.logger.info 'Slow Ruby operation completed'
        
        render json: { 
          message: 'Slow Ruby response',
          duration_ms: 1000,
          timestamp: Time.now.iso8601
        }
      end
    end

    # GET /api/ruby-error
    # Endpoint that raises an error
    def ruby_error
      span = current_span
      span.set_attribute('demo.will_error', true) if span
      
      Rails.logger.error 'Intentional Ruby error triggered'
      
      # Create and raise an error
      error = StandardError.new('This is a demo error from Rails to test error tracking')
      
      record_exception(error)
      
      render json: { 
        error: error.message,
        language: 'Ruby',
        timestamp: Time.now.iso8601
      }, status: :internal_server_error
    end

    # GET /api/call-node
    # Calls the Node.js backend to demonstrate distributed tracing across multiple backends
    def call_node
      tracer.in_span('call-node-backend') do |span|
        span.set_attribute('demo.cross_backend_call', true)
        span.set_attribute('demo.target_backend', 'node')
        
        Rails.logger.info 'Rails calling Node.js backend'
        
        begin
          # Call the Node.js backend
          uri = URI("http://backend:4000/api/data")
          response = Net::HTTP.get_response(uri)
          
          span.set_attribute('http.status_code', response.code.to_i)
          
          if response.is_a?(Net::HTTPSuccess)
            node_data = JSON.parse(response.body)
            
            render json: {
              message: 'Rails successfully called Node.js backend',
              node_response: node_data,
              rails_timestamp: Time.now.iso8601
            }
          else
            span.status = OpenTelemetry::Trace::Status.error('Node.js backend returned error')
            render json: { error: 'Node.js backend error' }, status: :bad_gateway
          end
        rescue StandardError => e
          record_exception(e)
          Rails.logger.error "Error calling Node.js backend: #{e.message}"
          render json: { error: e.message }, status: :service_unavailable
        end
      end
    end
  end
end

