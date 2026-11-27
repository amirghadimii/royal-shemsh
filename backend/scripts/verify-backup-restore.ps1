param(
  [string]$Container = "royalshemsh-postgres",
  [string]$DbUser = "royalshemsh",
  [string]$ScratchDb = "royalshemsh_restore_test"
)

$ErrorActionPreference = "Stop"

$backupOutput = & "$PSScriptRoot\backup-staging.ps1" -Container $Container -DbUser $DbUser
$backupLine = ($backupOutput | Where-Object { $_ -like "BACKUP_OK:*" } | Select-Object -Last 1)
if (-not $backupLine) {
  throw "Backup did not report BACKUP_OK"
}
$backupFile = ($backupLine -replace "^BACKUP_OK:", "") -replace " \(\d+ bytes\)$", ""
Write-Output $backupLine

docker exec $Container psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $ScratchDb;" | Out-Null
docker exec $Container psql -U $DbUser -d postgres -c "CREATE DATABASE $ScratchDb;" | Out-Null

Get-Content -Raw -Encoding utf8 $backupFile | docker exec -i $Container psql -U $DbUser -d $ScratchDb -v ON_ERROR_STOP=1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Restore into $ScratchDb failed"
}

$usersCount = (docker exec $Container psql -U $DbUser -d $ScratchDb -t -A -c "SELECT count(*) FROM users;").Trim()
$ordersCount = (docker exec $Container psql -U $DbUser -d $ScratchDb -t -A -c "SELECT count(*) FROM orders;").Trim()
$ledgerCount = (docker exec $Container psql -U $DbUser -d $ScratchDb -t -A -c "SELECT count(*) FROM ledger_entries;").Trim()

docker exec $Container psql -U $DbUser -d postgres -c "DROP DATABASE IF EXISTS $ScratchDb;" | Out-Null

if ([int]$usersCount -lt 1) {
  throw "Restored database has 0 users"
}

Write-Output "RESTORE_OK:scratchDb=$ScratchDb users=$usersCount orders=$ordersCount ledger_entries=$ledgerCount backup=$backupFile"
