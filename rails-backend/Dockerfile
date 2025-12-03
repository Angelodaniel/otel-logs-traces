FROM ruby:3.2-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    tzdata \
    sqlite-dev \
    yaml-dev

WORKDIR /app

# Copy Gemfile
COPY Gemfile* ./

# Install gems (without deployment mode to allow platform resolution)
RUN bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

# Copy application code
COPY . .

# Precompile assets (if any) and bootsnap cache
RUN bundle exec bootsnap precompile --gemfile app/ lib/

# Expose port
EXPOSE 5000

# Start Puma server
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]

