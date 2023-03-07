"use strict";
var request = require("request");
var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var app = express();
app.set("view engine", "ejs");
app.use(favicon(path.join(__dirname, 'views', 'images', 'creta.png')));
const kretaAPIServer = process.env.KRETA_API_SERVER || "http://budapesti.flacker.net:3400/";
app.get("/", async (req, res) => {
    res.redirect("/login");
});
app.get("/login", async (req, res) => {
    await request({
        url: "https://kretaglobalmobileapi2.ekreta.hu/api/v3/Institute",
        headers: {
            "apiKey": "7856d350-1fda-45f5-822d-e1a2f3f1acf0"
        }
    }, (error, response, body) => {
        try {
            let kretaResponseBody = body;
            let kretaResponseBodyParsed = JSON.parse(kretaResponseBody);
            kretaResponseBodyParsed.sort((a, b) => {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            });
            let institudes = "";
            for (let i = 0; i < kretaResponseBodyParsed.length; i++) {
                let institudeName = kretaResponseBodyParsed[i]["name"];
                let institudeCode = kretaResponseBodyParsed[i]["instituteCode"];
                institudes += `<option value="${institudeCode}">${institudeName}</option>`;
            }
            const data = {
                institudes: institudes
            };
            res.status(200)
                .render(__dirname + "/views/" + "login", { data: data });
        }
        catch (e) {
            res.status(503)
                .render(__dirname + "/views/" + "error");
        }
    });
});
app.get("/settings", async (req, res) => {
    res.status(200)
        .render(__dirname + "/views/" + "settings");
});
app.get("/:inst/:user([0-9]{11})/:pass/data", async (req, res) => {
    await request(`${kretaAPIServer}getinfo?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}`, (error, response, body) => {
        try {
            let kretaResponseBody = body;
            let kretaResponseBodyParsed = JSON.parse(kretaResponseBody);
            let data = {
                intezmeny: kretaResponseBodyParsed["IntezmenyNev"],
                nev: kretaResponseBodyParsed["Nev"],
                cim: kretaResponseBodyParsed["Cimek"][0],
                telefon: kretaResponseBodyParsed["Telefonszam"],
                email: kretaResponseBodyParsed["EmailCim"],
                resp: kretaResponseBody
            };
            res.status(200)
                .render(__dirname + "/views/" + "data", { data: data });
        }
        catch (e) {
            res.status(503)
                .render(__dirname + "/views/" + "error");
        }
    });
});
app.get("/:inst/:user([0-9]{11})/:pass", async (req, res) => {
    await request(`${kretaAPIServer}getinfo?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}`, (error, response, body) => {
        try {
            let kretaResponseBodyParsed = JSON.parse(body);
            var data = {
                intezmeny: kretaResponseBodyParsed["IntezmenyNev"],
                nev: kretaResponseBodyParsed["Nev"],
                cim: kretaResponseBodyParsed["Cimek"][0],
                telefon: kretaResponseBodyParsed["Telefonszam"],
                email: kretaResponseBodyParsed["EmailCim"],
            };
            res.status(200)
                .render(__dirname + "/views/" + "index", { data: data });
        }
        catch (e) {
            res.status(503)
                .render(__dirname + "/views/" + "error");
        }
    });
});
app.get("/:inst/:user([0-9]{11})/:pass/timetable/:date", async (req, res) => {
    let firstDate = new Date(`${req.params.date}`);
    let nextDate = new Date();
    nextDate.setDate(firstDate.getDate() + 1);
    let firstDateFinal = `${firstDate.getFullYear()}-${firstDate.getMonth() + 1}-${firstDate.getDate()}`;
    let nextDateFinal = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
    request(`${kretaAPIServer}gettimetable?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}&fromdate=${firstDateFinal}&todate=${nextDateFinal}`, (error, response, body) => {
        try {
            let kretaResponseBodyParsed = JSON.parse(body);
            for (let i = 0; i < kretaResponseBodyParsed.length; i++) {
                kretaResponseBodyParsed[i].Oraszam = kretaResponseBodyParsed[i].Oraszam;
            }
            let sorted = kretaResponseBodyParsed.sort((a, b) => { return a.Oraszam - b.Oraszam; });
            let table = [];
            let tableDone = "";
            for (let i = 0; i < sorted.length; i++) {
                table.push("<td>" + sorted[i]["Nev"] + "</td><td>" + sorted[i]["TanarNeve"] + "</td><td>" + sorted[i]["TeremNeve"] + "</td>");
            }
            for (let i = 0; i < table.length; i++) {
                tableDone += "<tr>" + table[i] + "</tr>";
            }
            tableDone = `
          <table class="table table-bordered w-auto mx-auto mt-4" id="timetable">
              <thead>
                  <th scope="col" class="text-center">Tantárgy</th>
                  <th scope="col" class="text-center">Tanár Neve</th>
                  <th scope="col" class="text-center">Terem</th>
              </thead>
              <tbody>
                  <td>${tableDone}</td>
              </tbody>
          </table>
      `.replace("undefined", '').substring(8);
            const tableTemplate = `
          <table class="table table-bordered w-auto mx-auto mt-4" id="timetable">
              <thead>
                  <th scope="col" class="text-center">Tantárgy</th>
                  <th scope="col" class="text-center">Tanár Neve</th>
                  <th scope="col" class="text-center">Terem</th>
              </thead>
              <tbody>
                  <td></td>
              </tbody>
          </table>
      `.replace("undefined", '').substring(8);
            if (tableDone == tableTemplate) {
                tableDone = `<p class="text-center fs-3">Nincsenek óráid! 🎉</p>`;
            }
            let data = {
                table: tableDone,
                date: `${req.params.date}`
            };
            res.status(200)
                .render(__dirname + "/views/" + "timetable", { data: data });
        }
        catch (e) {
            res.status(503)
                .render(__dirname + "/views/" + "error");
        }
    });
});
app.listen(3000, () => {
    console.log("\nServing creta!\n");
});
