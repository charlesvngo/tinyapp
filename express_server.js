const express = require("express");
const morgan = require('morgan');
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;

// Database of urls and shortened urls.
const urlDatabase = {
  "b2xVn2" : "http://www.lighthouselabs.ca",
  "9sm5xK" : "http://www.google.com"
};

// Function to generate a random 6 alphanumeric string.
const generateRandomString = () => {
  let output = '';
  let characterSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    let randomizedChar = Math.floor(Math.random() * characterSet.length);
    output += characterSet.charAt(randomizedChar);
  }
  return output;
};

// Setting EJS as the template engine.
app.set("view engine", "ejs");
// Middleware to debug connections and parse the buffer when performing post requests.
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({extended: true}));

// Home page
app.get("/", (req, res) => {
  res.send("Hello!");
});

// URL database page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Create a new URL to be shortened
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Create pages for the shortURLs in the database
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Output a .json containing all urls and shortURLS.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.post("/urls", (req, res) => {
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = req.body.longURL;
  res.redirect(`/urls/${newShortUrl}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});