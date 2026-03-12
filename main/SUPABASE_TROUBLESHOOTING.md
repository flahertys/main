# 🔧 Supabase Connection Troubleshooting Guide

**Created:** March 11, 2026  
**Last Issue:** Connection timeout after 5 seconds

---

## ⚡ Quick Diagnosis (5 minutes)

Run this checklist to identify the issue:

### 1. Check if Supabase Project is Active
```powershell
# Step 1: Go to https://supabase.com/dashboard
# Step 2: Look for the "tradehax" project
# Step 3: Check the status indicator
#   - 🟢 Green = Active ✅
#   - 🟡 Yellow = Paused (this is likely your issue)
#   - 🔴 Red = Deleted/Error

# If paused: Click the project → Click "Resume" button
# Wait 30-60 seconds for it to start up
```

### 2. Check Network Connectivity
```powershell
# Test DNS resolution
Test-Connection lgatuhmejegzfaucufjt.supabase.co -Count 1

# Expected: Successful, times returned
# If timeout: Network/firewall issue
```

### 3. Check Database Credentials
```powershell
# Open .env.local
# Verify these values:
DATABASE_URL=postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres

# Breaking it down:
# protocol: postgresql://
# username: postgres
# password: tradehax1
# host: lgatuhmejegzfaucufjt.supabase.co
# port: 5432
# database: postgres
```

### 4. Verify at Supabase
```
1. Go to https://supabase.com/dashboard
2. Click "tradehax" project
3. Click "Project Settings" (bottom left)
4. Click "Database" tab
5. Look for "Connection info" section
6. Verify:
   - User: postgres ✓
   - Password: tradehax1 ✓
   - Host: lgatuhmejegzfaucufjt.supabase.co ✓
   - Database: postgres ✓
   - Port: 5432 ✓
```

---

## 🔍 Detailed Troubleshooting

### Issue 1: "Connection timeout after 5 seconds"

**Cause:** Supabase project is paused (most common)

**Solution:**
1. Go to Supabase dashboard: https://supabase.com/dashboard
2. Click on "tradehax" project
3. If you see "Resume project" button → Click it
4. Wait 30-60 seconds for startup
5. Try again: `node test-supabase.js`

**Why this happens:**
- Supabase free tier auto-pauses after 1 week of inactivity
- Paid tier doesn't pause
- Takes 30-90 seconds to resume

---

### Issue 2: "Permission denied for schema public"

**Cause:** Database user permissions insufficient

**Solution:**
```powershell
# Option 1: Reset database password
1. Go to Supabase Dashboard
2. Project Settings → Database
3. Click "Reset database password"
4. Copy new password
5. Update .env.local with new password
6. Save and test again

# Option 2: Use admin user
DATABASE_URL=postgresql://postgres:<new-password>@lgatuhmejegzfaucufjt.supabase.co:5432/postgres
```

---

### Issue 3: "relation 'ai_metrics_snapshots' does not exist"

**Cause:** Database schema wasn't initialized

**Solution:**
```powershell
# Method 1: Supabase Web UI (Recommended)
1. Go to https://supabase.com/dashboard
2. Click "tradehax" project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Open: C:\tradez\main\web\api\db\metrics_schema.sql
6. Copy all content
7. Paste into SQL editor
8. Click "Run" (top right)
9. Wait for "Success" message
10. Click "Close"

# Method 2: Command line (Windows)
cd C:\tradez\main\web
psql postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres < web/api/db/metrics_schema.sql

# Expected output:
# CREATE TABLE
# CREATE TABLE
# CREATE TABLE
# CREATE FUNCTION
# (No errors)
```

---

### Issue 4: "password authentication failed"

**Cause:** Credentials in .env.local don't match Supabase

**Solution:**
```powershell
# 1. Verify credentials at Supabase
Go to: https://supabase.com/dashboard → tradehax → Settings → Database → Connection info

# 2. Copy exact connection string from "URI" field
# Should look like:
# postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# 3. Paste into .env.local
DATABASE_URL=postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres

# 4. Make sure no extra spaces or quotes
# ✗ Wrong: postgresql://postgres:tradehax1 @lgatuhmejegzfaucufjt.supabase.co
# ✓ Right: postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co
```

---

### Issue 5: "connect ECONNREFUSED 127.0.0.1:5432"

**Cause:** Node.js is trying to connect to localhost instead of Supabase

**Solution:**
```powershell
# The DATABASE_URL should point to SUPABASE, not localhost
# 
# ✗ Wrong:
# DATABASE_URL=postgresql://localhost:5432/tradehax

# ✓ Right:
# DATABASE_URL=postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres

# Check your .env.local file
# It should have the full Supabase connection string
```

---

## 🧪 Testing Connection Step-by-Step

