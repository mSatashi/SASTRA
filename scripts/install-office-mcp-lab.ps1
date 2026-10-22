$ErrorActionPreference = 'Stop'
$taskRepo = Split-Path -Parent $PSScriptRoot
$taskLab = Join-Path (Split-Path -Parent $taskRepo) 'SASTRA-OFFICE-MCP-LAB'
$taskUpstream = Join-Path $taskLab 'upstream'
$taskRevision = 'cf210cb6581f33cf3ceb57cf1defff4fc58d050b'
$taskVenv = Join-Path $taskLab '.venv'
$taskPython = Join-Path $taskVenv 'Scripts/python.exe'

if ($env:K_SERVICE) { throw 'This evaluation installer is local-only.' }
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { throw 'Install uv first.' }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Install Git first.' }
New-Item -ItemType Directory -Path $taskLab -Force | Out-Null
if ((Get-Item -LiteralPath $taskLab).Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw 'The lab must not be a symlink or junction.'
}
if (-not (Test-Path -LiteralPath $taskUpstream)) {
    git clone https://github.com/gawirable/office-mcp.git $taskUpstream
    if ($LASTEXITCODE -ne 0) { throw 'Office MCP clone failed.' }
    git -C $taskUpstream checkout --detach $taskRevision
    if ($LASTEXITCODE -ne 0) { throw 'Could not select the reviewed upstream revision.' }
}
$taskHead = git -C $taskUpstream rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or $taskHead -ne $taskRevision) {
    throw 'Existing upstream checkout differs from the reviewed revision. No reset was performed.'
}
if (-not (Test-Path -LiteralPath $taskPython)) {
    uv venv --python 3.11 $taskVenv
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the separate virtual environment.' }
}
uv pip install --python $taskPython -e "${taskUpstream}[dev]"
if ($LASTEXITCODE -ne 0) { throw 'Office MCP dependency installation failed.' }
Write-Output "Installed Office MCP at $taskLab"
Write-Output 'SASTRA web dependencies and deployment configuration were not modified.'
