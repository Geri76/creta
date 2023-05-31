"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
var request = require("request");
var favicon = require('serve-favicon');
var path = require('path');
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.use(favicon(path.join(__dirname, 'views', 'images', 'creta.png')));
const kretaAPIServer = process.env.KRETA_API_SERVER || "http://flacker.net:3400/";
function resolveDay(dayNum) {
    return ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"][dayNum - 1];
}
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.redirect("/login");
}));
app.get("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200)
        .render(__dirname + "/views/" + "login");
}));
app.get("/settings", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200)
        .render(__dirname + "/views/" + "settings");
}));
app.get("/:inst/:user([0-9]{11})/:pass/data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield request(`${kretaAPIServer}getinfo?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}`, (error, response, body) => {
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
}));
app.get("/:inst/:user([0-9]{11})/:pass", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield request(`${kretaAPIServer}getinfo?username=${req.params.user}&password=${req.params.pass}&institude=${req.params.inst}`, (error, response, body) => {
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
}));
app.get("/:inst/:user([0-9]{11})/:pass/timetable/:date", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let firstDate = new Date(`${req.params.date}`);
    let nextDate = new Date();
    nextDate.setDate(firstDate.getDate() + 1);
    let firstDateFinal = `${firstDate.getFullYear()}-${firstDate.getMonth() + 1}-${firstDate.getDate()}`;
    let nextDateFinal = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}-${nextDate.getDate()}`;
    let day = resolveDay(firstDate.getDay());
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
          <table class="table table-bordered table-striped w-auto mx-auto mt-4" id="timetable">
              <thead>
                  <th scope="col" class="text-center">Tantárgy</th>
                  <th scope="col" class="text-center">Tanár Neve</th>
                  <th scope="col" class="text-center">Terem</th>
              </thead>
              <tbody>
                  ${tableDone}
              </tbody>
          </table>
      `.replace("undefined", '').substring(8);
            const tableTemplate = `
          <table class="table table-bordered table-striped w-auto mx-auto mt-4" id="timetable">
              <thead>
                  <th scope="col" class="text-center">Tantárgy</th>
                  <th scope="col" class="text-center">Tanár Neve</th>
                  <th scope="col" class="text-center">Terem</th>
              </thead>
              <tbody>
                  
              </tbody>
          </table>
      `.replace("undefined", '').substring(8);
            if (tableDone == tableTemplate) {
                tableDone = `<p class="text-center fs-3">Nincsenek óráid! 🎉</p>`;
            }
            let data = {
                table: tableDone,
                date: `${req.params.date}`,
                day: day
            };
            res.status(200)
                .render(__dirname + "/views/" + "timetable", { data: data });
        }
        catch (e) {
            res.status(503)
                .render(__dirname + "/views/" + "error");
        }
    });
}));
app.listen(3000, () => {
    console.log("\nServing creta!\n");
});
