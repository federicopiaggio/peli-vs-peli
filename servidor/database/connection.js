const mysql = require('mysql');
const connection = mysql.createConnection({
    host     : "localhost",
    port     : "3306",
    user     : "root",
    password : "Rossignol26#",
    database : "competencias", 
});

module.exports = connection;