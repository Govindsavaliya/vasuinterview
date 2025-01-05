require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./utils/db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8070;

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false, limit: "2048mb" }));
app.use(
    cors({
        credentials: true,
        origin: ["*"],
    })
);

app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
    res.send('Hello World!');
});
app.use("/api", require("./routes/index"));

db.on("error", console.error.bind(console, "Connection error of DB :- "));
db.once("open", (error) => {
    if (error) throw Error();
    console.log("Connection is established with DB...!");
    if (!app.listening) {
        app.listen(PORT, () =>
            console.log(`Vasuinterview app listening on port http://localhost:${PORT}`)
        );
    }
});
