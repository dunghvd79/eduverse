/**
 * Migration 05/11/2026: sửa bảng `audit_logs` về đúng cấu trúc của model AuditLog.
 * Bảng từng bị một lần sequelize.sync({ alter: true }) bằng model khác xóa category, severity, target_*, metadata
 * và thêm resource, details. Migration thêm lại các cột, điền nhóm + mức độ cho dòng cũ theo danh mục hành động,
 * chuyển dữ liệu resource/details sang target_label/metadata rồi bỏ 2 cột đó.
 * Idempotent: bảng đã đúng cấu trúc thì không đổi gì.
 *
 * Chạy: npm run db:migrate:audit-logs-repair  (trong thư mục backend/)
 */
import { sequelize } from '../../config/database.js';
import { AUDIT_ACTIONS } from '../../utils/auditRules.js';
import { runMigration, query } from './helpers.js';

const caseOf = (key) => `CASE action ${Object.entries(AUDIT_ACTIONS)
  .map(([action, def]) => `WHEN '${action}' THEN '${def[key]}'`).join(' ')} END`;

async function migrate() {
  await sequelize.transaction(async (transaction) => {
    const run = (sql) => sequelize.query(sql, { transaction });

    await run(`
      ALTER TABLE audit_logs
        ADD COLUMN IF NOT EXISTS category VARCHAR(20),
        ADD COLUMN IF NOT EXISTS severity VARCHAR(10),
        ADD COLUMN IF NOT EXISTS target_type VARCHAR(30),
        ADD COLUMN IF NOT EXISTS target_id VARCHAR(64),
        ADD COLUMN IF NOT EXISTS target_label VARCHAR(255),
        ADD COLUMN IF NOT EXISTS metadata JSONB
    `);

    const extra = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name IN ('resource', 'details')
    `);
    if (extra.length === 2) {
      await run(`UPDATE audit_logs SET target_label = LEFT(resource, 255), metadata = details WHERE resource IS NOT NULL OR details IS NOT NULL`);
      await run('ALTER TABLE audit_logs DROP COLUMN resource, DROP COLUMN details');
    }

    // Dòng ghi bởi model khác: đưa về mã hành động và kết quả dùng trong danh mục
    await run(`UPDATE audit_logs SET action = 'LOGIN_SUCCESS' WHERE action = 'LOGIN'`);
    await run(`UPDATE audit_logs SET status = LOWER(status) WHERE status <> LOWER(status)`);

    // Hành động không có trong danh mục (LOGOUT cũ) thuộc nhóm xác thực, mức thông tin
    await run(`UPDATE audit_logs SET category = COALESCE(${caseOf('category')}, 'auth') WHERE category IS NULL`);
    await run(`UPDATE audit_logs SET severity = COALESCE(${caseOf('severity')}, 'info') WHERE severity IS NULL`);

    await run(`
      ALTER TABLE audit_logs
        ALTER COLUMN category SET NOT NULL,
        ALTER COLUMN severity SET NOT NULL,
        ALTER COLUMN severity SET DEFAULT 'info',
        ALTER COLUMN status SET DEFAULT 'success'
    `);
  });
  console.log('✅ Bảng audit_logs đã đúng cấu trúc');
}

runMigration('audit-logs-repair', migrate);
