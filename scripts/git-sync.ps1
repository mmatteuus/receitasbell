# Script para sincronização automática do Git a cada 5 minutos
# Desenvolvido por Antigravity

$interval = 300 # 5 minutos em segundos
$logFile = "IMPLANTAR/git-sync.log"

Write-Host "Iniciando sincronização automática do Git (intervalo: $interval segundos)..."
"$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Sincronização iniciada" | Out-File $logFile -Append

while ($true) {
    try {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Executando git pull --rebase..."
        git pull --rebase origin main 2>&1 | Out-File $logFile -Append
        
        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Executando git push..."
        git push origin main 2>&1 | Out-File $logFile -Append
        
        # Atualiza o timestamp no HEARTBEAT.json para indicar que a sincronização automática está rodando
        $heartbeatPath = "IMPLANTAR/HEARTBEAT.json"
        if (Test-Path $heartbeatPath) {
            $hb = Get-Content $heartbeatPath | ConvertFrom-Json
            $hb.last_actor = "git-sync-script"
            $hb.last_seen_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            $hb | ConvertTo-Json | Out-File $heartbeatPath
        }

        Write-Host "$(Get-Date -Format 'HH:mm:ss') - Sincronização concluída. Próxima em 5 minutos."
    }
    catch {
        Write-Error "Erro durante a sincronização: $_"
        "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - ERRO: $_" | Out-File $logFile -Append
    }
    
    Start-Sleep -Seconds $interval
}
