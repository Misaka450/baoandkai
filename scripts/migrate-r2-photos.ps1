# R2 照片整理脚本
# 将 images/ 文件夹中的照片移动到 map/ 文件夹

$ErrorActionPreference = "Stop"

# 定义要移动的文件列表
$filesToMove = @(
    "images/1754966207329_28qfhi.jpg",
    "images/1754966211087_zyuks8.jpg",
    "images/1754966229504_my3he6.jpg",
    "images/1754966233294_52616f.jpg",
    "images/1754966268014_phz42l.jpg",
    "images/1754966566437_dlfqun.jpg",
    "images/1771036441891_0ws8qx.jpg",
    "images/1771036480878_yh6tao.jpg"
)

$bucketName = "our"
$tempDir = "$env:TEMP\r2_migrate_$PID"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "R2 照片整理脚本" -ForegroundColor Cyan
Write-Host "将 images/ 移动到 map/" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建临时目录
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

$successCount = 0
$failCount = 0

foreach ($sourceKey in $filesToMove) {
    $fileName = Split-Path $sourceKey -Leaf
    $destKey = "map/$fileName"
    $tempFile = "$tempDir\$fileName"

    Write-Host "处理: $sourceKey" -ForegroundColor Yellow

    try {
        # 1. 下载文件（使用 --remote 操作真实 R2）
        Write-Host "  下载..." -NoNewline
        $downloadCmd = "wrangler r2 object get $bucketName/$sourceKey --file $tempFile --remote"
        Invoke-Expression $downloadCmd 2>$null
        if (-not (Test-Path $tempFile)) {
            throw "下载失败"
        }
        Write-Host " 完成" -ForegroundColor Green

        # 2. 上传到新位置
        Write-Host "  上传到 map/..." -NoNewline
        $uploadCmd = "wrangler r2 object put $bucketName/$destKey --file $tempFile --content-type image/jpeg --remote"
        Invoke-Expression $uploadCmd 2>$null
        Write-Host " 完成" -ForegroundColor Green

        # 3. 删除原文件
        Write-Host "  删除原文件..." -NoNewline
        $deleteCmd = "wrangler r2 object delete $bucketName/$sourceKey --remote"
        Invoke-Expression $deleteCmd 2>$null
        Write-Host " 完成" -ForegroundColor Green

        # 4. 清理临时文件
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue

        $successCount++
        Write-Host "  成功移动: $fileName" -ForegroundColor Green
    }
    catch {
        $failCount++
        Write-Host "  失败: $_" -ForegroundColor Red
    }

    Write-Host ""
}

# 清理临时目录
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "处理完成" -ForegroundColor Cyan
Write-Host "成功: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "失败: $failCount" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
}
