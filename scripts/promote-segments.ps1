# Promote segment dirs of split industries to top-level industry dirs; drop the old parent industry dir.
# e.g. industry/汽车/汽车玻璃/* -> industry/汽车玻璃/* ; archive industry/汽车/汽车/ -> industry/_archived/汽车/
# Pure-ASCII; Chinese names read from split-industries.json as UTF-8.
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::Combine($PSScriptRoot, '..', 'industry')
$jsonPath = [System.IO.Path]::Combine($PSScriptRoot, 'split-industries.json')
$archived = [System.IO.Path]::Combine($root, '_archived')

$mapping = Get-Content -Path $jsonPath -Encoding UTF8 -Raw | ConvertFrom-Json

foreach ($industry in $mapping.PSObject.Properties.Name) {
    $indDir = [System.IO.Path]::Combine($root, $industry)
    if (-not (Test-Path $indDir)) {
        Write-Host "[skip] industry missing: $industry"
        continue
    }
    $indObj = $mapping.$industry
    # 1) promote each segment dir to top-level
    foreach ($segment in $indObj.PSObject.Properties.Name) {
        $src = [System.IO.Path]::Combine($indDir, $segment)
        $dst = [System.IO.Path]::Combine($root, $segment)
        if (-not (Test-Path $src)) {
            Write-Host "[warn] segment not found: $industry/$segment"
            continue
        }
        if (Test-Path $dst) {
            Write-Host "[conflict] top-level segment already exists, skip: $segment"
            continue
        }
        Move-Item -Path $src -Destination $dst
        Write-Host "[promote] $industry/$segment -> /$segment"
    }
    # 2) archive the same-name overview dir (行业/行业/)
    $selfDir = [System.IO.Path]::Combine($indDir, $industry)
    if (Test-Path $selfDir) {
        if (-not (Test-Path $archived)) { New-Item -ItemType Directory -Path $archived | Out-Null }
        $arcDst = [System.IO.Path]::Combine($archived, $industry)
        Move-Item -Path $selfDir -Destination $arcDst
        Write-Host "[archive] $industry/$industry -> _archived/$industry"
    }
    # 3) remove the now-empty parent industry dir
    if (Test-Path $indDir) {
        $rest = Get-ChildItem -Path $indDir
        if ($rest.Count -eq 0) {
            Remove-Item -Path $indDir -Recurse -Force
            Write-Host "[drop] removed parent industry dir: $industry"
        }
        else {
            Write-Host "[keep] parent still has items: $industry ($($rest.Count))"
        }
    }
}

Write-Host "`nDone."
