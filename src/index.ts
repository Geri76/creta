var request = require("request");
var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var app = express();

app.set("view engine", "ejs");

app.use(favicon(path.join(__dirname, 'views', 'images', 'creta.png')));

const kretaAPIServer: any = "http://budapesti.flacker.net:3400/";

// Root

app.get("/", async (req: any, res: any) => {
  res.redirect("/login");
});

// Login

app.get("/login", async (req: any, res: any) => {
  res.render(__dirname + "/views/" + "login");
});

// Settings

app.get("/settings", async (req: any, res: any) => {
  res.render(__dirname + "/views/" + "settings");
});

// Data

app.get("/:inst/:user([0-9]{11})/:pass/data", async (req: any, res: any) => {
  await request(`${kretaAPIServer}getinfo?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}`, (error: any, response: any, body: any) => {  
    let kretaResponseBody: any = body;
    let kretaResponseBodyParsed: any = JSON.parse(kretaResponseBody);

    let data = {
      intezmeny: kretaResponseBodyParsed["IntezmenyNev"],
      nev: kretaResponseBodyParsed["Nev"],
      cim : kretaResponseBodyParsed["Cimek"][0],
      telefon: kretaResponseBodyParsed["Telefonszam"],
      email: kretaResponseBodyParsed["EmailCim"],
      resp: kretaResponseBody
    };

    res.status(200)
      .render(__dirname + "/views/" + "data", {data: data});
  });
});

// Main Page

app.get("/:inst/:user([0-9]{11})/:pass", async (req: any, res: any) => {
  await request(`${kretaAPIServer}getinfo?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}`, (error: any, response: any, body: any) => {

    let kretaResponseBodyParsed: any = JSON.parse(body);

    var data = {
      intezmeny: kretaResponseBodyParsed["IntezmenyNev"],
      nev: kretaResponseBodyParsed["Nev"],
      cim : kretaResponseBodyParsed["Cimek"][0],
      telefon: kretaResponseBodyParsed["Telefonszam"],
      email: kretaResponseBodyParsed["EmailCim"],
    };

    res.status(200)
      .render(__dirname + "/views/" + "index", {data: data});
  });
});

// Timetable

app.get("/:inst/:user([0-9]{11})/:pass/timetable/:fromdate/:todate", async (req: any, res: any) => {
  request(`${kretaAPIServer}gettimetable?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}&fromdate=${req.params.fromdate}&todate=${req.params.todate}`, function (error: any, response: any, body: any) {

    let kretaResponseBodyParsed: any = JSON.parse(body);

    for (let i = 0; i < kretaResponseBodyParsed.length; i++) {
      kretaResponseBodyParsed[i].Oraszam = kretaResponseBodyParsed[i].Oraszam;
    }
    
    let sorted: any = kretaResponseBodyParsed.sort(function(a: any, b: any) { return a.Oraszam - b.Oraszam; });
    let table = [];
    let tableDone = "";

    for (let i = 0; i < sorted.length; i++) {
      table.push("<td>" + sorted[i]["Nev"] + "</td><td>" + sorted[i]["TanarNeve"] + "</td><td>" + sorted[i]["TeremNeve"] + "</td>");
    }

    for (let i = 0; i < table.length; i++) {
      tableDone += "<tr>" + table[i] + "</tr>"
      
    }

    let data = {
      table: tableDone
    };

    res.status(200)
      .render(__dirname + "/views/" + "timetable", {data: data});
  });
});

app.listen(3000);