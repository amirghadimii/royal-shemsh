param(
  [string]$Container = "royalshemsh-postgres",
  [string]$DbUser = "royalshemsh",
  [string]$DbName = "royalshemsh_staging"
)

$ErrorActionPreference = "Stop"
$backupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $backupDir)) {
  New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $backupDir "${DbName}_${timestamp}.sql"

docker exec $Container pg_dump -U $DbUser -d $DbName -F p --no-owner --no-acl | Out-File -FilePath $backupFile -Encoding utf8
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed with exit code $LASTEXITCODE"
}

$size = (Get-Item $backupFile).Length
if ($size -lt 1024) {
  throw "Backup file unexpectedly small ($size bytes): $backupFile"
}

Write-Output "BACKUP_OK:$backupFile ($size bytes)"
