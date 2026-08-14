# Restore the <industry>/<industry>/ nested dir: move industry-level files and notes/ back down.
# Keeps segment dirs and company dirs at the industry root (they are the segmented materials).
# Pure-ASCII: no Chinese literals.
$ErrorActionPreference = 'Stop'
$root = Join-Path (Join-Path $PSScriptRoot '..') 'industry'

foreach ($indDir in (Get-ChildItem -Path $root -Directory)) {
    $industry = $indDir.Name
    $selfDir = Join-Path $indDir.FullName $industry
    if (-not (Test-Path $selfDir)) {
        New-Item -ItemType Directory -Path $selfDir | Out-Null
    }
    # Move all top-level files (industry overview) into selfDir
    foreach ($file in (Get-ChildItem -Path $indDir.FullName -File)) {
        $dst = Join-Path $selfDir $file.Name
        if (Test-Path $dst) {
            Write-Host "[conflict] skip file: $industry/$($file.Name)"
            continue
        }
        Move-Item -Path $file.FullName -Destination $dst
        Write-Host "[restore] $industry/$($file.Name) -> $industry/$industry/$($file.Name)"
    }
    # Move overview subdirs (e.g. notes) if present at root
    foreach ($sub in (Get-ChildItem -Path $indDir.FullName -Directory)) {
        if ($sub.Name -eq $industry) { continue }
        # Only move known overview subdirs; segment/company dirs stay.
        # Here we move a 'notes' dir when it sits at the industry root.
        if ($sub.Name -eq 'notes') {
            $dst = Join-Path $selfDir $sub.Name
            if (Test-Path $dst) {
                Write-Host "[conflict] skip dir: $industry/notes"
                continue
            }
            Move-Item -Path $sub.FullName -Destination $dst
            Write-Host "[restore] $industry/notes -> $industry/$industry/notes"
        }
    }
}

Write-Host "`nDone."
