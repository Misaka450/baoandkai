@echo off
title 登录问题修复工具
echo 正在检查并修复登录问题...

echo.
echo [1/4] 检查D1数据库...
npx wrangler d1 list

if %errorlevel% neq 0 (
    echo 请先运行: npx wrangler login
    pause
    exit /b 1
)

echo.
echo [2/4] 检查用户表...
npx wrangler d1 execute baoandkai --command "SELECT username, password_hash FROM users WHERE username='baobao'"

echo.
echo [3/4] 创建或更新baobao用户...
npx wrangler d1 execute baoandkai --command "
INSERT OR REPLACE INTO users (username, password_hash, email, couple_name1, couple_name2, anniversary_date)
VALUES ('baobao', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'baobao@example.com', '包包', '恺恺', '2023-10-08')
"

echo.
echo [4/4] 验证用户...
npx wrangler d1 execute baoandkai --command "SELECT username, password_hash FROM users WHERE username='baobao'"

echo.
echo ✅ 修复完成！
echo 现在可以测试登录了
pause