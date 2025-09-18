//Classical Catalog

//in the package.json, a "type": "module" command is necessary to treat all js files as modules
import express from 'express';
import bodyParser from 'body-parser';

//import MXML from 'jazz-mxml';

import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';


import sqlite3 from 'sqlite3';
const sql3 = sqlite3.verbose();
//this package wraps around the sqlite3 package, and can accept awaits, see https://www.npmjs.com/package/sqlite, https://stackoverflow.com/questions/64372255/how-to-use-async-await-in-sqlite3-db-get-and-db-all
//https://www.npmjs.com/package/sqlite
import { open } from 'sqlite';

import path from 'path';
import { fileURLToPath } from 'url';

//setting up the necessary code to query Wikidata, displaying the results on the composer pages
//https://www.npmjs.com/package/wikibase-sdk#wikibase-api
//this way of loading seems to be working with "type: module" in the package.json; https://github.com/jsdom/jsdom/issues/2514
import { WBK } from 'wikibase-sdk'
//https://github.com/maxlath/wikibase-sdk/blob/main/docs/simplify_claims.md#simplifyclaims
//this is used later for querying
import { simplifyClaims } from 'wikibase-sdk'

const wbk = WBK({
  instance: 'https://www.wikidata.org',
  sparqlEndpoint: 'https://query.wikidata.org/sparql'
})

//https://github.com/oozcitak/xmlbuilder2
import xmlbuilder2 from 'xmlbuilder2';

import OpenSheetMusicDisplay from 'opensheetmusicdisplay';
const { OSMDisplay } = OpenSheetMusicDisplay;

//making it possible to make the require path command, https://stackoverflow.com/questions/69099763/referenceerror-require-is-not-defined-in-es-module-scope-you-can-use-import-in , https://nodejs.org/api/module.html#modulecreaterequirefilename, https://stackoverflow.com/questions/59443525/require-not-working-in-module-type-nodejs-script
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//recreating the usual dirname variable https://iamwebwiz.medium.com/how-to-fix-dirname-is-not-defined-in-es-module-scope-34d94a86694d
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory


const app = express();
//creating an UUID, that is, a random number so that the session can be uniquely identified
import { v4 as uuidv4 } from 'uuid';
uuidv4();
//the express-session module enables us to store variables in the same session between different get requests
const session = require('express-session');

//before declaring all the app.use methods, a session is needed, so that the previous URL can be stored in a session variable
//the return button on the pages works this way
//see https://stackoverflow.com/questions/57451882/how-to-set-property-to-req-session
//we need to set session as a middleware for the entire application, see https://medium.com/@mfahadqureshi786/creating-session-in-nodejs-a72d5544e4d1
app.use(session(
  {
    name:'mainCookie',
    genid: function(req) {
      return uuidv4();
    },
    resave: false,
    secret: 'message', //this value is required for a session, but it is not used
    saveUninitialized: false,
    cookie: {secure: false, expires:60000},
    currentURL: '/'
  }
));

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
    //when the application is on its main page, the variable used for retrieving the previous url for the "back" button is set to the main URL
    //this variable is stored in session, which means it can be retrieved from different get requests
    //see https://stackoverflow.com/questions/33120874/node-js-get-previous-url/33122205
});

const port = 3000;

app.listen(port, (err) => {
  if(err)
    {
      //printing the error message to the console
      console.log(err.message);
    }
    //printing the port number to the console
    console.log("Listening on port " + port.toString());
});

