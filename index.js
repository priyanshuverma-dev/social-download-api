import express, { json } from "express";
import cors from "cors";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import instagramGetUrl from "instagram-url-direct";

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
    if (url.match("pin.it")) url = await expandURL(url);
    
    const { hostname, pathname } = new URL(url);
    const path = pathname.replace("/sent/", "");
    const finalUrl = `https://${hostname}${path}`;
    const response = await fetch(finalUrl);
    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }
    const body = await response.text();
    let outUrl;
    let type = "video";
    try {
        const video = new JSDOM(body).window.document.getElementsByTagName(
            "video"
        )[0].src;
        outUrl = video.replace("/hls/", "/720p/").replace(".m3u8", ".mp4");
    } catch (_) {
        outUrl = new JSDOM(body).window.document.getElementsByTagName(
            "img"
        )[0].src;
        type = "image";
    }

    const title = new JSDOM(body).window.document.querySelector('div[data-test-id="pinTitle"] h1').innerHTML;
    var desc;
    try {
        // Description may not be available
        desc = new JSDOM(body).window.document.querySelector('div[data-test-id="truncated-description"] div div span').innerHTML;
    } catch (_) {}

    console.log(outUrl);

    res.status(200).send({
        url: outUrl,
        title: url.match("pin.it") ? "Pinterest shorten url" : "Pinterest full url",
        type: type,
        titleURL: title,
        decsURL: desc
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});
app.get("/instagram", async (req, res) => {
  const url = req.query.url;
  try {
    if (url.match("instagram.com")) {
      const rsd = await instagramGetUrl(url);

      const uri = rsd.url_list[0];

      res.status(200).send({
        url: uri,
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

async function expandURL(shortenURL) {
  const uri = new URL(shortenURL);
  const path = uri.pathname;
  const finalUrl = `https://api.pinterest.com/url_shortener${path}/redirect/`;
  try {
    let response = await fetch(finalUrl, {
      method: "HEAD",
      redirect: "manual",
    });
    let location = response.headers.get("location");
    return location;
  } catch (error) {
    console.error(error);
    return null;
  }
}
