const { assert } = require('chai');

const { getUserByEmail, generateRandomString } = require('../helpers.js');

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