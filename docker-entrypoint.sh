#!/bin/sh
# Fix data directory permissions before starting the app
mkdir -p /app/data
chown -R rigos:rigos /app/data
exec "$@"