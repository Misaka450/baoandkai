@echo off
title 登录问题修复工具
color 0A
echo.
echo 🚀 开始修复登录问题...
echo.

REM 检查wrangler登录状态
echo [1/4] 检查wrangler登录状态...
npx wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ 请先登录wrangler
    echo 运行: npx wrangler login
    echo 然后复制浏览器中的URL完成授权
    pause
    exit /b 1
)

echo ✅ wrangler已登录
echo.

REM 检查数据库连接
echo [2/4] 检查数据库连接...
npx wrangler d1 list >nul 2>&1
if errorlevel 1 (
    echo ❌ 无法连接D1数据库
    pause
    exit /b 1
)

echo ✅ 数据库连接正常
echo.

REM 检查baobao用户
echo [3/4] 检查baobao用户...
echo 当前用户列表:
npx wrangler d1 execute oursql --command "SELECT username FROM users"

echo.
echo [4/4] 创建/更新baobao用户...
npx wrangler d1 execute oursql --command "INSERT OR REPLACE INTO users (username, password_hash, email, couple_name1, couple_name2, anniversary_date) VALUES ('baobao', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'baobao@example.com', '包包', '恺恺', '2023-10-08')"

echo.
echo ✅ 修复完成！
echo.
echo 现在可以用以下信息登录：
echo 用户名: baobao
echo 密码: baobao123
echo 测试地址: https://baoandkai.pages.dev/simple-test.html
echo.
pause