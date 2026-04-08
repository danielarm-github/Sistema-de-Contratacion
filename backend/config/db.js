const mysql = require("mysql2");

const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "contratacion_docente"
});

conexion.connect((error)=>{
    if(error){
        console.log("Error conectando a MySQL");
        return;
    }
    console.log("Conectado a MySQL ✅");
});

module.exports = conexion;