const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

const app = express();
const port = express.port || 5000;

// use app
app.use(cors());

// mongodb connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o4xkh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();

    const database = client.db("medical-health-clinic");
    const servicesCollection = await database.collection("services");

    // GET API
    app.get("/allServices", async (req, res) => {
      const result = await servicesCollection.find({}).limit(6).toArray();
      res.json(result);
    });
    // all services GET
    app.get("/exploreServices", async (req, res) => {
      const result = await servicesCollection.find({}).toArray();
      res.json(result);
    });
  } finally {
    // await client.close();s
  }
}

run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Welcome to Medical Health Clinic");
});

app.listen(port, () => {
  console.log("Listening server on port: ", port);
});

// .env setup
// DB_USER=medical-health-clinic
// DB_PASS=2ME73KdWsjsRh7X5
