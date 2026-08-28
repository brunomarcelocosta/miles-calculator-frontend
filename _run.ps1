# Wrapper de execucao: o terminal desta sessao embaralha comandos longos e
# escreve log em UTF-16, então cada passo roda daqui e grava saida em UTF-8.
param([Parameter(Mandatory = $true)][string]$Step)

$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
Set-Location $root

$log = Join-Path $root "_$Step.log"

$commands = @{
    'install'   = @('install', '--no-audit', '--no-fund')
    'lint'      = @('run', 'lint')
    'test'      = @('run', 'test')
    'build'     = @('run', 'build')
    'typecheck' = @('exec', '--', 'tsc', '-b', '--pretty', 'false')
}

if (-not $commands.ContainsKey($Step)) {
    "Passo desconhecido: $Step" | Out-File -FilePath $log -Encoding utf8
    exit 1
}

$output = & npm.cmd @($commands[$Step]) 2>&1
$code = $LASTEXITCODE

$lines = @("== npm $($commands[$Step] -join ' ') ==", "exit=$code", '')
$lines += ($output | ForEach-Object { "$_" })
[System.IO.File]::WriteAllLines($log, $lines, [System.Text.Encoding]::UTF8)
exit $code
