//https://apidog.com/blog/how-to-create-a-rest-api-with-node-js-and-express/

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

javascriptCopy codeconst express = require('express');
const bodyParser = require('body-parser');
const app = express();
use(bodyParser.json());
const port = process.env.PORT || 3000;
listen(port, () => {console.log(`Server is running on port ${port}`);

});

app.get('/hello', (req, res) => {
    res.json({message: 'The message'});
});

