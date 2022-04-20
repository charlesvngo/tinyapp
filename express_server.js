const express = require("express");
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

// Database of urls and shortened urls.
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "Bsdfa3"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "Bsdfa3"
  },
};

// User database.
const users = {
  "Bsdfa3": {
    id: "Bsdfa3",
    email: "a@a.com",
    password: "123"
  },
  "esfre1": {
    id: "esfre1",
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

// Function to check if a userId cookie is present. If not, will assign null to the variables.
const checkLoginCookie = (req) => {
  let output = {};
  if (!req.cookies.user_id) {
    output.userId = null;
    output.userEmail = null;
  } else {
    output.userId = req.cookies.user_id;
    output.userEmail = users[req.cookies.user_id].email;
  }
  return output;
};

const checkUsersUrls = (req) => {
  let output = {};
  for (const shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userId === req.cookies.user_id) {
      output[shortUrl] = urlDatabase[shortUrl].longURL;
    }
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
  res.cookie("user_id", users['Bsdfa3'].id);
  res.send("Hello! Logging into test user.");
});

// New user registration page
app.get("/register", (req, res) => {
  const templateVars = checkLoginCookie(req);
  if (templateVars.userId) {
    return res.redirect("/urls");
  }
  res.render("user_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = checkLoginCookie(req);
  if (templateVars.userId) {
    return res.redirect("/urls");
  }
  res.render("user_login", templateVars);
});

// URL database page
app.get("/urls", (req, res) => {
  const templateVars = checkLoginCookie(req);
  templateVars.urls = checkUsersUrls(req);
  res.render("urls_index", templateVars);
});

// Create a new URL to be shortened
app.get("/urls/new", (req, res) => {
  const templateVars = checkLoginCookie(req);
  if (!templateVars.userId) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// Create pages for the shortURLs in the database
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = checkLoginCookie(req);
  templateVars.shortURL = req.params.shortURL;
  templateVars.longURL = urlDatabase[req.params.shortURL].longURL;
  res.render("urls_show", templateVars);
});

// Short URL redirect link
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Output a .json containing all urls and shortURLS.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Adding new short URLs to the database.
app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(401).send("Please log in to create a short URL");
  }
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = {};
  urlDatabase[newShortUrl].longURL = req.body.longURL;
  urlDatabase[newShortUrl].userId = req.cookies.user_id;
  res.redirect(`/urls/${newShortUrl}`);
});

// Removing short URLs from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Modifying short URLs
app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Log in requests
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let foundUserId = null;

  // Check if email and password are truthy
  if (!email || !password) {
    return res.status(400).send("Invalid email or password.");
  }
  
  // Check if email is in current database
  for (const userId in users) {
    if (users[userId].email === email) {
      foundUserId = userId;
    }
  }
  
  // If email is not in system
  if (!foundUserId) {
    return res.status(403).send("No user found");
  }

  // Check if password is correct
  if (users[foundUserId].password !== password) {
    return res.status(401).send("Incorrect password");
  }

  res.cookie("user_id", foundUserId);
  res.redirect("/urls");

});

// Register for an account
app.post("/register", (req, res) => {
  // Check for valid email and passwords
  if (req.body.email === '' || req.body.password === '') {
    res.status(400);
    res.send("Invalid email or password.");
    return;
  }
  // Check for duplicate emails.
  for (const userId in users) {
    if (users[userId].email === req.body.email) {
      res.status(400);
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
  res.redirect("/login");
});

// Server initialization
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});