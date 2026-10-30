/**
 * Điểm khởi động của backend khi chạy trong Docker (CMD của backend/Dockerfile) — docs/architecture/deployment.md.
 *
 * 1. Chờ PostgreSQL sẵn sàng.
 * 2. Nếu CSDL còn trống (chưa có bảng `users`) hoặc lần khởi tạo trước bị dở dang: tạo bảng + nạp dữ liệu mẫu
 *    bằng các script có sẵn (migrateAndSeed -> migrations/*.js -> seedEduVerseCourses).
 *    CSDL đã có dữ liệu (ví dụ Neon dùng chung) thì KHÔNG bị đụng vào.
 * 3. Khởi động API (src/server.js).
 *
 * Đặt DB_AUTO_INIT=false để bỏ qua bước 1-2 (khi muốn tự chạy migration bằng tay).
 */
import '../config/env.js';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import pg from 'pg';

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const MARKER_TABLE = 'docker_init_state';
const MAX_ATTEMPTS = 30;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createClient = () => new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

/**
 * Kết nối CSDL, thử lại tối đa MAX_ATTEMPTS lần (PostgreSQL có thể còn đang khởi động)
 */
async function connectWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const client = createClient();
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      console.log(`⏳ Chờ PostgreSQL (${attempt}/${MAX_ATTEMPTS}): ${error.message}`);
      await client.end().catch(() => {});
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

/**
 * Trả về một trong:
 *   'fresh'    - CSDL trống, cần khởi tạo
 *   'running'  - lần khởi tạo trước chưa xong (bảng đánh dấu ở trạng thái running), chạy lại (các script đều idempotent)
 *   'done'     - đã khởi tạo xong
 *   'existing' - có sẵn bảng users nhưng không do script này tạo -> không đụng vào
 */
async function getInitState() {
  const client = await connectWithRetry();
  try {
    const { rows } = await client.query(
      `SELECT to_regclass('public.users') AS users_table, to_regclass('public.${MARKER_TABLE}') AS marker_table`
    );
    if (rows[0].marker_table) {
      const marker = await client.query(`SELECT status FROM ${MARKER_TABLE} LIMIT 1`);
      return marker.rows[0]?.status === 'done' ? 'done' : 'running';
    }
    return rows[0].users_table ? 'existing' : 'fresh';
  } finally {
    await client.end();
  }
}

async function setInitState(status) {
  const client = await connectWithRetry();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS ${MARKER_TABLE} (status VARCHAR(20) NOT NULL)`);
    await client.query(`DELETE FROM ${MARKER_TABLE}`);
    await client.query(`INSERT INTO ${MARKER_TABLE} (status) VALUES ($1)`, [status]);
  } finally {
    await client.end();
  }
}

/**
 * Danh sách script khởi tạo, theo đúng thứ tự: đồng bộ bảng + dữ liệu mẫu -> mọi migration (tên bắt đầu bằng
 * YYYYMMDD nên sắp theo tên là đúng thứ tự thời gian, migration mới tự được thêm vào) -> khóa học mẫu.
 */
function listInitScripts() {
  const migrations = fs.readdirSync(path.join(SCRIPTS_DIR, 'migrations'))
    .filter((name) => /^\d{8}-.+\.js$/.test(name))
    .sort()
    .map((name) => `migrations/${name}`);
  return ['migrateAndSeed.js', ...migrations, 'seedEduVerseCourses.js'];
}

function runScript(relativePath) {
  console.log(`▶️  Chạy ${relativePath}`);
  const result = spawnSync(process.execPath, [path.join(SCRIPTS_DIR, relativePath)], {
    stdio: 'inherit',
    env: process.env
  });
  if (result.status !== 0) {
    throw new Error(`Script ${relativePath} thất bại (mã thoát ${result.status})`);
  }
}

async function main() {
  if (process.env.DB_AUTO_INIT !== 'false') {
    const state = await getInitState();
    if (state === 'fresh' || state === 'running') {
      console.log('🌱 CSDL chưa được khởi tạo: tạo bảng và nạp dữ liệu mẫu (lần đầu mất khoảng 1 phút)...');
      await setInitState('running');
      listInitScripts().forEach(runScript);
      await setInitState('done');
      console.log('✅ Khởi tạo CSDL hoàn tất');
    } else {
      console.log(`ℹ️  CSDL đã có dữ liệu (${state}), bỏ qua bước khởi tạo`);
    }
  }

  await import('../server.js');
}

main().catch((error) => {
  console.error('❌ Khởi động backend thất bại:', error.message);
  process.exit(1);
});
