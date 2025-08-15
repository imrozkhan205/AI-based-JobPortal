import pool from './config/db.js';

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connection successful!');
    connection.release(); 
    process.exit(0); 
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
};

testConnection();
