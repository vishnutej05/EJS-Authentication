const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initDb = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => console.log("Success"));
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

initDb();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;

  const user = await db.get(selectUserQuery);

  // console.log(username, name, password);

  if (user === undefined) {
    //create user

    const createQuery = `INSERT INTO user(username, name, password, gender, location)
    VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;

    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUser = await db.run(createQuery);
      response.send("User created successfully");
    }
  } else {
    //already exists
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;

  const selectQuery = `SELECT * FROM user WHERE username = '${username}'`;

  const user = await db.get(selectQuery);

  //   console.log(password, user.password);

  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isSame = await bcrypt.compare(password, user.password);
    if (isSame === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUser = `SELECT * FROM user WHERE username = '${username}';`;
  const user = await db.get(selectUser);

  console.log(user.password, oldPassword);

  if (user === undefined) {
    response.send("User not registered");
  } else {
    const isSame = await bcrypt.compare(oldPassword, user.password);

    if (isSame === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updateHashedPass = await bcrypt.hash(newPassword, 10);
        const passUpdate = `
          UPDATE user
          SET password = '${updateHashedPass}'
          WHERE username = '${username}'`;
        await db.run(passUpdate);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
