param(
    [string]$ChromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe',
    [string]$AppUrl = 'https://stantheman0128.github.io/cuemend-webmcp/',
    [string]$OutputDir = 'docs\verification',
    [ValidateSet('all', 'ordinary', 'webmcp')][string]$Mode = 'all'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$verifierPath = Join-Path $PSScriptRoot 'browser-verification.mjs'
$resolvedOutputDir = [IO.Path]::GetFullPath((Join-Path $repoRoot $OutputDir))

if (-not (Test-Path -LiteralPath $ChromePath -PathType Leaf)) {
    throw "Chrome executable not found: $ChromePath"
}
if (-not (Test-Path -LiteralPath $verifierPath -PathType Leaf)) {
    throw "Browser verifier not found: $verifierPath"
}

function Assert-PortAvailable {
    param([int]$Port)
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    if ($listener) {
        throw "TCP port $Port is already in use."
    }
}

function Stop-OwnedChrome {
    param([string]$ProfilePath)
    $owned = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
        Where-Object {
            $_.CommandLine -and
            $_.CommandLine.IndexOf($ProfilePath, [StringComparison]::OrdinalIgnoreCase) -ge 0
        }
    foreach ($process in $owned) {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-BrowserPass {
    param(
        [ValidateSet('ordinary', 'webmcp')][string]$Mode,
        [int]$Port,
        [int]$Runs = 1
    )

    Assert-PortAvailable -Port $Port
    $profilePath = Join-Path $env:TEMP ("cuemend-{0}-{1}" -f $Mode, [guid]::NewGuid().ToString('N'))
    $chromeArguments = @(
        '--headless=new',
        "--remote-debugging-port=$Port",
        "--user-data-dir=$profilePath",
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-sync',
        '--metrics-recording-only',
        '--force-device-scale-factor=1',
        '--window-size=1440,1000'
    )
    if ($Mode -eq 'webmcp') {
        $chromeArguments += '--enable-features=WebMCP'
    }
    $chromeArguments += $AppUrl

    Write-Output ("Starting isolated {0} pass on port {1}" -f $Mode, $Port)
    $chrome = Start-Process -FilePath $ChromePath -ArgumentList $chromeArguments -PassThru -WindowStyle Hidden
    try {
        & node $verifierPath `
            --mode $Mode `
            --runs $Runs `
            --endpoint "http://127.0.0.1:$Port" `
            --url $AppUrl `
            --output-dir $resolvedOutputDir
        if ($LASTEXITCODE -ne 0) {
            throw "The $Mode browser verification failed with exit code $LASTEXITCODE."
        }
    } finally {
        Stop-OwnedChrome -ProfilePath $profilePath
        if (-not $chrome.HasExited) {
            Stop-Process -Id $chrome.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Output ("Stopped isolated {0} browser; temporary profile remains at {1}" -f $Mode, $profilePath)
    }
}

New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
if ($Mode -in @('all', 'ordinary')) {
    Invoke-BrowserPass -Mode ordinary -Port 9225 -Runs 1
}
if ($Mode -in @('all', 'webmcp')) {
    Invoke-BrowserPass -Mode webmcp -Port 9226 -Runs 3
}
Write-Output "CueMend browser verification completed. Evidence: $resolvedOutputDir"
