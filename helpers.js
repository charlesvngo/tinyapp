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

// Function will check the current login cookie. If not present or invalid credentials, will set to null
const validateLoginCookie = (id, users) => {
  let output = {};
  // If no login is present or login is invalid
  if (!id || !users[id]) {
    output.id = null;
    output.userEmail = null;
  } else {
    output.id = id;
    output.userEmail = users[id].email;
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
const urlsForUser = (id, urlDatabase) => {
  let output = {};
  for (const shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].userId === id) {
      output[shortUrl] = urlDatabase[shortUrl].longURL;
    }
  }
  return output;
};

module.exports = { generateRandomString, validateLoginCookie, getUserByEmail, urlsForUser };