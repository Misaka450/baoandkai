@echo off
echo 正在执行D1数据库更新...
echo.

:: 检查是否安装了Wrangler
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 请先安装Wrangler CLI：
    echo npm install -g wrangler
    pause
    exit /b
)

:: 执行SQL命令
echo ✅ 正在添加排序字段...
wrangler d1 execute oursql --command="ALTER TABLE photos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;"

echo ✅ 正在创建索引...
wrangler d1 execute oursql --command="CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON photos(album_id, sort_order);"

echo ✅ 正在更新现有数据...
wrangler d1 execute oursql --command="UPDATE photos SET sort_order = id WHERE sort_order IS NULL OR sort_order = 0;"

echo ✅ 正在验证结果...
wrangler d1 execute oursql --command="SELECT COUNT(*) as total_photos, COUNT(CASE WHEN sort_order > 0 THEN 1 END) as photos_with_sort FROM photos;"

echo.
echo 🎉 数据库更新完成！
echo 请重新部署网站以应用更改。
pause