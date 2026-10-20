$ErrorActionPreference = 'Stop'
$clinicRuntime = Join-Path $PSScriptRoot 'node.exe'
if (-not (Test-Path -LiteralPath $clinicRuntime)) { throw 'Extract the complete clinic package before enabling Wi-Fi access.' }
$clinicPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $clinicPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    $clinicArguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $PSCommandPath
    $clinicElevated = Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -ArgumentList $clinicArguments -Wait -PassThru
    if ($clinicElevated.ExitCode -ne 0) { throw 'Firewall setup did not complete. Run this helper as administrator from the extracted clinic folder.' }
    Write-Host 'Clinic firewall setup completed. Keep your trusted clinic Wi-Fi profile set to Private.'
    exit
}
$clinicRuleName = 'Nasrullah Clinic Offline - Private WiFi'
Get-NetFirewallRule -DisplayName $clinicRuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $clinicRuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4317 -Program $clinicRuntime -RemoteAddress LocalSubnet -Profile Private | Out-Null
Write-Host 'Clinic access enabled for devices on the same private network, port 4317.'
Write-Host 'Set your trusted clinic Wi-Fi network profile to Private in Windows Settings.'
Write-Host 'Run Start Clinic.cmd, then enter its phone address in the mobile browsers.'
