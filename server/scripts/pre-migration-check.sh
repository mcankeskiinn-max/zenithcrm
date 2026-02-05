#!/bin/bash

# Pre-Migration Safety Check Script
# Bu script migration öncesi veri sayılarını kaydeder

echo "🔍 Pre-Migration Safety Check Starting..."
echo "📅 Timestamp: $(date)"

# Database URL kontrolü
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Veri sayılarını al
echo "📊 Collecting current data counts..."

SALES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sales;")
CUSTOMERS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM customers;")
USERS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;")
BRANCHES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM branches;")
POLICY_TYPES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM policy_types;")
TASKS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM tasks;")

# Sonuçları göster
echo ""
echo "Current Data Counts:"
echo "-------------------"
echo "Sales:        $SALES_COUNT"
echo "Customers:    $CUSTOMERS_COUNT"
echo "Users:        $USERS_COUNT"
echo "Branches:     $BRANCHES_COUNT"
echo "Policy Types: $POLICY_TYPES_COUNT"
echo "Tasks:        $TASKS_COUNT"
echo ""

# JSON dosyasına kaydet
SNAPSHOT_FILE="pre-migration-snapshot-$(date +%Y%m%d_%H%M%S).json"

cat > "$SNAPSHOT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "counts": {
    "sales": $SALES_COUNT,
    "customers": $CUSTOMERS_COUNT,
    "users": $USERS_COUNT,
    "branches": $BRANCHES_COUNT,
    "policyTypes": $POLICY_TYPES_COUNT,
    "tasks": $TASKS_COUNT
  }
}
EOF

echo "✅ Snapshot saved to: $SNAPSHOT_FILE"
echo ""
echo "⚠️  IMPORTANT: Keep this file for post-migration validation"
echo "   Run post-migration-check.sh after migration completes"
echo ""

# Latest snapshot link oluştur
ln -sf "$SNAPSHOT_FILE" "pre-migration-snapshot-latest.json"

echo "✅ Pre-migration check complete!"
