const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const bodyParser = require(`body-parser`);
const cookieSession = require('cookie-session');
const app = express();
const { generateRandomString, validateLoginCookie, getUserByEmail, urlsForUser } = require('./helpers');
const PORT = 8080;

// Database of urls and shortened urls. Urls are registed to specific users.
const urlDatabase = {};

// User database.
const users = {};

// Setting EJS as the template engine.
app.set("view engine", "ejs");

// Middleware to debug connections and parse the buffer when performing post requests.
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const generateErrorPage = (userId, usersDatabase, statusCode, errorMessage) => {
  const templateVars = validateLoginCookie(userId, usersDatabase);
  templateVars.statusCode = statusCode;
  templateVars.errorMessage = errorMessage;
  return templateVars;
};

// Home page. If logged in, redirect to urls index, if not then login page.
app.get("/", (req, res) => {
  const templateVars = validateLoginCookie(req.session.user_id, users);
  if (templateVars.id) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

// New user registration page. If user is already registered, will redirect to urls homepage.
app.get("/register", (req, res) => {
  const templateVars = validateLoginCookie(req.session.user_id, users);
  if (templateVars.id) {
    return res.redirect("/urls");
  }
  res.render("user_register", templateVars);
});

// Log in page. If user is already registered, will redirect to urls homepage.
app.get("/login", (req, res) => {
  const templateVars = validateLoginCookie(req.session.user_id, users);
  if (templateVars.id) {
    return res.redirect("/urls");
  }
  res.render("user_login", templateVars);
});

// URL database page
app.get("/urls", (req, res) => {
  let templateVars = validateLoginCookie(req.session.user_id, users);
  // If user is not logged in send error.
  if (templateVars.id === null) {
    templateVars = generateErrorPage(req.session.user_id, users, 401, "Please login or register to see your URLs.");
    return res.status(401).render("errors", templateVars);
  }
  templateVars.urls = urlsForUser(req.session.user_id, urlDatabase);
  res.render("urls_index", templateVars);
});

// Create a new URL to be shortened
app.get("/urls/new", (req, res) => {
  const templateVars = validateLoginCookie(req.session.user_id, users);
  // If user is not logged in, redirect to login page.
  if (!templateVars.id) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// Create pages for the shortURLs in the database
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = validateLoginCookie(req.session.user_id, users);
  // If user is not logged in, send error.
  if (templateVars.id === null) {
    templateVars = generateErrorPage(req.session.user_id, users, 401, "Please login to edit your URLs.");
    return res.status(401).render("errors", templateVars);
  }

  // If user does not own the current shortURL, send error.
  if (templateVars.id !== urlDatabase[req.params.shortURL].userId) {
    templateVars = generateErrorPage(req.session.user_id, users, 403, "Invalid URL to edit.");
    return res.status(403).render("errors", templateVars);
  }
  templateVars.shortURL = req.params.shortURL;
  templateVars.longURL = urlDatabase[req.params.shortURL].longURL;
  res.render("urls_show", templateVars);
});

// Short URL redirect link
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = generateErrorPage(req.session.user_id, users, 404, "ShortURL does not exist");
    return res.status(400).render("errors", templateVars);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// Output a .json containing all urls and shortURLS.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Adding new short URLs to the database.
app.post("/urls", (req, res) => {
  // Check if logged in. If not, send 403.
  if (!req.session.user_id) {
    const templateVars = generateErrorPage(req.session.user_id, users, 403, "Please log in to create a short URL");
    return res.status(403).render("errors", templateVars);
  }
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = {
    longURL: req.body.longURL,
    userId: req.session.user_id
  };
  res.redirect(`/urls/${newShortUrl}`);
});

// Modifying short URLs
app.post("/urls/:shortURL", (req, res) => {
  // If user is not logged in send error.
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userId) {
    const templateVars = generateErrorPage(req.session.user_id, users, 403, "Invalid URL to edit.");
    return res.status(403).render("errors", templateVars);
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Removing short URLs from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userId) {
    const templateVars = generateErrorPage(req.session.user_id, users, 403, "Invalid URL to delete.");
    return res.status(403).render("errors", templateVars);
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Log in requests
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let foundUserId = null;
  // Check if email and password are truthy
  if (!email || !password) {
    const templateVars = generateErrorPage(req.session.user_id, users, 401, "Invalid email or password");
    return res.status(401).render("errors", templateVars);
  }

  // Check if email is in current database
  foundUserId = getUserByEmail(email, users);

  // If email is not in system
  if (!foundUserId) {
    const templateVars = generateErrorPage(req.session.user_id, users, 403, "No user found");
    return res.status(403).render("errors", templateVars);
  }

  // Check if password is correct
  if (!bcrypt.compareSync(password, users[foundUserId].password)) {
    const templateVars = generateErrorPage(req.session.user_id, users, 403, "Incorrect Password");
    return res.status(403).render("errors", templateVars);
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
    const templateVars = generateErrorPage(req.session.user_id, users, 403, "Invalid email or password");
    return res.status(403).render("errors", templateVars);
  }
  // Check for duplicate emails.
  if (getUserByEmail(email, users)) {
    const templateVars = generateErrorPage(req.session.user_id, users, 403, "Account with email already exists");
    return res.status(403).render("errors", templateVars);
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
  res.clearCookie("session").clearCookie("session.sig").redirect("/login");
});

// Server initialization
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});