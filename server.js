const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const jwt = require("jsonwebtoken");
const extractJwt = require("passport-jwt").ExtractJwt;

app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const SECRETKEY = 'mysecret';

const users = [];
const highScores = [];
const options = {jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: SECRETKEY};

passport.use(new JWTStrategy(options, (jwtPayload, done) => {
  const user = users.find(user => user.userHandle === jwtPayload.userHandle);
  if (!user) {
    return done(null, false);
  }
  return done(null, user);
}));

app.post('/signup', (req, res) => {
  const { userHandle, password } = req.body;
  if (!userHandle || !password) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  if (userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  users.push({ userHandle, password });
  res.status(201).json({ message: 'User registered successfully' });
})

app.post('/login', (req, res) => {
  const { userHandle, password, ...extraFields } = req.body;
  if (!userHandle || !password) {
    return res.status(400).json({ error: 'Bad request'});
  }
  if (typeof userHandle !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: 'Bad request'});
  }
  if (Object.keys(extraFields).length > 0) {
    return res.status(400).json({ error: 'Bad request'});
  }
  const user = users.find(user => user.userHandle === userHandle && user.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized, incorrect username or password' });
  }
  const jsonWebToken = jwt.sign({ userHandle }, SECRETKEY);
  res.status(200).json({ jsonWebToken });
})

app.post('/high-scores', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;
  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  highScores.push({ level, userHandle, score, timestamp });
  res.status(201).json({ message: 'High scores posted successfully' });
})

app.get('/high-scores/', (req, res) => {
  const { level, page = 1 } = req.query;
  if (!level) {
    return res.status(400).json({ error: 'Missing parameter' });
  }
  const pageNum = Math.max(1, parseInt(page));
  const limit = 20;

  const scores = highScores.filter(score => score.level === level).sort((a, b) => b.score - a.score).slice((pageNum - 1) * limit, pageNum * limit);
  res.status(200).json(scores);
});


//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