//https://medium.com/@nicholasstepanov/search-your-server-side-mysql-database-from-node-js-website-400cd68049fa
//async is necessary in order to wait for the response to the database query, see https://stackoverflow.com/questions/48835394/make-async-calls-in-express-server-app-get, https://stackoverflow.com/questions/72577747/how-to-use-app-get-asynchronously-in-express-js, https://stackoverflow.com/questions/63832370/node-js-waiting-for-the-db-query-results-for-the-next-step
app.get('/results', async (req, res) => {

  //getting the previous URL and setting the session variable to the current URL for later retrieval
  if(req.session.currentURL != req.url)
    {
      var previousURL = req.session.currentURL;
      req.session.currentURL = req.url;
    }

  var searchTerm = req.query.term;

  //selecting the correct key and genre for the search
  var key = req.query.key;
  var genre = req.query.genre;
  var instruments = req.query.instruments;
  var composer = req.query.composer;

  var query;

  if(req.query.key == "allKeys")
    {
      if(req.query.genre == "allGenres")
        {
          if(req.query.instruments == "allInstruments")
            {
              if(req.query.composer == "allComposers")
                {
                  //the query with the LIKE parameter and the two percentage signs searches where that term is included either at the start or at the end or in the middle of the field
                  query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%'";
                }

              else
                {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Composer = '" + composer + "'";
                }
              
            }
          else
            {
              if(req.query.composer == "allComposers")
                {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Instruments = '" + instruments + "'";
                }
              
              else 
              {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Instruments = '" + instruments + "AND Composer = '" + composer + "'";
              }
            } 
        }

      else
        {
          if(req.query.instruments == "allInstruments")
            {
              if(req.query.composer == "allComposers")
                {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Genre = '" + genre + "'";
                }
              else
              {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Composer = '" + composer + "' AND Genre = '" + genre + "'";
              }
              
            }
          else
            {
              if(req.query.composer == "allComposers")
                {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Composer = '" + composer + "' AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
                }
              else
              {
                query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
              }
              
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
              query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "'";
            }

          else
          {
            query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Instruments = '" + instruments + "'";
          }
          
        }

      else
        {
          if(req.query.instruments == "allInstruments")
            {
              query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Genre = '" + genre + "'";
            }
          else
          {
            query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
          }
          
        }
    }

  sqlite3.verbose();

  const musicDB = await open({filename: 'music.db', driver: sqlite3.Database})


  //this array stores all the results 
  var rows = [];

  const results = await musicDB.all(query);

  results.forEach(row => {
    var ID = row.ID;
      var Composer = row.Composer;
      var Title = row.Title;
      var SecondTitle = row.SecondTitle;
      var Part = row.Part;
      var NoofParts = row.NoofParts;
      var Year = row.Year;
      var Genre = row.Genre;
      var Key = row.Key;
      var Instruments = row.Instruments;
      var Link = row.Link;
      var XML = row.XML;
      var PDF = row.PDF;

      var rowDictionary = {'ID': ID, 'Composer': Composer, 'Title': Title, 'SecondTitle': SecondTitle, 'Part': Part, 'NoofParts': NoofParts, 'Year': Year, 'Genre': Genre, 'Key': Key, 'Instruments': Instruments, 'Link': Link, 'XML': XML, 'PDF': PDF};
      
      rows.push(rowDictionary);
  });

//closing the database after the necessary queries have been done
  await musicDB.close();

  res.render('results', {
  result: results,
  length: results.length,
  category: req.category,
  term: searchTerm,
  previousURL: previousURL
});

}); 

//https://stackoverflow.com/questions/13747740/serving-dynamic-urls-with-express-and-mongodb, https://stackoverflow.com/questions/62607356/how-to-create-parameters-in-express-router-dynamically
//https://sourcebae.com/blog/how-dynamic-routing-works-in-express-js/
app.get('/works/:number', async (req, res) => 
{

  //again, we get the URL of the previous page to send in res.send
  if(req.session.currentURL != req.url)
    {
      var previousURL = req.session.currentURL;
      req.session.currentURL = req.url;
    }

  const ID = req.params.number;
  var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ' + ID;

  sqlite3.verbose();

  const musicDB = await open({filename: 'music.db', driver: sqlite3.Database});
  const composerDB = await open({filename: 'composers.db', driver: sqlite3.Database});
  
  var queryResult;
  var composerResult;

  queryResult = await musicDB.get(searchTerm);

  //this search term is used to retrieve the "further information" link and sending it to the page about the individual music piece
  //this term relies on the result of the music database query
  var composerSearchTerm = 'SELECT * FROM Composers WHERE Name = "' + queryResult.Composer + '"';

  //using the xmlbuilder2 module to build an XML file from the string, //https://github.com/oozcitak/xmlbuilder2

  const xmlStr = queryResult.XML;
  const xmlDoc = xmlbuilder2.create(xmlStr);

  //closing the database after the query has been finished
  await musicDB.close();

  composerResult = await composerDB.get(composerSearchTerm);

  let furtherWorksURL = '/results?term=&composer=';

  let composerName = queryResult.Composer;
  //splitting the name of the composer into individual parts and stringing them together with + signs for the URL
  let composerNameArray = composerName.split(" ");

  for(var i = 0; i < composerNameArray.length; i++)
  {
    furtherWorksURL= furtherWorksURL + composerNameArray[i] + '+';
  }

  //removing the last + sign
  furtherWorksURL = furtherWorksURL.slice(0, -1); 

  furtherWorksURL = furtherWorksURL + '&genre=allGenres&key=allKeys&instruments=allInstruments';

  await composerDB.close();

  res.render('piece', {result: queryResult, composer: composerResult, XML: xmlDoc, osmdisplay: OSMDisplay, previousURL: previousURL, furtherWorksURL: furtherWorksURL});

});

