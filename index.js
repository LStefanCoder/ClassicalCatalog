//https://apidog.com/blog/how-to-create-a-rest-api-with-node-js-and-express/


//in the package.json, a "type": "module" command is necessary to treat all js files as modules
//import {DB} from './dbconnect.js';
//import {search} from './dbconnect.js';
import express from 'express';
import bodyParser from 'body-parser';


import sqlite3 from 'sqlite3';
const sql3 = sqlite3.verbose();

//const port = process.env.PORT || 3000;
/*app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});*/

//const express = require('express');
//const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
//serving the site from the static folder, see https://www.youtube.com/watch?v=fyc-4YmgLu0
app.use(express.static('public'));

//https://stackoverflow.com/questions/70474230/node-express-error-no-default-engine-was-specified-and-no-extension-was-provide
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.status(200);
    res.send("Message");
    res.json({message: 'The message'});
});

const port = 3000;

app.listen(port, (err) => {
  if(err)
    {
      //printing the error message to the console
      console.log(err.message);
    }
    console.log("Listening on port" + port.toString());
  
});

//https://www.geeksforgeeks.org/how-to-make-a-search-function-using-node-express-and-mysql/
/*app.get('/search', (req, res) => {
  const searchTerm = req.query.term;
    if (!searchTerm) {
        return res.status(400)
            .json(
                {
                    error: 'Search term is required'
                }
            );
    }

    const query = `
    SELECT * FROM MusicPieces
    WHERE Title LIKE ?
  `;

    // Use '%' to perform a partial match
    const searchValue = `%${searchTerm}%`;

    DB.query(query, [searchValue, searchValue],
        (err, results) => {
            if (err) {
                console
                    .error('Error executing search query:', err);
                return res.status(500)
                    .json(
                        {
                            error: 'Internal server error'
                        });
            }

            res.json(results);
        });
});*/

//https://medium.com/@nicholasstepanov/search-your-server-side-mysql-database-from-node-js-website-400cd68049fa
//async is necessary in order to wait for the response to the database query, see https://stackoverflow.com/questions/48835394/make-async-calls-in-express-server-app-get, https://stackoverflow.com/questions/72577747/how-to-use-app-get-asynchronously-in-express-js, https://stackoverflow.com/questions/63832370/node-js-waiting-for-the-db-query-results-for-the-next-step
app.get('/results', async (req, res) => {
  //search();
  const query = 'SELECT * FROM MusicPieces';
  //testing a temporary database opening instead of a permanent one in dbconnect.js and export as DB
  //https://www.sqlitetutorial.net/sqlite-nodejs/
  const DBtempopen = new sql3.Database('music.db', sql3.OPEN_READONLY);

  var results = [];

  //https://medium.com/@codesprintpro/getting-started-sqlite3-with-nodejs-8ef387ad31c4
  await DBtempopen.all(query, (error, rows) => {
    rows.forEach((row) => {
      //pushing all values to a new array of dictionaries

      //first, all values are stored in a variable

      var ID = row.ID;
      var Composer = row.Composer;
      var Title = row.Title;
      var SecondTitle = row.SecondTitle;
      var Year = row.Year;
      var Genre = row.Genre;
      var Key = row.Key;
      var Instruments = row.Instruments;
      var Link = row.Link;
      var XML = row.XML;

      var rowDictionary = {'ID': ID, 'Composer': Composer, 'Title': Title, 'SecondTitle': SecondTitle, 'Year': Year, 'Genre': Genre, 'Key': Key, 'Instruments': Instruments, 'Link': Link, 'XML': XML};

      results.push(rowDictionary);
      console.log(results.length);
      
    })
});

await delay(2000);

  console.log(results.length);

  //var result = req.result;
  res.render('results', {
    result: results,
    length: results.length,
    term: req.term,
    category: req.category
  });

  //closing the database after the necessary queries have been done
  DBtempopen.close();
}); 

//https://www.google.com/search?q=display+database+search+results+with+ejs&oq=display+database+search+results+with+ejs&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCDg5NTBqMGoxqAIIsAIB&sourceid=chrome&ie=UTF-8

//test function for delaying a set amount of time
function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}