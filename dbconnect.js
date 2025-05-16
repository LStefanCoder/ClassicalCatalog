//https://www.youtube.com/watch?v=_RtpUaBSie0
import sqlite3 from 'sqlite3';
const sql3 = sqlite3.verbose();

//loading a database file. file needs to be added
//since the app doesn't need to modify any data, we are going to open it read_only
const DB = new sql3.Database('./music.db', sqlite3.OPEN_READONLY, connected);

function connected(err)
{
    if(err) 
    {
        console.log(err.message);
        return;
    }

    console.log('Connection to SQLite database successful!');
}


/*let sql = '';
DB.run(sql, [], (err)=>{
    //callback function
    if(err) {console.log('error')};
});*/


export {DB};


//https://expressjs.com/en/guide/database-integration.html#sqlite
//https://medium.com/@6unpnp/node-js-html-form-and-database-2b72728a1dc4
//https://www.geeksforgeeks.org/how-to-make-a-search-function-using-node-express-and-mysql/
//https://medium.com/@nicholasstepanov/search-your-server-side-mysql-database-from-node-js-website-400cd68049fa


/*function search(searchString)
{
    let startStatement = 'USE TABLE MusicPieces;';
    let searchStatement;
    DB.run(startStatement, [], (err) =>{
        if(err) {console.log('error')};
    });

    DB.run(searchStatement, [], (err) =>{
        if(err) {console.log('error')};
    });
}*/

//https://medium.com/@nicholasstepanov/search-your-server-side-mysql-database-from-node-js-website-400cd68049fa
//the export statement makes this function availble in the main js file
export function search(req, res, next)
{
    var term = req.query.search;
    var category = req.query.category;

    let query = 'SELECT * FROM MusicPieces';

    if(term != '' && category != '')
        {
            query = ` SELECT * FROM MusicPieces WHERE Genre = '` + category + ` 'AND (Title LIKE '%` + term + `%' OR Second Title LIKE '%` + term + `%')`;
        }

    else if (term != '' && category == '')
        {
            query = ` SELECT * FROM MusicPieces WHERE Title LIKE '%` + term + `%' OR Second Title LIKE '%` + term + `%'`;
        }
    else if (term == '' && category != '')
    {
        query = ` SELECT * FROM MusicPieces WHERE Genre = '` + category + `'`
    }

    DB.query(query, (err, result) => {
        if(err)
            {
                req.result = "";
                req.term = "";
                req.category = "";
            }

        else
        {
            req.result = result;
            req.term = term;
            req.category = "";

            next();
        }
    })
}