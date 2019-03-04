"use strict";

const express = require("express");
const Munchy = require("munchy");
const { PassThrough } = require("stream");

const App = express();

const getResponseOutput = (req, delay = 2000) => {
  const output = new PassThrough();
  const chunks = [
    `<h1>Hello</h1>`,
    `<h1>What's your name?</h1>`,
    `<h1>Nice to meet you, I am express.</h1>`,
    `<h1>Excited to be streaming with you.</h1>`,
    `<h1>Bye, have a nice day.</h1>`
  ];

  let ix = 0;
  const interval = setInterval(() => output.write("."), 100);

  let fail = -1;

  if (req.query.fail) {
    fail = parseInt(req.query.fail);
  }

  const send = () => {
    console.log(`sending ${ix} ${chunks[ix]}`);
    output.write(chunks[ix++]);
    if (fail !== undefined && ix === fail) {
      clearInterval(interval);
      process.nextTick(() => output.emit("error"));
    } else {
      if (ix === chunks.length) {
        clearInterval(interval);
        output.end();
      } else {
        setTimeout(send, delay);
      }
    }
  };

  process.nextTick(() => send());

  return output;
};

App.get("/", (req, res) => {
  const munchy = new Munchy();

  const data = getResponseOutput(req);
  munchy.munch(`<html><head></head><body>`, data, `</body></html>\n`, null);

  res.cookie("START_TIME", `${Date.now()}`);

  munchy.pipe(res);
});

App.get("/multi", (req, res) => {
  const munchy = new Munchy();

  munchy.munch(
    `<html><head></head><body>`,
    getResponseOutput(req, 1000),
    getResponseOutput(req, 1000),
    `</body></html>\n`,
    null
  );

  res.cookie("START_TIME", `${Date.now()}`);

  munchy.pipe(res);
});

App.listen(3000, err => {
  if (err) console.error("listen failed", err);
  else console.log("Listening at 3000");
});
