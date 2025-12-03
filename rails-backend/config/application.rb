require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "rails/test_unit/railtie"

# Require the gems listed in Gemfile
Bundler.require(*Rails.groups)

module RailsBackend
  class Application < Rails::Application
    # Initialize configuration defaults for Rails 7.1
    config.load_defaults 7.1

    # API only mode
    config.api_only = true

    # CORS configuration
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head]
      end
    end

    # Log level
    config.log_level = :info
    
    # Eager load in production
    config.eager_load = ENV['RAILS_ENV'] == 'production'
  end
end