//the get function for the pdf files of the individual works
app.get('/works/:number/pdf', async (req, res) => 
  {
  //inspired by https://stackoverflow.com/questions/38855299/creating-an-html-or-pdf-file-in-memory-and-streaming-it-in-node-js
  const ID = req.params.number;
  var queryResult;
  //first, we need to get the binary of the PDF file from the database
  var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ' + ID;

  const musicDB = await open({filename: 'music.db', driver: sqlite3.Database});

  const result = await musicDB.get(searchTerm);

  //writing the binary data of the pdf file from the database to a variable
  queryResult = result.PDF;

  //issue see https://www.geeksforgeeks.org/node-js-response-setheader-method/
  //setting the response header to a pdf filetype
  //issue see https://github.com/marcbachmann/node-html-pdf/issues/472
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=score.pdf');

  //res.send is used instead of res.render, because the data file needs to be sent and not an ejs template rendered
  res.send(queryResult);

  });

app.get('/works/:number/xml', async (req, res) =>
{

  //https://stackoverflow.com/questions/38855299/creating-an-html-or-pdf-file-in-memory-and-streaming-it-in-node-js
  const ID = req.params.number;
  var queryResult;
  //first, we need to get the binary of the PDF file from the database
  var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ' + ID;

  const musicDB = await open({filename: 'music.db', driver: sqlite3.Database});

  const result = await musicDB.get(searchTerm);

  //writing the binary data of the XML file from the database to a variable
  queryResult = result.XML;

  //res.send is used instead of res.render, because the data file needs to be sent and not an ejs template rendered
  res.send(queryResult);

});


app.get('/works/:number/midi', async (req, res) => {

  const ID = req.params.number;
  var queryResult;
  //first, we need to get the binary of the PDF file from the database
  var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ' + ID;

  const musicDB = await open({filename: 'music.db', driver: sqlite3.Database});

  const result = await musicDB.get(searchTerm);

  //writing the binary data of the XML file from the database to a variable
  queryResult = result.XML;

  //opening Verovio and converting the MusicXML to MEI and that to MIDI
  createVerovioModule().then(VerovioModule => {
    const verovioToolkit = new VerovioToolkit(VerovioModule);
    //the plain string is needed, not the converted string intended for the preview with OSMD
    const score = queryResult;
    verovioToolkit.loadData(score);
    //rendering the score to MIDI data, which is then sent to the browser
    //https://book.verovio.org/verovio-reference-book.pdf, p. 29
    //also https://www.npmjs.com/package/verovio
    var MIDIData = verovioToolkit.renderToMIDI();

    //converting the base64 string MIDIData into a binary string, which can then be saved as a file
    //the following six lines of code taken from https://saturncloud.io/blog/creating-a-blob-from-a-base64-string-in-javascript/
    const byteCharacters = atob(MIDIData);
    const byteArrays = [];

    for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
    }

    const byteArray = new Uint8Array(byteArrays);

    //see https://book.verovio.org/interactive-notation/encoding-formats.html
    let MIDIBlob = new Blob([byteArray], {type: "audio/midi"});
    res.type(MIDIBlob.type);
    //sending the blob file to the client, based on https://stackoverflow.com/questions/52665103/using-express-how-to-send-blob-object-as-response
    MIDIBlob.arrayBuffer().then((buf) => {
      res.send(Buffer.from(buf, 'base64'));
    });
 });

});

