# Run from any directory. This launches the isolated client, never the web app.
$ErrorActionPreference = 'Stop'
$mcpRoot = Split-Path -Parent $PSScriptRoot
$mcpPython = Join-Path $mcpRoot 'backend\.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $mcpPython)) {
    throw 'Install the separate MCP environment first; see docs/MCP_SANDBOX.md.'
}
Push-Location -LiteralPath $mcpRoot
try {
    & $mcpPython -m backend.mcp_sastra.client @args
    if ($LASTEXITCODE -ne 0) { throw "MCP client exited with code $LASTEXITCODE" }
} finally {
    Pop-Location
}
