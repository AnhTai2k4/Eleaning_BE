const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit")
dotenv.config();
const app = express();
const port = process.env.PORT; // Port number for server
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true
}));
routes(app);

app.get("/", (req, res) => {
  res.send("iu iu iu");
});

mongoose
  .connect(process.env.MONGO_DB, {
    serverSelectionTimeoutMS: 50000, // 5s
  })
  .then(() => {
    console.log("Connect Successful");
  })
  .catch((err) => {
    console.log("Loi: ", err);
  });
app.listen(port, () => {
  console.log("env ne", process.env.PORT);
});
