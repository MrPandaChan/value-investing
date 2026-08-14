# Move industry-level overview content from <industry>/<industry>/ up to <industry>/, then remove the empty same-name placeholder.
# Pure-ASCII: detects same-name subdirs dynamically, no Chinese literals.
$ErrorActionPreference = 'Stop'
$root = Join-Path (Join-Path $PSScriptRoot '..') 'industry'

$indDirs = Get-ChildItem -Path $root -Directory
foreach ($indDir in $indDirs) {
    $industry = $indDir.Name
    $selfDir = Join-Path $indDir.FullName $industry
    if (-not (Test-Path $selfDir)) { continue }
    $items = Get-ChildItem -Path $selfDir
    foreach ($item in $items) {
        $dst = Join-Path $indDir.FullName $item.Name
        if (Test-Path $dst) {
            Write-Host "[conflict] target exists, skip: $industry/$($item.Name)"
            continue
        }
        Move-Item -Path $item.FullName -Destination $dst
        Write-Host "[move up] $industry/$industry/$($item.Name) -> $industry/$($item.Name)"
    }
    $leftover = Get-ChildItem -Path $selfDir
    if ($leftover.Count -eq 0) {
        Remove-Item -Path $selfDir -Recurse -Force
        Write-Host "[clean] removed placeholder: $industry/$industry"
    }
    else {
        Write-Host "[keep] placeholder still has items: $industry/$industry"
    }
}

Write-Host "`nDone."
