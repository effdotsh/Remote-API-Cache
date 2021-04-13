const express = require("express");
const app = express();

const fetch = require("node-fetch");
// require("dotenv").config();

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

app.get("*", (req, res) => {
  if (firestore.has(req.url)) {
    api = firestore.get(req.url);
    if (Date.now() - api.last_updated > api.update_time * 60 * 1000) {
      fetch(api.redirect)
        .then((response) => response.json())
        .then((data) => {
          res.status(200).json(data);

          api.last_updated = Date.now();
          api.cache = data;
        })
        .catch((err) => {
          console.log(err);
          res.status(500).send("Service Unavailable");
        });
    } else {
      res.status(200).json(api.cache);
    }
  } else {
    res.status(404).send("Service Not Found");
  }
});

const firestore_url =
  `https://firestore.googleapis.com/v1/projects/${dbName}/databases/(default)/documents/${collection}?key=${key}`;

request(firestore_url).then((out) => {
  firestore = clean(out);
  console.log(firestore);

  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
});
