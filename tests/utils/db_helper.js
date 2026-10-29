const { execSync } = require('child_process');

function runMysqlRaw(args, inputSql = null) {
  const user = process.env.DB_USER || 'sms_app';
  const pass = process.env.DB_PASSWORD || 'sms_dev_pw';
  try {
    const dockerCmd = `docker exec -i student_management_db mysql -uroot --default-character-set=utf8mb4 student_management ${args}`;
    return execSync(dockerCmd, { input: inputSql || undefined, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (errRoot) {
    try {
      const dockerUserCmd = `docker exec -i student_management_db mysql -u${user} -p${pass} --default-character-set=utf8mb4 student_management ${args}`;
      return execSync(dockerUserCmd, { input: inputSql || undefined, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    } catch (err1) {
      try {
        const localCmd = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe" -u${user} -p${pass} --default-character-set=utf8mb4 student_management ${args}`;
        return execSync(localCmd, { input: inputSql || undefined, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      } catch (err2) {
        throw new Error(`DB Query Failed. Docker: ${err1.message}, Local: ${err2.message}`);
      }
    }
  }
}

/**
 * Run a SQL query and return parsed array of objects: [ { col1: 'val1', col2: 'val2' }, ... ]
 */
function queryDb(sql) {
  const raw = runMysqlRaw('-B', sql).trim();
  if (!raw) return [];

  const lines = raw.split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] !== 'NULL' ? values[i] : null;
    });
    return row;
  });
}

/**
 * Return a single scalar value from SQL (e.g. COUNT(*))
 */
function queryScalar(sql) {
  const raw = runMysqlRaw('-N', sql).trim();
  return raw;
}

/**
 * Execute DML / cleanup SQL
 */
function executeSql(sql) {
  runMysqlRaw('', sql);
}

module.exports = {
  queryDb,
  queryScalar,
  executeSql
};
