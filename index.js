const express = require("express");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;

const app = express();
const port = process.env.PORT || 5000;

// use app
app.use(cors());
app.use(express.json());

// mongodb connect with my server
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o4xkh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();

    const database = client.db("medical-health-clinic");
    const servicesCollection = await database.collection("services");
    const appointmentsCollection = await database.collection("appointments");

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
    app.get("/allAppointments", async (req, res) => {
      const result = await appointmentsCollection.find({}).toArray();
      res.json(result);
    });
    // find one service
    app.get("/allServices/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);
      res.json(service);
    });
    app.get("/exploreServices/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await servicesCollection.findOne(query);
      res.json(service);
    });

    // POST
    app.post("/patientAppointments", async (req, res) => {
      const appointment = req.body;
      console.log(appointment);
      const result = await appointmentsCollection.insertOne(appointment);
      res.json(result);
    });

    // delete
    app.delete("/allAppointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointmentsCollection.deleteOne(query);
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