//this function opens a page of the individual composer
app.get('/composers/:number', async (req, res) =>
  {
    if(req.session.currentURL != req.url)
      {
        var previousURL = req.session.currentURL;
        req.session.currentURL = req.url;
      }

    const ID = req.params.number;
    var queryResult;

    var searchTerm = 'SELECT * FROM Composers WHERE ID = ' + ID;
    
    const composerDB = await open({filename: 'composers.db', driver: sqlite3.Database});

    queryResult = await composerDB.get(searchTerm);

    let mainEntity = queryResult.WikidataURL;

    //https://github.com/maxlath/wikibase-sdk/blob/main/docs/sparql_query.md
    //https://stackoverflow.com/questions/72711757/list-all-wikidata-properties-of-a-specific-entity-with-sparql
    const sparqlQuery = 'SELECT  ?p ?wdLabel ?ps ?ps_ ?ps_Label ?ps_Description ?pq_unitLabel WHERE {   VALUES ?item {     wd:' + mainEntity +'   }   ?item ?p ?statement.   ?statement ?ps ?ps_.   ?wd wikibase:claim ?p;     wikibase:statementProperty ?ps.   OPTIONAL {     ?statement ?pq ?pq_.     ?wdpq wikibase:qualifier ?pq.     ?statement ?pqv [wikibase:quantityUnit ?pq_unit]   }   SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". } }';

    const sparqlUrl = wbk.sparqlQuery(sparqlQuery);
    //Wikidata requires user agent information in a header
    //https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy
    const sparqlHeader = {'User-Agent': 'ClassicalCatalog/0.0 (LStefanCoder)'};

    //retrieving the data
    var sparqlJSON = await fetch(sparqlUrl, {method: 'GET', headers: sparqlHeader}).then(function (res) {return res.json();});

    //creating an array of all value descriptions and values to be passed to the ejs file
    let propertyValues = ['P569', 'P570', 'P19', 'P20', 'P22', 'P25', 'P26'];
    //the "bindings" contain all the data of these properties
    let resultsValues = sparqlJSON.results.bindings;
    let dataValues = [];

    //checking in a nested for loop for a list of properties
    //for all values corresponding to the Wikidata properties in the array, the value from the "bindings" is retrieved
    for(var i = 0; i < propertyValues.length; i++)
      {
        for(var j = 0; j < resultsValues.length; j++)
          {
            if(resultsValues[j].p.value == 'http://www.wikidata.org/prop/' + propertyValues[i])
              {
                dataValues.push(resultsValues[j].ps_Label.value);
              }
          }
      }

      //parsing the date returned by Wikidata in the ISO-8601 format to the DD/MM/YYYY format
      let dateOfBirth = dataValues[0];
      let dateOfDeath = dataValues[2];

      let isoDateOfBirth = new Date(dateOfBirth);
      let isoDateOfDeath = new Date(dateOfDeath);

      dateOfBirth = isoDateOfBirth.toLocaleDateString('en-US');
      dateOfDeath = isoDateOfDeath.toLocaleDateString('en-US');

      dataValues[0] = dateOfBirth;
      dataValues[2] = dateOfDeath;

    res.render('composer', {result: queryResult, previousURL: previousURL, wikiData: dataValues});

  });

//a simple GET request rendering the about page
app.get('/about', async(req, res) =>{

  var previousURL = req.session.currentURL;
  req.session.currentURL = req.url;

  res.render('about', {previousURL: previousURL});

});

//the following two get requests are the api, with URLs in the format of /api/..., responses sent with json
//https://treblle.com/blog/create-simple-rest-api-json

