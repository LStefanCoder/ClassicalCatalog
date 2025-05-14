//https://www.youtube.com/watch?v=_RtpUaBSie0
import sqlite3 from 'sqlite3';
const sql3 = sqlite3.verbose();

//loading a database file. file needs to be added
//since the app doesn't need to modify any data, we are going to open it read_only
const DB = new sql3.Database('./dbconnect.js', sqlite3.OPEN_READONLY, connected);

function connected(err)
{
    if(err) 
    {
        console.log(err.message);
        return;
    }

    console.log('Connection to SQLite database successful!');
}


let sql = 'CREATE TABLE';
DB.run(sql, [], (err)=>{
    //callback function
    if(err) {console.log('error')};
});


export {DB};