import express, { json } from "express";
import cors from "cors";
import fetch from "node-fetch";
import request from "request";
import { JSDOM } from "jsdom";

const app = express();
app.use(cors());
app.use(json());

app.listen(4000, () => {
  console.log("Server Works !!! At port 4000");
});
app.get("/", async (req, res) => {
  res.status(200).send({
    message: "Hello World",
  });
});
app.get("/pinterest", async (req, res) => {
  const url = req.query.url;
  try {
    if (url.match("pin.it")) {
      await fetch(url)
        .then(async (r) => {
          if (!r.ok) {
            throw new Error(`HTTP error ${r.status}`);
          }
          const url = r.url;
          const uri = new URL(url);
          uri.searchParams.delete("invite_code");
          uri.searchParams.delete("sender");
          uri.searchParams.delete("sfo");
          uri.pathname = uri.pathname.replace("/sent/", "");
          const path = uri.pathname;
          const finalUrl = "https://" + uri.hostname + path;
          console.log(finalUrl);
          const out = await new Promise((resolve, reject) => {
            request(finalUrl, async function (error, response, body) {
              const dom = new JSDOM(body);
              const document = dom.window.document;
              const video = document.getElementsByTagName("video")[0].src;
              const addInQuality = video.replace("/hls/", "/720p/");
              const outUrl = addInQuality.replace(".m3u8", ".mp4");
              console.log(outUrl);
              resolve(outUrl);
            });
          });
          res.status(200).send({
            url: out,
            title: "Pinterest shorten url",
          });
        })
        .catch((error) => console.error(error));
    }
    if (url.match("pinterest.com")) {
      request(url, function (error, response, body) {
        const dom = new JSDOM(body);
        const document = dom.window.document;
        const video = document.getElementsByTagName("video")[0].src;
        const addInQuality = video.replace("/hls/", "/720p/");
        const outUrl = addInQuality.replace(".m3u8", ".mp4");
        console.log(outUrl);
        res.status(200).send({
          url: outUrl,
          title: "Pinterest full url",
        });
      });
    }
    console.log(url);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});
app.get("/instagram", async (req, res) => {
  const url = req.query.url;
  try {
    console.log(url);
    if (url.match("instagram.com")) {
      res.status(200).send({
        url: url,
        title: "Instagram shorten url",
      });
    } else {
      res.status(200).send({
        error: "Not a valid url",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});
