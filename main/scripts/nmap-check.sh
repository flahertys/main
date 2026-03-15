#!/bin/bash

DOMAIN="tradehax.net"
echo "Running nmap for $DOMAIN..."
nmap -Pn $DOMAIN -p 80,443

