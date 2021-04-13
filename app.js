const http = require("http");
const { url } = require("inspector");
const fetch = require("node-fetch");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const PORT = process.env.PORT || 3000;

const dbName = process.env.NAME;
const collection = process.env.COLLECTION;
const key = process.env.KEY;

const request = async (url) => {
  const response = await fetch(url);
  const json = await response.json();
  return await json;
};

let firestore = new Map();

function clean({ documents }) {
  let apis = new Map();
  documents.forEach(({ fields }) => {
    redirect = fields.redirect.stringValue;
    update_time = fields.update_time.numberValue || 60;

    let json = {
      redirect: redirect,
      update_time: update_time,
      last_updated: 0,
      cache: {},
    };
    apis.set(`/${fields.name.stringValue}`, json);
  });
  return apis;
}

const requestListener = function (req, res) {
  if (firestore.has(req.url)) {
    api = firestore.get(req.url);
    if(Date.now()-api.last_updated > api.update_time * 60 * 1000){
      fetch(api.redirect)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          res.writeHead(200);
          res.end(JSON.stringify(data));
          api.last_updated = Date.now()
          api.cache = data
        })
        .catch((err) => {
          res.writeHead(500);
          res.end("Service Unavailable");
        });
    }else{
      res.writeHead(200);
      res.end(JSON.stringify(api.cache));
    }
  } else {
    res.writeHead(404);
    res.end("Service Not Found");
  }
};

const firestore_url = `https://firestore.googleapis.com/v1/projects/${dbName}/databases/(default)/documents/${collection}?key=${key}`;

request(firestore_url).then((out) => {
  firestore = clean(out);
  const server = http.createServer(requestListener);
  server.listen(8080);
});
