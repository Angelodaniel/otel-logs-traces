# Puma configuration file

# Specifies the number of `workers` to boot in clustered mode.
workers ENV.fetch("WEB_CONCURRENCY") { 2 }

# Specifies the `environment` that Puma will run in.
environment ENV.fetch("RAILS_ENV") { "production" }

# Allow puma to be restarted by `rails restart` command.
plugin :tmp_restart

# Specifies the number of `threads` to boot in clustered mode.
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

# Workers for cluster mode
workers ENV.fetch("WEB_CONCURRENCY") { 2 }

# Specifies the `port` that Puma will listen on to receive requests
port ENV.fetch("PORT") { 5001 }

# Preload the application for better performance
preload_app!

# Log to stdout
stdout_redirect nil, nil, true

