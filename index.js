//https://apidog.com/blog/how-to-create-a-rest-api-with-node-js-and-express/


//in the package.json, a "type": "module" command is necessary to treat all js files as modules
//import {DB} from './dbconnect.js';
//import {search} from './dbconnect.js';
import express from 'express';
import bodyParser from 'body-parser';
import opensheetmusicdisplay from 'opensheetmusicdisplay';


import sqlite3 from 'sqlite3';
const sql3 = sqlite3.verbose();
//this package wraps around the sqlite3 package, and can accept awaits, see https://www.npmjs.com/package/sqlite, https://stackoverflow.com/questions/64372255/how-to-use-async-await-in-sqlite3-db-get-and-db-all
//import { open } from 'sqlite';

import path from 'path';
import { fileURLToPath } from 'url';
//for parsing XML code from string
import {DOMParser, parseHTML} from 'linkedom';
//the Node file system module, required to write files to disk
import * as fs from 'node:fs';

//this way of loading seems to be working with "type: module" in the package.json; https://github.com/jsdom/jsdom/issues/2514
import { JSDOM } from 'jsdom';
//https://github.com/oozcitak/xmlbuilder2
import xmlbuilder2 from 'xmlbuilder2';

//https://book.verovio.org/installing-or-building-from-sources/javascript-and-webassembly.html
//Verovio supports converting from MusicXML to Midi
//this import method is specifically for the ESM type imports
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import fs from 'node:fs';

import OpenSheetMusicDisplay from 'opensheetmusicdisplay';
const { OSMDisplay } = OpenSheetMusicDisplay;

//making it possible to make the require path command, https://stackoverflow.com/questions/69099763/referenceerror-require-is-not-defined-in-es-module-scope-you-can-use-import-in 
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//const path = require('path');

//recreating the usual dirname variable https://iamwebwiz.medium.com/how-to-fix-dirname-is-not-defined-in-es-module-scope-34d94a86694d
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory


const app = express();
app.use(bodyParser.json());
//serving the site from the static folder, see https://www.youtube.com/watch?v=fyc-4YmgLu0
app.use(express.static('public'));
//making script files accessible from ejs, since ejs is server-side and js is client-side
app.use(express.static(path.join(__dirname, '/views')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/scripts')));


//referencing the modules so that files from them can be imported, https://stackoverflow.com/questions/73272415/use-node-modules-with-ejs-and-node-js
app.use('/node_modules', express.static(__dirname + '/node_modules/'));

//https://stackoverflow.com/questions/70474230/node-express-error-no-default-engine-was-specified-and-no-extension-was-provide
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.status(200);
});

const port = 3000;

app.listen(port, (err) => {
  if(err)
    {
      //printing the error message to the console
      console.log(err.message);
    }
    console.log("Listening on port " + port.toString());
  
});

//https://medium.com/@nicholasstepanov/search-your-server-side-mysql-database-from-node-js-website-400cd68049fa
//async is necessary in order to wait for the response to the database query, see https://stackoverflow.com/questions/48835394/make-async-calls-in-express-server-app-get, https://stackoverflow.com/questions/72577747/how-to-use-app-get-asynchronously-in-express-js, https://stackoverflow.com/questions/63832370/node-js-waiting-for-the-db-query-results-for-the-next-step
app.get('/results', async (req, res) => {

  var searchTerm = req.query.searchbar;
  console.log(searchTerm);

  //selecting the correct key and genre for the search
  var key = req.query.key;
  var genre = req.query.genre;
  var instruments = req.query.instruments;
  //var year = 

  var query;

  if(req.query.key == "allKeys")
    {
      if(req.query.genre == "allGenres")
        {
          if(req.query.instruments == "allInstruments")
            {
              //the query with the LIKE parameter and the two percentage signs searches where that term is included either at the start or at the end or in the middle of the field
              query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%'";
            }
          else
            {
              query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' AND Instruments = '" + instruments + "'";
            } 
        }

      else
        {
          if(req.query.instruments == "allInstruments")
            {
              query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' AND Genre = '" + genre + "'";
            }
          else
            {
              query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
            }
          
        }
    }

    else
    {

      key = key.split("/");

      //the trim method removes whitespaces from the start and end of strings while keeping the original, see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
      key[0] = key[0].trim();
      key[1] = key[1].trim();

      if(req.query.genre == "allGenres")
        {
          if(req.query.instruments == "allInstruments")
            {
              query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' AND Key = '" + key[0] + "' OR Key = '" + key[1] + "'";
            }

          else
          {
            query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Instruments = '" + instruments + "'";
          }
          
        }

      else
        {
          if(req.query.instruments == "allInstruments")
            {
              query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Genre = '" + genre + "'";
            }
          else
          {
            query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
          }
          
        }
    }

    await delay(100);
  
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
      //console.log(results.length);
      
    })
});

