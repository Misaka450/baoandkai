# PowerShell登录修复脚本
Write-Host "🚀 开始修复登录问题..." -ForegroundColor Green

# 检查wrangler是否安装
if (!(Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "❌ wrangler未安装，正在安装..." -ForegroundColor Red
    npm install -g wrangler
}

Write-Host "`n[1/4] 检查D1数据库..." -ForegroundColor Yellow
# 使用正确的数据库名称 oursql
$databaseList = npx wrangler d1 list 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 无法连接D1数据库，请先运行: npx wrangler login" -ForegroundColor Red
    Write-Host "然后手动复制浏览器中的URL进行授权" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "`n[2/4] 检查baobao用户..." -ForegroundColor Yellow
# 使用正确的数据库名称 oursql
$user = npx wrangler d1 execute oursql --command "SELECT username, password_hash FROM users WHERE username='baobao'" 2>$null
if ($user -match "baobao") {
    Write-Host "✅ 找到baobao用户" -ForegroundColor Green
    Write-Host "当前密码哈希: $($user -replace '.*baobao\\s*\\|\\s*', '')"
} else {
    Write-Host "❌ 未找到baobao用户，正在创建..." -ForegroundColor Red
}

Write-Host "`n[3/4] 创建/更新baobao用户..." -ForegroundColor Yellow
# 使用正确的数据库名称 oursql
$result = npx wrangler d1 execute oursql --command @"
INSERT OR REPLACE INTO users (username, password_hash, email, couple_name1, couple_name2, anniversary_date)
VALUES ('baobao', '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'baobao@example.com', '包包', '恺恺', '2023-10-08')
"@ 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 用户创建/更新成功" -ForegroundColor Green
} else {
    Write-Host "❌ 操作失败，请检查数据库连接" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "`n[4/4] 验证结果..." -ForegroundColor Yellow
# 使用正确的数据库名称 oursql
$verify = npx wrangler d1 execute oursql --command "SELECT username, password_hash FROM users WHERE username='baobao'" 2>$null
Write-Host "验证结果:"
Write-Host $verify

Write-Host "`n✅ 修复完成！" -ForegroundColor Green
Write-Host "现在可以用以下信息登录：" -ForegroundColor Green
Write-Host "用户名: baobao" -ForegroundColor Cyan
Write-Host "密码: baobao123" -ForegroundColor Cyan
Write-Host "测试地址: https://baoandkai.pages.dev/simple-test.html" -ForegroundColor Cyan

pause