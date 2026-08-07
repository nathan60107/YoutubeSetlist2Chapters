<#
.SYNOPSIS
    以 Firefox 隱私視窗分批開啟測試影片，供人工目測章節標記。

.DESCRIPTION
    影片清單由 test/list-by-outcome.ts 產生（full / partial / failed 三類），快取在暫存目錄，
    parser 改動後會自動重新產生。分頁會集中在同一個隱私視窗，不寫入瀏覽紀錄、不帶登入狀態。

    進度依分類各自記錄，所以可以重複執行同一行指令，一批一批往下看。

    注意：本檔必須存成 UTF-8 with BOM。Windows PowerShell 5.1 讀無 BOM 的 .ps1 會當成 ANSI
    解讀，中文註解會讓後半段被靜默截斷（沒輸出、沒錯誤、exit code 0）。

.PARAMETER Outcome
    要看哪一類影片：full（完整解析）/ partial（部分解析）/ failed（完全失敗）。

.EXAMPLE
    .\open-test-tabs.ps1                        # full 的下一批 10 部
    .\open-test-tabs.ps1 -Outcome failed -All   # 一次開完所有完全失敗的
    .\open-test-tabs.ps1 -Outcome partial -List # 只列出，不開瀏覽器
    .\open-test-tabs.ps1 -Reset                 # 進度歸零
    .\open-test-tabs.ps1 -Ids 'dQw4w9WgXcQ'     # 指定影片（全部開），不動進度
#>
[CmdletBinding()]
param(
    [ValidateSet('full', 'partial', 'failed')]
    [string]   $Outcome = 'full',
    [int]      $Count   = 10,
    [int]      $Skip    = -1,     # -1 = 沿用進度記錄
    [switch]   $All,              # 忽略 Count，一次開完
    [string[]] $Ids,              # 指定影片，跳過清單產生；不另給 -Count 就全部開
    [int]      $Delay   = 1000,   # 每個分頁之間的間隔（毫秒），太短會漏開
    [switch]   $Refresh,          # 強制重新產生清單
    [switch]   $Reset,
    [switch]   $List
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path $PSScriptRoot -Parent
$cacheDir = Join-Path $env:TEMP 'ys2c-manual-test'
if (-not (Test-Path $cacheDir)) { New-Item -ItemType Directory -Path $cacheDir | Out-Null }

$progressFile = Join-Path $cacheDir "$Outcome.progress"
if ($Reset) {
    if (Test-Path $progressFile) { Remove-Item $progressFile -Force }
    Write-Host "$Outcome 的進度已歸零。" -ForegroundColor Yellow
    if (-not $PSBoundParameters.ContainsKey('Count')) { return }
}

$firefox = "$env:LOCALAPPDATA\Mozilla Firefox\firefox.exe"
if (-not (Test-Path $firefox)) { throw "找不到 firefox.exe：$firefox" }

# --- 取得影片清單 ---------------------------------------------------------
# 變數不能叫 $all：PowerShell 變數名不分大小寫，會跟 switch 參數 $All 撞在一起。

if ($Ids) {
    $videoIds = $Ids
}
else {
    $idFile = Join-Path $cacheDir "$Outcome-ids.txt"

    # 快取比 parser 或期望值舊就重產，避免拿到過期清單
    $sources = @(
        (Join-Path $repoRoot 'src\chapterParser.ts'),
        (Join-Path $repoRoot 'src\commentFinder.ts'),
        (Join-Path $repoRoot 'test\_analysis.json')
    ) | Where-Object { Test-Path $_ }
    $newestSource = ($sources | ForEach-Object { (Get-Item $_).LastWriteTime } | Measure-Object -Maximum).Maximum

    $stale = $Refresh -or
             -not (Test-Path $idFile) -or
             ((Get-Item $idFile).LastWriteTime -lt $newestSource)

    if ($stale) {
        Write-Host "產生 $Outcome 清單中（跑一次 parser）..." -ForegroundColor DarkGray
        Push-Location $repoRoot
        try {
            $produced = & npm run --silent node-ts -- ./test/list-by-outcome.ts $Outcome --ids
        }
        finally { Pop-Location }
        if (-not $produced) { throw "list-by-outcome.ts 沒有輸出任何 ID（分類：$Outcome）" }
        Set-Content $idFile ($produced -join "`n") -Encoding utf8
    }

    $videoIds = Get-Content $idFile | Where-Object { $_.Trim() -ne '' }
}

if (-not $videoIds) { Write-Warning "沒有任何影片可開啟（分類：$Outcome）"; return }

# --- 決定這批的範圍 -------------------------------------------------------

# 有給 -Skip 或 -Ids 就不碰進度記錄
$useProgress = ($Skip -lt 0) -and -not $Ids
if ($useProgress -and (Test-Path $progressFile)) {
    $Skip = [int](Get-Content $progressFile -Raw).Trim()
}
if ($Skip -lt 0) { $Skip = 0 }

if ($Skip -ge $videoIds.Count) {
    Write-Host "$Outcome 的 $($videoIds.Count) 部都看完了。要重來請加 -Reset" -ForegroundColor Yellow
    return
}

# -Ids 是指名道姓要看哪幾部，分批沒有意義，所以預設全開；真要分批就明寫 -Count。
$takeAll = $All -or ($Ids -and -not $PSBoundParameters.ContainsKey('Count'))
$take  = if ($takeAll) { $videoIds.Count } else { $Count }
$batch = $videoIds | Select-Object -Skip $Skip -First $take
$to    = $Skip + $batch.Count

Write-Host "$Outcome 共 $($videoIds.Count) 部，本批為第 $($Skip + 1)~$to 部" -ForegroundColor Cyan

if ($List) {
    $i = $Skip
    foreach ($id in $batch) { $i++; "  [{0,3}] https://www.youtube.com/watch?v={1}" -f $i, $id }
    return
}

# --- 開分頁 ---------------------------------------------------------------

$n = 0
foreach ($id in $batch) {
    $n++
    # 每次只傳「一個」網址：Firefox 會把它加進既有的隱私視窗當新分頁。
    # 用 "a|b|c" 串接是無效的，會被當成單一無效網址而什麼都不開。
    & $firefox -private-window "https://www.youtube.com/watch?v=$id"
    Write-Host ("  [{0,3}/{1}] {2}" -f ($Skip + $n), $videoIds.Count, $id)
    if ($n -lt $batch.Count) { Start-Sleep -Milliseconds $Delay }
}

if ($useProgress) {
    Set-Content $progressFile $to -Encoding utf8
    Write-Host "完成。進度已記錄，$Outcome 還剩 $($videoIds.Count - $to) 部。" -ForegroundColor Green
}
else {
    Write-Host '完成。（未更動進度記錄）' -ForegroundColor Green
}
