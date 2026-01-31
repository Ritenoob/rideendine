#!/bin/bash
# RideNDine Database Setup Script

set -e

echo "🗄️  Setting up RideNDine Database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
  echo "❌ PostgreSQL is not running. Please start it first:"
  echo "   sudo systemctl start postgresql"
  exit 1
fi

echo "✅ PostgreSQL is running"

# Create database and user
echo "📝 Creating database and user..."
sudo -u postgres psql << 'EOF'
CREATE USER ridendine WITH PASSWORD 'ridendine_dev_password';
CREATE DATABASE ridendine_dev OWNER ridendine;
GRANT ALL PRIVILEGES ON DATABASE ridendine_dev TO ridendine;
\c ridendine_dev
GRANT ALL ON SCHEMA public TO ridendine;
EOF

echo "✅ Database and user created"

# Run migrations
echo "🔄 Running migrations..."
cd "$(dirname "$0")/.."
for migration in database/migrations/*.sql; do
  PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -f "$migration"
done

echo "✅ Migrations complete"

# Ask about seed data
read -p "🌱 Load test/seed data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Loading seed data..."
  PGPASSWORD=ridendine_dev_password psql -h localhost -U ridendine -d ridendine_dev -f database/seeds/001_test_users.sql
  echo "✅ Seed data loaded"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Connection details:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: ridendine_dev"
echo "  User: ridendine"
echo "  Password: ridendine_dev_password"
