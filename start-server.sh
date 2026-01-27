#!/bin/bash
# Simple HTTP server starter script

PORT=${1:-8000}

echo "Starting HTTP server on port $PORT..."
echo "Open your browser to: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "Error: Python not found. Please install Python or use Live Server extension in VS Code."
    exit 1
fi
