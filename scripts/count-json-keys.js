/**
 * Đọc một file JSON và đếm tổng số key trong đó.
 * Đếm đệ quy: tính cả key của object lồng nhau và object nằm trong mảng.
 * Chạy trực tiếp: node scripts/count-json-keys.js <đường-dẫn.json>
 */

const fs = require('fs');

/**
 * Đếm đệ quy số lượng key của một giá trị JSON đã parse.
 * @param {*} value Giá trị JSON (object, array, hoặc primitive).
 * @returns {number} Tổng số key tìm thấy.
 */
function countKeys(value) {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countKeys(item), 0);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).reduce((total, key) => total + 1 + countKeys(value[key]), 0);
  }
  return 0;
}

/**
 * Đọc file JSON tại đường dẫn cho trước và trả về tổng số key.
 * @param {string} filePath Đường dẫn tới file .json.
 * @returns {number} Tổng số key trong file.
 * @throws {Error} Khi thiếu đường dẫn, không đọc được file, hoặc JSON không hợp lệ.
 */
function countJsonKeys(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Thiếu đường dẫn file JSON cần đọc');
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`Không đọc được file "${filePath}": ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`File "${filePath}" không phải JSON hợp lệ: ${err.message}`);
  }

  return countKeys(data);
}

module.exports = { countJsonKeys, countKeys };

// Cho phép chạy trực tiếp từ dòng lệnh.
if (require.main === module) {
  const filePath = process.argv[2];
  try {
    const total = countJsonKeys(filePath);
    console.log(`${filePath}: ${total} key`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}
