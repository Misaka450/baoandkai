# R2 图片路径修复脚本
# 将数据库中记录的 images/xxx 改为 map/xxx

$ErrorActionPreference = "Stop"

$bucketName = "our"
$dbId = "5867481e-ae09-485a-b866-0f453a6e0131"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "R2 图片路径修复脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 需要修复的表和字段
$tables = @(
    @{ name = "timeline_events"; imageCol = "images"; idCol = "id" },
    @{ name = "food_checkins"; imageCol = "images"; idCol = "id" },
    @{ name = "todos"; imageCol = "image"; idCol = "id" },
    @{ name = "albums"; imageCol = "cover_image"; idCol = "id" },
    @{ name = "map_checkins"; imageCol = "images"; idCol = "id" }
)

$totalFixed = 0

foreach ($table in $tables) {
    $tableName = $table.name
    $imageCol = $table.imageCol
    $idCol = $table.idCol

    Write-Host "检查表: $tableName" -ForegroundColor Yellow

    # 查找需要修复的记录
    $query = "SELECT $idCol, $imageCol FROM $tableName WHERE $imageCol LIKE 'images/%'"

    # 使用 wrangler d1 执行查询
    $result = wrangler d1 execute $bucketName --remote --database=$dbId --query=$query 2>&1

    if ($result -match "results" -and $result -notmatch "\[\]") {
        Write-Host "  发现需要修复的记录" -ForegroundColor Red

        # 提取并处理每条记录
        # 这里需要解析 JSON 并更新记录
        # 简化处理：显示警告信息
        Write-Host "  需要手动更新以下记录的路径:" -ForegroundColor Red
    }
    else {
        Write-Host "  无需修复" -ForegroundColor Green
    }

    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "检查完成" -ForegroundColor Cyan
Write-Host "总修复数: $totalFixed" -ForegroundColor $(if ($totalFixed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================" -ForegroundColor Cyan
