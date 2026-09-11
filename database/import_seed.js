const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const mysqlPath = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe';

function runSqlFile(filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Importing ${filePath}...`);
    const p = spawn(mysqlPath, [
      '-u', 'root',
      '--default-character-set=utf8mb4'
    ]);

    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    fileStream.pipe(p.stdin);

    let stderr = '';
    p.stderr.on('data', d => stderr += d.toString('utf8'));
    p.stdout.on('data', d => console.log(d.toString('utf8')));

    p.on('close', code => {
      if (code === 0) {
        console.log(`Successfully imported ${filePath}!`);
        resolve();
      } else {
        console.error(`Error importing ${filePath}: ${stderr}`);
        reject(new Error(`MySQL process exited with code ${code}`));
      }
    });
  });
}

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const p = spawn(mysqlPath, [
      '-u', 'root',
      '--default-character-set=utf8mb4',
      '-e', sql
    ]);
    let stderr = '';
    p.stderr.on('data', d => stderr += d.toString('utf8'));
    p.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(stderr));
    });
  });
}

async function main() {
  try {
    console.log('Resetting database student_management...');
    await runQuery('DROP DATABASE IF EXISTS student_management; CREATE DATABASE student_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    
    const schemaFile = path.join(__dirname, 'schema.sql');
    const seedFile = path.join(__dirname, 'seed.sql');

    await runSqlFile(schemaFile);
    await runSqlFile(seedFile);
    console.log('ALL SQL FILES IMPORTED WITH PERFECT UTF-8!');
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

main();
