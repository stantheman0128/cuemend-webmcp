param(
    [string]$ScenesPath = 'docs\demo-scenes.json',
    [string]$OutputDir = 'artifacts\demo',
    [string]$Voice = 'Microsoft Zira Desktop',
    [ValidateRange(-10, 10)][int]$Rate = -1,
    [ValidateRange(0.1, 3.0)][double]$PauseSeconds = 0.65
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedScenesPath = [IO.Path]::GetFullPath((Join-Path $repoRoot $ScenesPath))
$resolvedOutputDir = [IO.Path]::GetFullPath((Join-Path $repoRoot $OutputDir))

if (-not (Test-Path -LiteralPath $resolvedScenesPath -PathType Leaf)) {
    throw "Demo scenes not found: $resolvedScenesPath"
}
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw 'ffmpeg is required but was not found on PATH.'
}
if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
    throw 'ffprobe is required but was not found on PATH.'
}

New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
$parsedScenes = Get-Content -LiteralPath $resolvedScenesPath -Raw -Encoding UTF8 | ConvertFrom-Json
$scenes = @($parsedScenes)
if ($scenes.Count -eq 0) {
    throw 'Demo scene list is empty.'
}
if (@($scenes | Select-Object -ExpandProperty id -Unique).Count -ne $scenes.Count) {
    throw 'Demo scene ids must be unique.'
}

Add-Type -AssemblyName System.Speech
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$availableVoices = @($synthesizer.GetInstalledVoices() | Where-Object Enabled | ForEach-Object { $_.VoiceInfo.Name })
if ($Voice -notin $availableVoices) {
    throw "Requested voice is unavailable: $Voice"
}
$synthesizer.SelectVoice($Voice)
$synthesizer.Rate = $Rate
$synthesizer.Volume = 100

$timedScenes = @()
try {
    foreach ($scene in $scenes) {
        if ($scene.id -is [Array] -or $scene.image -is [Array] -or $scene.narration -is [Array]) {
            throw 'A demo scene contains array-valued scalar fields. Check top-level JSON parsing.'
        }
        if ($scene.id -notmatch '^[a-zA-Z0-9-]+$') {
            throw "Unsafe scene id: $($scene.id)"
        }
        $wavePath = Join-Path $resolvedOutputDir ("{0}.wav" -f $scene.id)
        $synthesizer.SetOutputToWaveFile($wavePath)
        $synthesizer.Speak([string]$scene.narration)
        $synthesizer.SetOutputToNull()
        $spokenSeconds = [double]((& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $wavePath).Trim())
        if ($spokenSeconds -le 0) {
            throw "ffprobe returned an invalid duration for $wavePath"
        }
        $timedScenes += [ordered]@{
            id = [string]$scene.id
            image = [string]$scene.image
            crop = [string]$scene.crop
            overlay = [string]$scene.overlay
            title = [string]$scene.title
            subtitle = [string]$scene.subtitle
            narration = [string]$scene.narration
            audio = $wavePath
            spokenSeconds = [Math]::Round($spokenSeconds, 3)
            durationSeconds = [Math]::Round($spokenSeconds + $PauseSeconds, 3)
        }
    }
} finally {
    $synthesizer.Dispose()
}

$ffmpegArguments = @('-hide_banner', '-loglevel', 'error', '-y')
foreach ($scene in $timedScenes) {
    $ffmpegArguments += @('-i', $scene.audio)
}
$filters = @()
$labels = ''
for ($index = 0; $index -lt $timedScenes.Count; $index++) {
    $duration = $timedScenes[$index].durationSeconds.ToString('0.000', [Globalization.CultureInfo]::InvariantCulture)
    $pause = $PauseSeconds.ToString('0.000', [Globalization.CultureInfo]::InvariantCulture)
    $filters += "[$($index):a]apad=pad_dur=$pause,atrim=duration=$duration[a$index]"
    $labels += "[a$index]"
}
$filters += "${labels}concat=n=$($timedScenes.Count):v=0:a=1[outa]"
$narrationPath = Join-Path $resolvedOutputDir 'cuemend-narration.wav'
$ffmpegArguments += @('-filter_complex', ($filters -join ';'), '-map', '[outa]', '-c:a', 'pcm_s16le', $narrationPath)
& ffmpeg @ffmpegArguments
if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg audio concatenation failed with exit code $LASTEXITCODE."
}

$totalSeconds = [double]((& ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $narrationPath).Trim())
$timing = [ordered]@{
    voice = $Voice
    rate = $Rate
    pauseSeconds = $PauseSeconds
    totalSeconds = [Math]::Round($totalSeconds, 3)
    narration = $narrationPath
    scenes = $timedScenes
}
$timingPath = Join-Path $resolvedOutputDir 'scene-timing.json'
$timingJson = $timing | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText($timingPath, $timingJson + [Environment]::NewLine, (New-Object Text.UTF8Encoding($false)))
Write-Output ("Narration ready: {0:N3}s · {1}" -f $totalSeconds, $narrationPath)
Write-Output "Scene timing: $timingPath"
