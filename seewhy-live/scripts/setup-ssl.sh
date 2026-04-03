#!/bin/bash
# scripts/setup-ssl.sh
# Automated Let's Encrypt SSL certificate generation for SeeWhy LIVE

DOMAIN="seewhylive.com"
EMAIL="admin@seewhylive.com"

echo "Setting up production SSL for $DOMAIN..."

if ! command -v certbot &> /dev/null
then
    echo "Certbot could not be found, installing..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

echo "Stopping Nginx slightly if it binds to port 80..."
docker compose stop nginx

echo "Generating Let's Encrypt certificate..."
sudo certbot certonly --standalone \
  --preferred-challenges http \
  --agree-tos \
  --email $EMAIL \
  -d $DOMAIN \
  -d www.$DOMAIN

echo "Configuring certbot auto-renewal..."
(crontab -l 2>/dev/null; echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q") | crontab -

echo "Restarting Docker Compose (Nginx will now pick up the certs)..."
docker compose up -d nginx

echo "✅ SSL configuration complete! Note: Make sure nginx.conf paths point to /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
