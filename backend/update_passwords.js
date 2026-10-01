const db = require('./config/db');

async function updatePasswords() {
  try {
    const hash = '$2b$10$dRA5ebfopdEYXtoYnuUk/.2gkaVARtnQ525JQynfseTM/tBjdkdT2';
    await db.query('UPDATE users SET password_hash = $1', [hash]);
    console.log('All passwords updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updatePasswords();
