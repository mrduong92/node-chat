// db.js
import mysql from 'mysql2';

const pool = mysql.createPool({
    host: 'mysql',
    user: 'root',
    password: 'root',
    database: 'homestead',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();
export default db;
