const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const bodyParser = require(`body-parser`);
const cookieSession = require('cookie-session');
const app = express();
const { generateRandomString, checkLoginCookie, getUserByEmail, urlsForUser } = require('./helpers');
const PORT = 8080;

// Database of urls and shortened urls. Urls are registed to specific users.
const urlDatabase = {};

// User database.
const users = {};

// Setting EJS as the template engine.
app.set("view engine", "ejs");

// Middleware to debug connections and parse the buffer when performing post requests.
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// Home page. If logged in, redirect to urls index, if not then login page.
app.get("/", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = checkLoginCookie(currentUserId, users);
  if (templateVars.userId) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

// New user registration page. If user is already registered, will redirect to urls homepage.
app.get("/register", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = checkLoginCookie(currentUserId, users);
  if (templateVars.userId) {
    return res.redirect("/urls");
  }
  res.render("user_register", templateVars);
});

// Log in page. If user is already registered, will redirect to urls homepage.
app.get("/login", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = checkLoginCookie(currentUserId, users);
  if (templateVars.userId) {
    return res.redirect("/urls");
  }
  res.render("user_login", templateVars);
});

// URL database page
app.get("/urls", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = checkLoginCookie(currentUserId, users);
  // If user is not logged in send error.
  if (templateVars.userId === null) {
    return res.status(403).send("Please log in or register to see your URLs");
  }
  templateVars.urls = urlsForUser(currentUserId, urlDatabase);
  res.render("urls_index", templateVars);
});

// Create a new URL to be shortened
app.get("/urls/new", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = checkLoginCookie(currentUserId, users);
  // If user is not logged in send error.
  if (!templateVars.userId) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// Create pages for the shortURLs in the database
app.get("/urls/:shortURL", (req, res) => {
  const currentUserId = req.session.user_id;
  const templateVars = checkLoginCookie(currentUserId, users);
  // If user is not logged in, send error.
  if (templateVars.userId === null) {
    return res.status(403).send("Please log in or register to edit your URLs");
  }

  // If user does not own the current shortURL, send error.
  if (templateVars.userId !== urlDatabase[req.params.shortURL].userId) {
    return res.status(403).send("Invalid URL to edit. To edit this URL, please log into the correct account");
  }

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
  // Check if logged in. If not, send 401.
  if (!req.session.user_id) {
    return res.status(401).send("Please log in to create a short URL");
  }
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = {};
  urlDatabase[newShortUrl].longURL = req.body.longURL;
  urlDatabase[newShortUrl].userId = req.session.user_id;
  res.redirect(`/urls/${newShortUrl}`);
});

// Removing short URLs from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userId) {
    return res.status(403).send("Invalid URL to delete. To delete this URL, please log into the correct account");
  }

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
  foundUserId = getUserByEmail(email, users);
  
  // If email is not in system
  if (!foundUserId) {
    return res.status(403).send("No user found");
  }

  // Check if password is correct
  if (!bcrypt.compareSync(password, users[foundUserId].password)) {
    return res.status(403).send("Incorrect password");
  }

  req.session["user_id"] = foundUserId;
  res.redirect("/urls");

});

// Register for an account
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Check for valid email and passwords
  if (email === '' || password === '') {
    res.status(400);
    res.send("Invalid email or password.");
    return;
  }
  // Check for duplicate emails.
  if (getUserByEmail(email, users)) {
    return res.status(403).send("Duplicate email found");
  }

  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword
  };
  req.session["user_id"] = userId;
  res.redirect("/urls");
});

// Log out requests
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/login");
});

// Server initialization
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});