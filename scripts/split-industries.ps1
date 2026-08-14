# Split Tier-1 industry dirs into segment dirs and move companies under their segment.
# Pure-ASCII script; Chinese names come from split-industries.json (read as UTF-8).
$ErrorActionPreference = 'Stop'
$root = Join-Path (Join-Path $PSScriptRoot '..') 'industry'
$jsonPath = Join-Path $PSScriptRoot 'split-industries.json'

$mapping = Get-Content -Path $jsonPath -Encoding UTF8 -Raw | ConvertFrom-Json

foreach ($industry in $mapping.PSObject.Properties.Name) {
    $indDir = Join-Path $root $industry
    if (-not (Test-Path $indDir)) {
        Write-Host "[skip] industry missing: $industry"
        continue
    }
    $indObj = $mapping.$industry
    foreach ($segment in $indObj.PSObject.Properties.Name) {
        $segDir = Join-Path $indDir $segment
        if (-not (Test-Path $segDir)) {
            New-Item -ItemType Directory -Path $segDir | Out-Null
            Write-Host "[new] $industry/$segment"
        }
        $companies = $indObj.$segment
        foreach ($company in $companies) {
            $src = Join-Path $indDir $company
            $dst = Join-Path $segDir $company
            if (-not (Test-Path $src)) {
                if (Test-Path $dst) {
                    Write-Host "[ok] $industry/$segment/$company"
                    continue
                }
                Write-Host "[warn] company dir not found: $industry/$company"
                continue
            }
            if (Test-Path $dst) {
                Write-Host "[conflict] target exists, skip move: $industry/$segment/$company"
                continue
            }
            Move-Item -Path $src -Destination $dst
            Write-Host "[move] $industry/$company -> $industry/$segment/$company"
        }
    }
    $selfDir = Join-Path $indDir $industry
    if (Test-Path $selfDir) {
        $files = Get-ChildItem -Path $selfDir -Recurse -File -ErrorAction SilentlyContinue
        if ($files.Count -eq 0) {
            Remove-Item -Path $selfDir -Recurse -Force
            Write-Host "[clean] removed empty placeholder: $industry/$industry"
        }
        else {
            Write-Host "[keep] placeholder not empty, kept: $industry/$industry ($($files.Count) files)"
        }
    }
}

Write-Host "`nDone."
