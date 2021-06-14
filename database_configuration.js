const pg = require("pg");

const poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
};

const pool = new pg.Pool(poolConfig);

pool.connect(err => {
    if(!err) {
        console.log("Successfully connected to the database");
    }else {
        console.log("An error occurred while connectiong to the database");
    }
})

module.exports = { pool };