await delay(100);

  //console.log(results.length);

  //var result = req.result;
  res.render('results', {
    result: results,
    length: results.length,
    category: req.category,
    term: searchTerm
  });

  //closing the database after the necessary queries have been done
  DBtempopen.close();
}); 

//https://stackoverflow.com/questions/13747740/serving-dynamic-urls-with-express-and-mongodb, https://stackoverflow.com/questions/62607356/how-to-create-parameters-in-express-router-dynamically
//https://sourcebae.com/blog/how-dynamic-routing-works-in-express-js/
app.get('/works/:number', async (req, res) => 
{
  const ID = req.params.number;
  var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ' + ID;
  //var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ?';
  const DBtempopen = new sql3.Database('music.db', sql3.OPEN_READONLY);
  var queryResult;
  var queryXML = ``;
  var XMLSTEP1;
  var XMLTOSEND;
  var XMLStr = "";

  var MIDIData;

  //queryResult = await DBtempopen.get(searchTerm, ID);

  await DBtempopen.get(searchTerm, (error, row) => {

    queryResult = row;
    //console.log(row);
  });

  await delay(100);

  console.log(typeof(queryResult.XML));

  //using the xmlbuilder2 module to build an XML file from the string, //https://github.com/oozcitak/xmlbuilder2

  const xmlStr = queryResult.XML;
  const xmlDoc = xmlbuilder2.create(xmlStr);

  await delay(200);

  //closing the database after the query has been finished
  DBtempopen.close();

  //opening Verovio and converting the MusicXML to MEI and that to MIDI
  createVerovioModule().then(VerovioModule => {
    const verovioToolkit = new VerovioToolkit(VerovioModule);
    const score = xmlDoc;
    verovioToolkit.loadData(score);
    //rendering the score to MIDI data, which is then sent to the browser
    //https://book.verovio.org/verovio-reference-book.pdf, p. 29
    MIDIData = verovioToolkit.renderToMIDI();
 });

  res.render('piece', {result: queryResult, XML: xmlDoc, osmdisplay: OSMDisplay, midiData: MIDIData});
});

//the get function for the pdf files of the individual works
app.get('/works/:number/pdf', async (req, res) => 
  {

//https://stackoverflow.com/questions/38855299/creating-an-html-or-pdf-file-in-memory-and-streaming-it-in-node-js

  const ID = req.params.number;
  var queryResult;
  //first, we need to get the binary of the PDF file from the database
  var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ' + ID;
  //the binary data from the database search will be appended here
  var PDFFile;

  const DBtempopen = new sql3.Database('music.db', sql3.OPEN_READONLY);

  //writing the binary data of the pdf file from the database to a variable
  await DBtempopen.get(searchTerm, (error, row) => {
    queryResult = row.PDF;
  });

  await delay(200);

  //assigning the binary data to the file variable, https://stackoverflow.com/questions/27159179/how-to-convert-blob-to-file-in-javascript
  //doesn't work in node.js, only the browser
  //PDFFile = new File([queryResult], "score.pdf");

  //https://www.geeksforgeeks.org/node-js-response-setheader-method/

  //setting the response header to a pdf filetype
  //https://github.com/marcbachmann/node-html-pdf/issues/472
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=score.pdf');

  //res.send is used instead of res.render, because the data file needs to be sent and not an ejs template rendered
  res.send(queryResult);

  });

//https://www.google.com/search?q=display+database+search+results+with+ejs&oq=display+database+search+results+with+ejs&gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCDg5NTBqMGoxqAIIsAIB&sourceid=chrome&ie=UTF-8

//test function for delaying a set amount of time
function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}