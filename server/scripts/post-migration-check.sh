#!/bin/bash

# Post-Migration Validation Script
# Bu script migration sonrası veri kaybı kontrolü yapar

echo "🔍 Post-Migration Validation Starting..."
echo "📅 Timestamp: $(date)"

# Database URL kontrolü
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Pre-migration snapshot kontrolü
SNAPSHOT_FILE="pre-migration-snapshot-latest.json"

if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "❌ ERROR: Pre-migration snapshot not found!"
    echo "   Please run pre-migration-check.sh before migration"
    exit 1
fi

echo "📂 Loading pre-migration snapshot: $SNAPSHOT_FILE"

# Önceki sayıları oku
PREV_SALES=$(jq -r '.counts.sales' "$SNAPSHOT_FILE")
PREV_CUSTOMERS=$(jq -r '.counts.customers' "$SNAPSHOT_FILE")
PREV_USERS=$(jq -r '.counts.users' "$SNAPSHOT_FILE")
PREV_BRANCHES=$(jq -r '.counts.branches' "$SNAPSHOT_FILE")
PREV_POLICY_TYPES=$(jq -r '.counts.policyTypes' "$SNAPSHOT_FILE")
PREV_TASKS=$(jq -r '.counts.tasks' "$SNAPSHOT_FILE")

# Yeni sayıları al
echo "📊 Collecting post-migration data counts..."

NEW_SALES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM sales;")
NEW_CUSTOMERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM customers;")
NEW_USERS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;")
NEW_BRANCHES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM branches;")
NEW_POLICY_TYPES=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM policy_types;")
NEW_TASKS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM tasks;")

# Karşılaştırma
echo ""
echo "Data Comparison:"
echo "----------------"

DATA_LOSS=0

compare_counts() {
    local table=$1
    local prev=$2
    local new=$3
    
    if [ "$new" -lt "$prev" ]; then
        echo "❌ $table: DATA LOSS DETECTED! ($prev → $new)"
        DATA_LOSS=1
    elif [ "$new" -eq "$prev" ]; then
        echo "✅ $table: No change ($new)"
    else
        echo "✅ $table: Increased ($prev → $new)"
    fi
}

compare_counts "Sales       " "$PREV_SALES" "$NEW_SALES"
compare_counts "Customers   " "$PREV_CUSTOMERS" "$NEW_CUSTOMERS"
compare_counts "Users       " "$PREV_USERS" "$NEW_USERS"
compare_counts "Branches    " "$PREV_BRANCHES" "$NEW_BRANCHES"
compare_counts "Policy Types" "$PREV_POLICY_TYPES" "$NEW_POLICY_TYPES"
compare_counts "Tasks       " "$PREV_TASKS" "$NEW_TASKS"

echo ""

# Sonuç
if [ $DATA_LOSS -eq 1 ]; then
    echo "🚨 CRITICAL: DATA LOSS DETECTED!"
    echo ""
    echo "IMMEDIATE ACTIONS REQUIRED:"
    echo "1. Stop the application immediately"
    echo "2. Rollback the migration:"
    echo "   npx prisma migrate resolve --rolled-back <MIGRATION_NAME>"
    echo "3. Restore from backup:"
    echo "   psql \$DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql"
    echo "4. Notify the team"
    echo ""
    exit 1
else
    echo "✅ Migration successful - No data loss detected"
    echo ""
    
    # Başarılı migration kaydı
    REPORT_FILE="migration-report-$(date +%Y%m%d_%H%M%S).json"
    
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "status": "success",
  "before": {
    "sales": $PREV_SALES,
    "customers": $PREV_CUSTOMERS,
    "users": $PREV_USERS,
    "branches": $PREV_BRANCHES,
    "policyTypes": $PREV_POLICY_TYPES,
    "tasks": $PREV_TASKS
  },
  "after": {
    "sales": $NEW_SALES,
    "customers": $NEW_CUSTOMERS,
    "users": $NEW_USERS,
    "branches": $NEW_BRANCHES,
    "policyTypes": $NEW_POLICY_TYPES,
    "tasks": $NEW_TASKS
  }
}
EOF
    
    echo "📄 Migration report saved to: $REPORT_FILE"
    exit 0
fi
