#!/bin/bash

DOMAIN="tradehax.net"
EXPECTED_IP="76.76.21.21"

echo "Checking DNS for $DOMAIN..."
RESOLVED_IP=$(dig +short $DOMAIN | tail -n1)

if [[ "$RESOLVED_IP" == "$EXPECTED_IP" ]]; then
    echo "DNS is correctly pointed to Vercel ($EXPECTED_IP)."
else
    echo "DNS is NOT correctly pointed! Found: $RESOLVED_IP, expected: $EXPECTED_IP"
    exit 1
fi

