const express = require("express");
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

// Database of urls and shortened urls.
const urlDatabase = {
  "b2xVn2" : "http://www.lighthouselabs.ca",
  "9sm5xK" : "http://www.google.com"
};

// User database.
const users = {
  "randOne": {
    id: "randOne",
    email: "a@a.com",
    password: "123"
  },
  "randTwo": {
    id: "randTwo",
    email: "s@s.com",
    password: "123"
  }
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
app.use(cookieParser());

// Home page
app.get("/", (req, res) => {
  res.cookie("user_id", users['randOne'].id);
  res.send("Hello!");
});

// New user registration page
app.get("/register", (req, res) => {
  const templateVars = {
    userId: req.cookies.user_id,
    userEmail: users[req.cookies.user_id]["email"],
    username: req.cookies["username"],
  };
  res.render("user_register", templateVars);
});

// URL database page
app.get("/urls", (req, res) => {
  const templateVars = {
    userId: null,
    userEmail: null,
    urls: urlDatabase
  };
  if (req.cookies.userId) {
    templateVars.userId = req.cookies.user_id;
    templateVars.userEmail = users[req.cookies.user_id]["email"];
  };
  res.render("urls_index", templateVars);
});

// Create a new URL to be shortened
app.get("/urls/new", (req, res) => {
  const templateVars = {
    userId: req.cookies.user_id,
    userEmail: users[req.cookies.user_id]["email"],
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

// Create pages for the shortURLs in the database
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    userId: req.cookies.user_id,
    userEmail: users[req.cookies.user_id]["email"],
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// Short URL redirect link
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Output a .json containing all urls and shortURLS.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Adding new short URLs to the database.
app.post("/urls", (req, res) => {
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = req.body.longURL;
  res.redirect(`/urls/${newShortUrl}`);
});

// Removing short URLs from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  const templateVars = {
    userId: req.cookies.user_id,
    userEmail: users[req.cookies.user_id]["email"],
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Modifying short URLs
app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  const templateVars = {
    userId: req.cookies.user_id,
    userEmail: users[req.cookies.user_id]["email"],
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Log in requests
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Register for an account
app.post("/register", (req, res) => {
  // Check for valid email and passwords
  if (req.body.email === '' || req.body.password === '') {
    res.statusCode = 400;
    res.send("Invalid email or password.");
    return;
  }
  // Check for duplicate emails.
  for (const userId in users) {
    console.log(users[userId].email);
    if (users[userId].email === req.body.email) {
      res.statusCode = 400;
      res.send("Duplicate email detected.");
      return;
    }
  }

  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

// Log out requests
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Server initialization
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});