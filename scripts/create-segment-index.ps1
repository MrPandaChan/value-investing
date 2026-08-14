# Rewrite industry/segment/segment/index.md to contain only the H1 title "# <segment>".
# Pure-ASCII driver; Chinese names from split-industries.json (read UTF-8).
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::Combine($PSScriptRoot, '..', 'industry')
$jsonPath = [System.IO.Path]::Combine($PSScriptRoot, 'split-industries.json')

$mapping = Get-Content -Path $jsonPath -Encoding UTF8 -Raw | ConvertFrom-Json
$enc = [System.Text.UTF8Encoding]::new($false)

foreach ($industry in $mapping.PSObject.Properties.Name) {
    $indObj = $mapping.$industry
    foreach ($segment in $indObj.PSObject.Properties.Name) {
        $segDir = [System.IO.Path]::Combine($root, $segment, $segment)
        if (-not (Test-Path $segDir)) {
            New-Item -ItemType Directory -Path $segDir | Out-Null
        }
        $idx = [System.IO.Path]::Combine($segDir, 'index.md')
        $content = "# $segment`n"
        [System.IO.File]::WriteAllText($idx, $content, $enc)
        Write-Host "[write] $segment/$segment/index.md"
    }
}

Write-Host "`nDone."
