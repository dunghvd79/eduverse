/**
 * Hàm dùng chung cho các script migration (idempotent, chạy lại nhiều lần không lỗi).
 */
import models from '../../models/index.js';

const { sequelize } = models;

export const query = (sql) => sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });

/**
 * Xóa mọi UNIQUE constraint / unique index KHÔNG có điều kiện trên đúng tập cột cho trước
 * (sync({ alter: true }) cũ đã tạo trùng lặp nhiều bản: *_key, *_key1, *_key2...)
 */
export async function dropFullUnique(table, columns) {
  const definition = `UNIQUE (${columns.join(', ')})`;
  const constraints = await query(`
    SELECT conname FROM pg_constraint
    WHERE conrelid = '${table}'::regclass AND contype = 'u' AND pg_get_constraintdef(oid) = '${definition}'
  `);
  for (const { conname } of constraints) {
    await sequelize.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${conname}"`);
    console.log(`🗑️  Đã xóa constraint ${conname}`);
  }

  const indexes = await query(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = '${table}' AND indexdef LIKE 'CREATE UNIQUE INDEX%' AND indexdef NOT LIKE '%WHERE%'
  `);
  const target = `(${columns.join(', ')})`;
  for (const { indexname, indexdef } of indexes) {
    if (indexdef.endsWith(target)) {
      await sequelize.query(`DROP INDEX IF EXISTS "${indexname}"`);
      console.log(`🗑️  Đã xóa unique index ${indexname}`);
    }
  }
}

/**
 * Tạo Partial Unique Index chỉ áp dụng cho bản ghi chưa xóa mềm (deleted_at IS NULL)
 */
export async function createPartialUnique(table, name, columns) {
  const duplicates = await query(`
    SELECT ${columns.join(', ')}, COUNT(*) FROM "${table}" WHERE deleted_at IS NULL
    GROUP BY ${columns.join(', ')} HAVING COUNT(*) > 1
  `);
  if (duplicates.length > 0) {
    throw new Error(`Bảng ${table} còn ${duplicates.length} nhóm dữ liệu trùng (${columns.join(', ')}), cần xử lý tay trước khi tạo index`);
  }

  await sequelize.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS "${name}" ON "${table}" (${columns.join(', ')}) WHERE deleted_at IS NULL`
  );
  console.log(`✅ Partial unique index ${name} đã sẵn sàng`);
}

export const runMigration = (name, migrate) => migrate()
  .then(() => {
    console.log(`🎉 Migration ${name} hoàn tất`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration thất bại:', err);
    process.exit(1);
  });
