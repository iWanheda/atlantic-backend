require("dotenv").config();

const express = require("express"),
  cors = require("cors"),
  app = express(),
  router = express.Router(),
  mongoose = require("mongoose"),
  { Schema } = mongoose,
  PORT = process.env.SERVER_PORT;

mongoose.connect("mongodb://localhost:27017/atlantic");

const logSchema = new Schema({
  user: {
    name: String,
    ids: [String],
  },
  item: {
    label: String,
    name: String,
    quantity: Number,
  },
  type: Number,
  action: String,
  receiver: {
    name: String,
    ids: [String],
  },
  timestamp: Number,
});
const Log = mongoose.model("Logs", logSchema);

const LogType = { LOG_INVENTORY: 1, LOG_TRUNK: 2, LOG_HOUSE: 3 };

app.use(cors());
app.use(express.json());
app.use("/v2", router);
app.disable("x-powered-by");

router.post("/logs/post", async (req, res) => {
  // Extract these parameters from our request's body
  const { user, item, type, action, receiver, timestamp } = req.body;

  // If our parameters are valid
  if (!user || !item || !action || !receiver || !timestamp)
    return res.status(400).json({ error: "bad request" });

  // We create a new instance of our Log with our parameters
  const log = new Log({
    user,
    item: { label: item.label, name: item.name, quantity: item.quantity },
    type,
    action,
    receiver,
    timestamp,
  });
  // And we save it in the database
  await log.save();

  // Respond with 202 OK
  res.json("OK");
});

const pageSize = 20;

// /logs
router.get("/", async (req, res) => {
  // Extract page from URL query parameters
  const { page, query } = req.query;
  // Define an offset of documents to skip based on current page
  const offset = (page - 1) * pageSize;

  // If our offset is not valid (ie. input: -1) we return an error status with bad request
  if (offset < 0 || isNaN(offset))
    return res.status(400).json({ error: "bad request" });

  let logs = null;
  console.log("query:", query);

  // If our query is not null (!! to enforce a boolean) and our query's length is greater than 0
  if (!!query && query.length > 0) {
    // We APPEND this to our logs array
    logs = await Log.find({
      $or: [
        { "user.ids": { $regex: query } },
        { "receiver.ids": { $regex: query } },
        { "user.name": { $regex: query, $options: "i" } },
        { "receiver.name": { $regex: query, $options: "i" } },
      ],
    })
      .skip(offset) // Skip our offset (ie. Page 2)
      .limit(pageSize); // Limit the number of documents to page size
  } else {
    // FIXME: Not going thru when query is undefined???
    // We don't have a query
    console.log("no query");
    logs = await Log.find({}).skip(offset).limit(pageSize);
  }

  // Simple hasNextPage, re-do
  res.json({ hasNextPage: logs.length >= pageSize, data: logs });
});

// ALLOW ONLY LOCALHOST
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}/`);
});
