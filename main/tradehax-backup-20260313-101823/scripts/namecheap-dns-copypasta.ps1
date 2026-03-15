#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [ValidateSet("print", "verify", "api")]
    [string]$Command = "print",
    [string]$Domain = $(if ($env:DOMAIN) { $env:DOMAIN } else { "tradehax.net" }),
    [string]$Target = $(if ($env:TARGET) { $env:TARGET } else { "cname.vercel-dns.com" }),
    [string]$Ttl = $(if ($env:TTL) { $env:TTL } else { "Automatic" })
)

$ErrorActionPreference = "Stop"

function Show-Records {
@"
Namecheap Advanced DNS - copy/paste these values

Delete existing records for host '@' and 'www' first.

Record 1
  Type : A
  Host : @
  Value: 76.76.21.21
  TTL  : $Ttl

Record 2
  Type : CNAME
  Host : www
  Value: $Target
  TTL  : $Ttl

After saving, run:
  .\namecheap-dns-copypasta.ps1 -Command verify
"@
}

function Verify-Dns {
    # Accept both direct CNAME target and Vercel apex flattening IP.
    $acceptedApexIps = @("76.76.21.21")

    $apexAnswers = @()
    $wwwAnswers = @()

    try {
        $apexAnswers += Resolve-DnsName -Name $Domain -Type CNAME -ErrorAction Stop | Select-Object -ExpandProperty NameHost
    } catch {}

    if ($apexAnswers.Count -eq 0) {
        try {
            $apexAnswers += Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop | Select-Object -ExpandProperty IPAddress
        } catch {}
    }

    $wwwDomain = "www.$Domain"
    try {
        $wwwAnswers += Resolve-DnsName -Name $wwwDomain -Type CNAME -ErrorAction Stop | Select-Object -ExpandProperty NameHost
    } catch {}

    if ($wwwAnswers.Count -eq 0) {
        try {
            $wwwAnswers += Resolve-DnsName -Name $wwwDomain -Type A -ErrorAction Stop | Select-Object -ExpandProperty IPAddress
        } catch {}
    }

    Write-Output "DNS lookup for ${Domain}:"
    if ($apexAnswers.Count -eq 0) {
        Write-Output "No DNS answer returned."
    } else {
        $apexAnswers | ForEach-Object { Write-Output $_ }
    }
    Write-Output ""

    Write-Output "DNS lookup for ${wwwDomain}:"
    if ($wwwAnswers.Count -eq 0) {
        Write-Output "No DNS answer returned."
    } else {
        $wwwAnswers | ForEach-Object { Write-Output $_ }
    }
    Write-Output ""

    $apexText = ($apexAnswers -join "`n")
    $wwwText = ($wwwAnswers -join "`n")

    $apexOk = $false
    if ($apexText -match [regex]::Escape($Target)) {
        $apexOk = $true
    } else {
        foreach ($ip in $acceptedApexIps) {
            if ($apexText -match [regex]::Escape($ip)) {
                $apexOk = $true
                break
            }
        }
    }

    $wwwOk = $wwwText -match [regex]::Escape($Target)

    if ($apexOk -and $wwwOk) {
        Write-Output "OK: $Domain and $wwwDomain appear correctly pointed for Vercel."
        return
    }

    if (-not $apexOk) {
        Write-Output "WARN: $Domain does not appear to point to $Target or accepted Vercel apex IP(s): $($acceptedApexIps -join ', ')."
    }

    if (-not $wwwOk) {
        Write-Output "WARN: $wwwDomain does not appear to point to $Target yet."
    }

    Write-Output "Propagation may take a few minutes."
}

function Set-HostsViaApi {
    $required = @("NAMECHEAP_API_USER", "NAMECHEAP_API_KEY", "NAMECHEAP_USERNAME", "NAMECHEAP_CLIENT_IP")
    foreach ($name in $required) {
        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
            throw "Missing required env var: $name"
        }
    }

    $parts = $Domain.Split('.')
    if ($parts.Length -lt 2) {
        throw "Invalid domain format: $Domain"
    }

    $tld = $parts[-1]
    $sld = ($parts[0..($parts.Length - 2)] -join '.')

    $query = @{
        ApiUser = [Environment]::GetEnvironmentVariable("NAMECHEAP_API_USER")
        ApiKey = [Environment]::GetEnvironmentVariable("NAMECHEAP_API_KEY")
        UserName = [Environment]::GetEnvironmentVariable("NAMECHEAP_USERNAME")
        ClientIp = [Environment]::GetEnvironmentVariable("NAMECHEAP_CLIENT_IP")
        Command = "namecheap.domains.dns.setHosts"
        SLD = $sld
        TLD = $tld
        HostName1 = "@"
        RecordType1 = "A"
        Address1 = "76.76.21.21"
        TTL1 = "60"
        HostName2 = "www"
        RecordType2 = "CNAME"
        Address2 = $Target
        TTL2 = "60"
    }

    $pairs = $query.GetEnumerator() | ForEach-Object {
        "{0}={1}" -f [uri]::EscapeDataString($_.Key), [uri]::EscapeDataString([string]$_.Value)
    }
    $uri = "https://api.namecheap.com/xml.response?" + ($pairs -join "&")

    Write-Output "Calling Namecheap API to set hosts for $Domain..."
    $resp = Invoke-WebRequest -Uri $uri -Method Get -UseBasicParsing
    if ($resp.Content -match 'Status="OK"') {
        Write-Output "OK: DNS records submitted via Namecheap API."
    } else {
        Write-Error "API call did not return OK."
        Write-Output $resp.Content
        exit 1
    }
}

switch ($Command) {
    "print" { Show-Records }
    "verify" { Verify-Dns }
    "api" { Set-HostsViaApi }
}
