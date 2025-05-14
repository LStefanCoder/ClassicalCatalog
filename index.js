//https://apidog.com/blog/how-to-create-a-rest-api-with-node-js-and-express/


//in the package.json, a "type": "module" command is necessary to treat all js files as modules
import {DB} from './dbconnect.js';
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
