const mongoose = require('mongoose');
require('dotenv').config();

console.log("Testing connection to:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error output:");
    console.error(err);
    process.exit(1);
  });