//retrieving an individual work via the api
app.get('/api/works/:number', async (req, res) => {
  const ID = req.params.number;
  var searchTerm = 'SELECT * FROM MusicPieces WHERE ID = ' + ID;

  const musicDB = await open({filename: 'music.db', driver: sqlite3.Database});
  
  var queryResult;
  var composerResult;

  queryResult = await musicDB.get(searchTerm);

  var Composer = queryResult.Composer;
  var Title = queryResult.Title;
  var SecondTitle = queryResult.SecondTitle;
  var Part = queryResult.Part;
  var NoofParts = queryResult.NoofParts;
  var Year = queryResult.Year;
  var Genre = queryResult.Genre;
  var Key = queryResult.Key;
  var Instruments = queryResult.Instruments;
  var Link = queryResult.Link;
  var XML = queryResult.XML;

  //using the xmlbuilder2 module to build an XML file from the string, //https://github.com/oozcitak/xmlbuilder2
  const xmlStr = queryResult.XML;
  const xmlDoc = xmlbuilder2.create(xmlStr);


  //closing the database after the query has been finished
  await musicDB.close();

  //creating a JSON file to be sent to the browser and including all necessary values
  var JSONObj = {};
  JSONObj["ID"] = ID;
  JSONObj["Composer"] = Composer;
  JSONObj["Title"] = Title;
  JSONObj["SecondTitle"] = SecondTitle;
  JSONObj["Part"] = Part;
  JSONObj["NoofParts"] = NoofParts;
  JSONObj["Year"] = Year;
  JSONObj["Genre"] = Genre;
  JSONObj["Key"] = Key;
  JSONObj["Instruments"] = Instruments;
  JSONObj["Link"] = Link;
  JSONObj["XML"] = xmlStr;

  res.json(JSON.parse(JSON.stringify(JSONObj)));
});


app.get('/api/results', async (req, res) => {
  var key = req.query.key;
  var genre = req.query.genre;
  var instruments = req.query.instruments;
  var composer = req.query.composer;

  var query;

  var searchTerm = req.query.term;

  if(req.query.key == "allKeys")
    {
      if(req.query.genre == "allGenres")
        {
          if(req.query.instruments == "allInstruments")
            {
              if(req.query.composer == "allComposers")
                {
                  //the query with the LIKE parameter and the two percentage signs searches where that term is included either at the start or at the end or in the middle of the field
                  query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%'";
                }

              else
                {
                  query = " SELECT * FROM MusicPieces WHERE Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%' AND Composer = '" + composer + "'";
                }
              
            }
          else
            {
              if(req.query.composer == "allComposers")
                {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Instruments = '" + instruments + "'";
                }
              
              else 
              {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Instruments = '" + instruments + "AND Composer = '" + composer + "'";
              }
            } 
        }

      else
        {
          if(req.query.instruments == "allInstruments")
            {
              if(req.query.composer == "allComposers")
                {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Genre = '" + genre + "'";
                }
              else
              {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Composer = '" + composer + "'AND Genre = '" + genre + "'";
              }
              
            }
          else
            {
              if(req.query.composer == "allComposers")
                {
                  query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Composer = '" + composer + "AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
                }
              else
              {
                query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
              }
              
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
              query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "'";
            }

          else
          {
            query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Instruments = '" + instruments + "'";
          }
          
        }

      else
        {
          if(req.query.instruments == "allInstruments")
            {
              query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Genre = '" + genre + "'";
            }
          else
          {
            query = " SELECT * FROM MusicPieces WHERE (Title LIKE '%" + searchTerm + "%' OR Composer LIKE '%" + searchTerm + "%') AND Key = '" + key[0] + "' OR Key = '" + key[1] + "' AND Genre = '" + genre + "' AND Instruments = '" + instruments + "'";
          }
          
        }
    }
  
  //testing a temporary database opening instead of a permanent one in dbconnect.js and export as DB
  //https://www.sqlitetutorial.net/sqlite-nodejs/
  const musicDB = await open({filename: 'music.db', driver: sqlite3.Database});

  //this array stores all the results 
  var rows = await musicDB.all(query);

  var results = [];

  rows.forEach(row => {
      var ID = row.ID;
      var Composer = row.Composer;
      var Title = row.Title;
      var SecondTitle = row.SecondTitle;
      var Part = row.Part;
      var NoofParts = row.NoofParts;
      var Year = row.Year;
      var Genre = row.Genre;
      var Key = row.Key;
      var Instruments = row.Instruments;
      var Link = row.Link;
      //the link to the XML and PDF files is included here
      var XML = '/works/' + ID + '/xml';
      var PDF = '/works/' + ID + '/pdf';

      var rowDictionary = {'ID': ID, 'Composer': Composer, 'Title': Title, 'SecondTitle': SecondTitle, 'Part': Part, 'NoofParts': NoofParts, 'Year': Year, 'Genre': Genre, 'Key': Key, 'Instruments': Instruments, 'Link': Link, 'XML': XML, 'PDF': PDF};
      
      results.push(rowDictionary);
  });

  await musicDB.close();

  res.json(JSON.parse(JSON.stringify(results)));

});