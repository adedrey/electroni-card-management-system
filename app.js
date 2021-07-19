const express = require('express');
const connectDB = require('./config/database');
const path = require('path');
const authRouter = require('./routes/auth');
const adminRouter = require("./routes/admin");
const agentRouter = require("./routes/agent");
const userRouter = require("./routes/users");
const bodyParser = require('body-parser');
const app = express();

// Connect DB
connectDB();

app.use(bodyParser.json({
  limit: '50mb'
}))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/', express.static(path.join(__dirname, 'angular')));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, AdminAuthorization, UserAuthorization, ExcoAuthorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});


app.use('/api/admin', adminRouter);
app.use('/api/agent', agentRouter);
app.use('/api/user', userRouter);
app.use('/api', authRouter);
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
})
module.exports = app;