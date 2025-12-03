Rails.application.routes.draw do
  # Health check endpoint
  get '/health', to: 'application#health'

  # API endpoints
  namespace :api do
    get '/ruby-data', to: 'demo#ruby_data'
    get '/ruby-slow', to: 'demo#ruby_slow'
    get '/ruby-error', to: 'demo#ruby_error'
    get '/call-node', to: 'demo#call_node'
  end
end

