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
    console.log(fields);
    redirect = fields.redirect.stringValue;
    update_time = fields.update_time.numberValue || 60;

    let json = {
      redirect: redirect,
      update_time: update_time,
    };
    apis.set(`/${fields.name.stringValue}`, json);
  });
  return apis;
}

const requestListener = function (req, res) {
  if (firestore.has(req.url)) {
    res.writeHead(200);
    res.end(firestore.get(req.url).redirect);
  } else {
    res.writeHead(404);
    res.end("404");
  }
};

const firestore_url = `https://firestore.googleapis.com/v1/projects/${dbName}/databases/(default)/documents/${collection}?key=${key}`;

request(firestore_url).then((out) => {
  firestore = clean(out);
  const server = http.createServer(requestListener);
  server.listen(8080);
});
