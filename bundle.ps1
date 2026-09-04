#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Bundles the extension into a versioned .zip ready to upload to the
    Chrome Web Store.

.DESCRIPTION
    Reads the version from manifest.json, collects every file needed for the
    published extension (skipping repo/dev-only files), and writes
    government-stuff-new-tab-<version>.zip in the repo root, overwriting any
    previous bundle of the same version.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot

# --- Read the version from the manifest ---------------------------------
$manifestPath = Join-Path $root 'manifest.json'
if (-not (Test-Path $manifestPath)) {
    throw "manifest.json not found at $manifestPath"
}
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version
if ([string]::IsNullOrWhiteSpace($version)) {
    throw "No 'version' found in manifest.json"
}

$zipName = "government-stuff-new-tab-$version.zip"
$zipPath = Join-Path $root $zipName

# --- Things that never belong in the published bundle -------------------
# Top-level directory names to skip entirely.
$excludeDirs = @('.git', '.github', '.claude')
# Top-level file names to skip.
$excludeFiles = @('bundle.ps1', 'README.md', '.gitignore', 'test-government-officials.html')

# --- Collect the files --------------------------------------------------
$rootFull = (Resolve-Path $root).Path.TrimEnd('\', '/')

$files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($rootFull.Length).TrimStart('\', '/')
    $top = ($rel -split '[\\/]')[0]

    # Skip excluded directories (by their top-level segment)...
    if ($excludeDirs -contains $top) { return $false }
    # ...excluded top-level files...
    if (($rel -eq $top) -and ($excludeFiles -contains $top)) { return $false }
    # ...and any zip files (e.g. previous bundles).
    if ($_.Extension -ieq '.zip') { return $false }

    return $true
}

if (-not $files) {
    throw "No files found to bundle."
}

# --- Build the zip ------------------------------------------------------
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open(
    $zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $entryName = $file.FullName.Substring($rootFull.Length).TrimStart('\', '/').Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive, $file.FullName, $entryName,
            [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
}
finally {
    $archive.Dispose()
}

$sizeKb = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "Created $zipName ($($files.Count) files, $sizeKb KB)" -ForegroundColor Green
Write-Host "Ready to upload at $zipPath"
