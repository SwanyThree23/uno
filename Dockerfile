FROM node:20-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Ensure the database is in a volume-friendly location if needed,
# but for now we'll keep it in the root.
EXPOSE 4000

CMD ["npm", "start"]
