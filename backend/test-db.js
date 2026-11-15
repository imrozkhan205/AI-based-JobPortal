import pool from './src/database/db.js';

export const testConnection = async () => {
  try {
    console.log('🔄 Attempting to connect to database...');
    const connection = await pool.getConnection();
    console.log('✅ MySQL/TiDB connection successful!');
    
    const [rows] = await connection.query('SELECT DATABASE() AS current_db, VERSION() AS version');
    console.log('📊 Connected Database:', rows[0].current_db);
    console.log('🏷️  Database Version:', rows[0].version);
    
    connection.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('💡 Hint: Check DB_HOST and DB_PORT (TiDB Cloud uses port 4000).');
    } else if (err.message.includes('Access denied')) {
      console.error('💡 Hint: Check DB_USER and DB_PASS.');
    } else if (err.message.includes('SSL') || err.message.includes('handshake')) {
      console.error('💡 Hint: TiDB Cloud requires SSL/TLS. Ensure DB_SSL is enabled.');
    }
    process.exit(1);
  }
};

testConnection();
