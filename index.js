//https://apidog.com/blog/how-to-create-a-rest-api-with-node-js-and-express/


//in the package.json, a "type": "module" command is necessary to treat all js files as modules
import {DB} from './dbconnect.js';
import {search} from './dbconnect.js';
import express from 'express';
import bodyParser from 'body-parser';

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
    console.log("Listening on " + port.toString());
  
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
app.get('/results', search, (req, res) => {
  var result = req.result;
  res.render('pages/results', {
    results: result.length,
    term: req.term,
    result: result,
    category: req.category
  });
})