#!/bin/bash

# ============================================================================
# MonkeySchool RabbitMQ Setup Script
# Creates exchanges, queues, and bindings for log processing
# ============================================================================

set -e

echo "🐰 Setting up RabbitMQ exchanges and queues for MonkeySchool telemetry..."

# RabbitMQ connection details
RABBITMQ_HOST="localhost"
RABBITMQ_PORT="15672"
RABBITMQ_USER="telemetry"
RABBITMQ_PASS="telemetry123"
RABBITMQ_VHOST="/logs"

# Wait for RabbitMQ to be ready
echo "⏳ Waiting for RabbitMQ to be ready..."
until curl -f -u "${RABBITMQ_USER}:${RABBITMQ_PASS}" "http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/overview" >/dev/null 2>&1; do
    echo "RabbitMQ not ready yet, waiting 5 seconds..."
    sleep 5
done

echo "✅ RabbitMQ is ready!"

# Function to create exchange
create_exchange() {
    local exchange_name=$1
    local exchange_type=$2
    
    echo "📤 Creating exchange: ${exchange_name}"
    curl -i -u "${RABBITMQ_USER}:${RABBITMQ_PASS}" \
         -H "Content-Type: application/json" \
         -X PUT \
         "http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/exchanges/%2Flogs/${exchange_name}" \
         -d "{\"type\":\"${exchange_type}\",\"durable\":true}"
}

# Function to create queue
create_queue() {
    local queue_name=$1
    
    echo "📥 Creating queue: ${queue_name}"
    curl -i -u "${RABBITMQ_USER}:${RABBITMQ_PASS}" \
         -H "Content-Type: application/json" \
         -X PUT \
         "http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/queues/%2Flogs/${queue_name}" \
         -d "{\"durable\":true}"
}

# Function to create binding
create_binding() {
    local exchange_name=$1
    local queue_name=$2
    local routing_key=$3
    
    echo "🔗 Binding queue ${queue_name} to exchange ${exchange_name} with key ${routing_key}"
    curl -i -u "${RABBITMQ_USER}:${RABBITMQ_PASS}" \
         -H "Content-Type: application/json" \
         -X POST \
         "http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/api/bindings/%2Flogs/e/${exchange_name}/q/${queue_name}" \
         -d "{\"routing_key\":\"${routing_key}\"}"
}

# ============================================================================
# CREATE EXCHANGES
# ============================================================================

echo "📤 Creating topic exchanges..."

create_exchange "logs.http" "topic"
create_exchange "logs.errors" "topic"
create_exchange "logs.security" "topic"
create_exchange "logs.performance" "topic"
create_exchange "logs.database" "topic"
create_exchange "logs.application" "topic"

# Main logs exchange for general routing
create_exchange "logs" "topic"

# ============================================================================
# CREATE QUEUES
# ============================================================================

echo "📥 Creating queues..."

create_queue "logs.http.queue"
create_queue "logs.errors.queue"
create_queue "logs.security.queue"
create_queue "logs.performance.queue"
create_queue "logs.database.queue"
create_queue "logs.application.queue"

# Dead letter queue for failed messages
create_queue "logs.deadletter.queue"

# ============================================================================
# CREATE BINDINGS
# ============================================================================

echo "🔗 Creating bindings..."

create_binding "logs.http" "logs.http.queue" "monkeyschool.http"
create_binding "logs.errors" "logs.errors.queue" "monkeyschool.errors"
create_binding "logs.security" "logs.security.queue" "monkeyschool.security"
create_binding "logs.performance" "logs.performance.queue" "monkeyschool.performance"
create_binding "logs.database" "logs.database.queue" "monkeyschool.database"
create_binding "logs.application" "logs.application.queue" "monkeyschool.application"

# Bind all to main exchange for backup/monitoring
create_binding "logs" "logs.http.queue" "monkeyschool.http"
create_binding "logs" "logs.errors.queue" "monkeyschool.errors"
create_binding "logs" "logs.security.queue" "monkeyschool.security"
create_binding "logs" "logs.performance.queue" "monkeyschool.performance"
create_binding "logs" "logs.database.queue" "monkeyschool.database"
create_binding "logs" "logs.application.queue" "monkeyschool.application"

echo ""
echo "🎉 RabbitMQ setup completed successfully!"
echo ""
echo "📊 Summary:"
echo "  ✅ Exchanges created: 7"
echo "  ✅ Queues created: 7"
echo "  ✅ Bindings created: 12"
echo ""
echo "🌐 RabbitMQ Management UI: http://localhost:15672"
echo "   Username: ${RABBITMQ_USER}"
echo "   Password: ${RABBITMQ_PASS}"
echo ""
echo "🔍 You can monitor queue activity and message flow through the web interface."