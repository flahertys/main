# ☕ Java 21 (LTS) Upgrade - Quick Start Guide

**Status:** ✅ Ready for Deployment  
**Date:** March 19, 2026  
**Upgrade Path:** Java 17 → Java 21 (LTS)

---

## 🚀 Quickest Path to Java 21

### Option 1: Automated Installation (Windows PowerShell)
```powershell
# Navigate to project directory
cd C:\tradez\main

# Run the updated script (now configured for Java 21)
.\automate-bypass.ps1

# Verify installation
java -version
echo $env:JAVA_HOME
```

### Option 2: Manual Windows Installation
```powershell
# 1. Download OpenJDK 21 MSI
$url = "https://github.com/adoptium/temurin21-binaries/releases/latest/download/OpenJDK21U-jdk_x64_windows_hotspot.msi"
Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\OpenJDK21.msi"

# 2. Install
Start-Process msiexec.exe -Wait -ArgumentList "/i $env:TEMP\OpenJDK21.msi /qn /norestart"

# 3. Set JAVA_HOME
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-21.0.0.0-hotspot", "User")

# 4. Update PATH
$env:Path += ";C:\Program Files\Eclipse Adoptium\jdk-21.0.0.0-hotspot\bin"

# 5. Verify
java -version
```

### Option 3: Linux/WSL Installation
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y openjdk-21-jdk

# Verify
java -version
echo $JAVA_HOME
```

---

## ✅ Verification Commands

Run all three to confirm success:

```powershell
# 1. Check Java version (should show "21.x.x")
java -version

# 2. Check JAVA_HOME is set
echo $env:JAVA_HOME

# 3. Test with BFG (optional)
java -jar bfg-1.14.0.jar --version
```

**Expected Output:**
```
openjdk version "21.0.0" 2023-09-19 LTS
OpenJDK Runtime Environment (build 21.0.0+35-LTS)
OpenJDK 64-Bit Server VM (build 21.0.0+35-LTS, mixed mode, sharing)
```

---

## 📊 What's Changed

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| `automate-bypass.ps1` | Java 17 | Java 21 | ✅ Updated |
| `automate-bypass.sh` | Java 17 | Java 21 | ✅ Updated |
| Install URL | temurin17 | temurin21 | ✅ Updated |
| Installation Path | jdk-17.0.0.0 | jdk-21.0.0.0 | ✅ Updated |
| JAVA_HOME Support | ❌ Not Set | ✅ Configured | ✅ Added |
| Version Checking | ❌ None | ✅ Included | ✅ Added |

---

## 🔙 Need to Rollback?

```powershell
# Uninstall Java 21 and restore Java 17
Get-ChildItem 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall' |
  Where-Object {$_.GetValue('DisplayName') -like '*OpenJDK 21*'} |
  ForEach-Object { $_ }

# Then install Java 17 following the same steps with Java 17 URL
```

See `JAVA_21_LTS_UPGRADE.md` for detailed rollback procedures.

---

## 📚 Full Documentation

For complete details including:
- Security updates included in Java 21
- Performance improvements
- Backward compatibility matrix
- Troubleshooting guide
- Support duration and timeline

👉 **Read:** `JAVA_21_LTS_UPGRADE.md`

---

## ✅ Files Updated

1. ✅ `automate-bypass.ps1` - Windows PowerShell automation script
2. ✅ `automate-bypass.sh` - Linux/WSL Bash script
3. ✅ `JAVA_21_LTS_UPGRADE.md` - Complete documentation (NEW)
4. ✅ `JAVA_21_QUICK_START.md` - This file (NEW)

---

## 🎯 Next Steps

1. **Choose Installation Method** (Automated, Manual Windows, or Linux)
2. **Run Installation** (copy-paste one of the options above)
3. **Verify** (run the 3 verification commands)
4. **Confirm Success** (all commands should work without errors)

---

**All systems ready for Java 21 (LTS) deployment!**

For questions or issues, see the troubleshooting section in `JAVA_21_LTS_UPGRADE.md`.

