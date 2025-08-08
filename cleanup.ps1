# PowerShell 清理脚本 - 清理开发过程中产生的临时文件和缓存
Write-Host "开始清理项目中的临时文件和缓存..."

# 清理构建产物
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ 已删除 dist 目录"
}

# 清理依赖包（需要重新安装）
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ 已删除 node_modules 目录"
}

# 清理wrangler缓存
if (Test-Path ".wrangler") {
    Remove-Item -Recurse -Force ".wrangler"
    Write-Host "✅ 已删除 .wrangler 目录"
}

# 清理cloudflare缓存
if (Test-Path ".cloudflare") {
    Remove-Item -Recurse -Force ".cloudflare"
    Write-Host "✅ 已删除 .cloudflare 目录"
}

# 清理系统生成的临时文件
$tempFiles = @(".DS_Store", "Thumbs.db", "desktop.ini")
foreach ($file in $tempFiles) {
    if (Test-Path $file) {
        Remove-Item -Force $file
        Write-Host "✅ 已删除 $file"
    }
}

# 清理日志文件
$logFiles = Get-ChildItem -Name "*.log" -ErrorAction SilentlyContinue
foreach ($log in $logFiles) {
    Remove-Item -Force $log
    Write-Host "✅ 已删除 $log"
}

Write-Host "🎉 清理完成！"
Write-Host "如果需要重新安装依赖，请运行: npm install"