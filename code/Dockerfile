# Dockerfile for MonkeySchool Node.js Backend
FROM node:24

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Expose port (from .env or default 3000)
EXPOSE 3000

# Set environment variables (can be overridden by docker-compose)
ENV NODE_ENV=production

# Add entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Use entrypoint script to reset, migrate, seed, then start app
ENTRYPOINT ["./docker-entrypoint.sh"]
