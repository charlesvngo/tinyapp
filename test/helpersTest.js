const { assert } = require('chai');

const { getUserByEmail, generateRandomString, checkLoginCookie, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrls = {
  "urlRandomID": {
    longURL: "http://www.example1.com",
    userId: "userRandomID"
  },
  "url2RandomID": {
    longURL: "http://www.example2.com",
    userId: "user2RandomID"
  },
  "url3RandomID": {
    longURL: "http://www.example3.com",
    userId: "user2RandomID"
  },
  
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.strictEqual(user, expectedUserID);
  });
  
  it('should return undefined if the user is not in the database.', function() {
    const user = getUserByEmail("user3@example.com", testUsers);
    const expectedUserID = undefined;
    // Write your assert statement here
    assert.strictEqual(user, expectedUserID);
  });

});

describe('generateRandomString', function() {
  it('should return a string with a length of 6 characters', function() {
    const expectedLength = 6;
    const randomString = generateRandomString();

    assert.strictEqual(randomString.length, expectedLength);
  });
  
  it('Calling the function twice should return different strings', function() {
    const firstRandomString = generateRandomString();
    const secondRandomString = generateRandomString();

    assert.notStrictEqual(firstRandomString, secondRandomString);
  });
  
});

describe('checkLoginCookie', function() {
  it('Should return an object with the correct user id and email if found', function() {
    const output = checkLoginCookie("userRandomID", testUsers);
    const expectedOutput = { id: "userRandomID", userEmail: "user@example.com" };
    assert.deepStrictEqual(output, expectedOutput);
  });
  
  it('Should return an object with a null user & email if not found.', function() {
    const output = checkLoginCookie("user3RandomID", testUsers);
    const expectedOutput = { id: null, userEmail: null };
    assert.deepStrictEqual(output, expectedOutput);
  });
  
  it('Should return an object with a null user & email if no arguments were passed.', function() {
    const output = checkLoginCookie();
    const expectedOutput = { id: null, userEmail: null };
    assert.deepStrictEqual(output, expectedOutput);
  });
  
});


describe('urlsForUser', function() {
  it('Should return an object with the shortURL as the key and longURL as the value', function() {
    const output = urlsForUser("userRandomID", testUrls);
    const expectedOutput = { "urlRandomID" : "http://www.example1.com" };
    assert.deepStrictEqual(output, expectedOutput);
  });
  
  it('If there are multiple matches, the object must contain all', function() {
    const output = urlsForUser("user2RandomID", testUrls);
    const expectedOutput = {
      "url2RandomID" : "http://www.example2.com",
      "url3RandomID" : "http://www.example3.com"
    };
    assert.deepStrictEqual(output, expectedOutput);
  });
  
  it('If there no matches, object will be empty', function() {
    const output = urlsForUser("user3RandomID", testUrls);
    const expectedOutput = {};
    assert.deepStrictEqual(output, expectedOutput);
  });


  
  // it('Should return an object with a null user & email if no arguments were passed.', function() {
  //   const output = checkLoginCookie();
  //   const expectedOutput = { id: null, userEmail: null };
  //   assert.deepStrictEqual(output, expectedOutput);
  // });
  
});