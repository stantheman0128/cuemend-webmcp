param(
    [string]$ScenesPath = 'docs\demo-scenes.json',
    [string]$OutputDir = 'artifacts\demo'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$audioScript = Join-Path $PSScriptRoot 'generate-demo-audio.ps1'
$renderScript = Join-Path $PSScriptRoot 'render-demo-video.mjs'

& powershell -NoProfile -ExecutionPolicy Bypass -File $audioScript -ScenesPath $ScenesPath -OutputDir $OutputDir
if ($LASTEXITCODE -ne 0) {
    throw "Demo narration generation failed with exit code $LASTEXITCODE."
}

& node $renderScript --timing (Join-Path $OutputDir 'scene-timing.json') --output-dir $OutputDir
if ($LASTEXITCODE -ne 0) {
    throw "Demo video rendering failed with exit code $LASTEXITCODE."
}

Write-Output ("CueMend demo package is ready in {0}" -f (Join-Path $repoRoot $OutputDir))
