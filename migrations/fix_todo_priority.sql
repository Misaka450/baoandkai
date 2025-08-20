-- 修复待办事项优先级数据迁移
-- 将原有的5级优先级映射为3级：
-- 原1-2 -> 新1 (低优先级)
-- 原3 -> 新2 (中优先级)  
-- 原4-5 -> 新3 (高优先级)

-- 1. 先查看当前数据分布
SELECT 
    priority,
    COUNT(*) as count,
    CASE 
        WHEN priority <= 2 THEN 'low(1)'
        WHEN priority = 3 THEN 'medium(2)'
        WHEN priority >= 4 THEN 'high(3)'
    END as new_priority
FROM todos 
GROUP BY priority
ORDER BY priority;

-- 2. 更新优先级映射
UPDATE todos SET priority = 1 WHERE priority <= 2;
UPDATE todos SET priority = 2 WHERE priority = 3;
UPDATE todos SET priority = 3 WHERE priority >= 4;

-- 3. 验证更新结果
SELECT 
    priority,
    COUNT(*) as count
FROM todos 
GROUP BY priority
ORDER BY priority;