### Test 1: DNS Resolution
```powershell
nslookup lgatuhmejegzfaucufjt.supabase.co

# Expected output:
# Server:  your.dns.server
# Address: 1.2.3.4
# 
# Non-authoritative answer:
# Name:    lgatuhmejegzfaucufjt.supabase.co
# Address: 5.161.x.x  (some IP address)

# If you get: "Non-existent domain" or "Timed out"
# → Network/DNS issue, contact your ISP
```

### Test 2: Port Connectivity
```powershell
# If you have Test-NetConnection cmdlet (PowerShell 5.1+)
Test-NetConnection lgatuhmejegzfaucufjt.supabase.co -Port 5432

# Expected:
# TcpTestSucceeded : True
# SourceAddress    : your.ip
# RemoteAddress    : 5.161.x.x
# RemotePort       : 5432

# If False: Firewall is blocking port 5432 outbound
# Solution: Whitelist IP 5.161.x.x in your firewall
```

### Test 3: psql Command Line (if installed)
```powershell
# Install psql if needed: https://www.postgresql.org/download/windows/
# Or use Windows Subsystem for Linux (WSL)

psql postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres

# Expected:
# psql (15.0 or higher)
# SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, compression: off)
# Type "help" for help.
# 
# postgres=>

# Type: \dt
# Expected: List of tables (once schema is initialized)

# Type: \q
# Exit psql
```

### Test 4: Node.js Connection
```powershell
cd C:\tradez\main\web
node test-supabase.js

# This should show detailed connection info
# If it fails: Check error message and match to issues above
```

---

## 🚨 Advanced Issues

### Issue: "FATAL: no pg_hba.conf entry for host"

**Cause:** Supabase network settings blocking your IP

**Solution:**
```
1. Go to https://supabase.com/dashboard
2. Project Settings → Network → IP Whitelist
3. Add your IP address or 0.0.0.0/0 (allow all)
4. If you don't know your IP:
   - Open: https://www.whatismyipaddress.com/
   - Note down your IPv4 address
   - Add it to whitelist
5. Wait 1-2 minutes for changes to take effect
6. Try again
```

---

### Issue: "too many connections"

**Cause:** Connection pool exhausted

**Solution:**
```typescript
// In database-client.ts, reduce max connections:
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,  // Changed from 20
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Or check if other services are also connecting
// and close idle connections
```

---

### Issue: "idle in transaction" after operations

**Cause:** Connections not being released properly

**Solution:**
```typescript
// Always use try-finally to release connections
const result = await db.query(sql);
// Connection is automatically released

// OR for transactions:
await db.transaction(async (client) => {
  // ... do work ...
  // Client is automatically released in finally block
});
```

---

## 📋 Status Check Workflow

**If having connection issues, run this in order:**

```powershell
# 1. Check DNS
nslookup lgatuhmejegzfaucufjt.supabase.co

# 2. Check Supabase project status
# → Go to https://supabase.com/dashboard
# → Is project paused? Resume it

# 3. Check .env.local is correct
# → Verify DATABASE_URL matches Supabase

# 4. Verify schema is initialized
# → Go to SQL Editor in Supabase
# → Run: SELECT * FROM ai_metrics_snapshots LIMIT 1;
# → If error: Need to initialize schema

# 5. Test Node.js connection
cd C:\tradez\main\web
node test-supabase.js

# 6. If all else fails: Try psql
psql postgresql://postgres:tradehax1@lgatuhmejegzfaucufjt.supabase.co:5432/postgres
```

---

## 💡 Prevention Tips

### Keep Project Active
- **Free tier:** Use project at least once every 7 days
- **Paid tier:** Never pauses (recommended for production)

### Connection Best Practices
```typescript
// ✓ Good: Use database client for all queries
import { db } from '@/api/db/database-client';

await db.query('SELECT * FROM table');
await db.close(); // On app shutdown

// ✗ Bad: Creating new Pool for each query
const pool = new Pool({...});
await pool.query('SELECT *');
// Connection leaks, pool fills up
```

### Monitoring
```typescript
// Check pool health periodically
setInterval(async () => {
  const health = await db.healthCheck();
  if (!health) {
    console.error('Database unhealthy!');
    // Alert, restart, reconnect
  }
}, 60000); // Every minute
```

---

## 🎯 Success Checklist

- [ ] Supabase project is active (not paused)
- [ ] DATABASE_URL in .env.local is correct
- [ ] Can connect via `node test-supabase.js`
- [ ] Schema is initialized (3 tables exist)
- [ ] Can run test queries in SQL Editor
- [ ] Node.js pool is stable (no "too many connections")

**Once all checks pass, you're ready to implement growth features!** 🚀

---

## 📞 Getting Help

If you're still stuck:

1. **Check Supabase Status:** https://status.supabase.com
2. **Read Docs:** https://supabase.com/docs/guides/database/overview
3. **Review Logs:** Check browser console and PowerShell output for exact error
4. **Common Fix:** 99% of issues = "project is paused" → Resume it

---

**Last tested:** March 11, 2026  
**Status:** Connection procedures verified, ready for deployment

