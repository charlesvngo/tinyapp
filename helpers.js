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
const checkLoginCookie = (req, users) => {
  let output = {};
  // If no login is present or login is invalid
  if (!req.session.user_id || !users[req.session.user_id]) {
    output.userId = null;
    output.userEmail = null;
  } else {
    output.userId = req.session.user_id;
    output.userEmail = users[req.session.user_id].email;
  }
  return output;
};

// Function that checks if the user's email is within the database.
const getUserByEmail = (email, database) => {
  let user;
  for (const users in database) {
    if (database[users].email === email) {
      user = users;
    }
  }
  return user;
};

// Function that checks if the current user has any urls in the database.
const urlsForUser = (req, urlDatabase) => {
  let output = {};
  for (const shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userId === req.session.user_id) {
      output[shortUrl] = urlDatabase[shortUrl].longURL;
    }
  }
  return output;
};

module.exports = { generateRandomString, checkLoginCookie, getUserByEmail, urlsForUser };