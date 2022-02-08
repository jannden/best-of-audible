// Require Express and Body Parser
const express = require("express");
const bodyParser = require("body-parser");

// Define our own routes
const customRoutes = require("./routes/api.js");

// Start Express and Body Parser
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Tell Express where are our static files
app.use("/public", express.static(process.cwd() + "/public"));

// Set the homepage
app.route("/").get(function (req, res) {
  res.sendFile(process.cwd() + "/public/index.html");
});

// Set our own routes
customRoutes(app);

// 404 Not Found Middleware
app.use(function (req, res, next) {
  res.status(404).type("text").send("Not Found");
});

// Define port
const portNum = 3000;

// Start the server
app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
});

// Export for testing purposes if need be
module.exports = app;
