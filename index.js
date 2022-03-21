const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const admin = require("firebase-admin");
const ObjectId = require("mongodb").ObjectId;
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const fileUpload = require("express-fileupload");

//

const app = express();
const port = process.env.PORT || 5000;

//
//doctors-portal-adminsdk.json
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
// ডাটাকে parse করার জন্য ব্যবহার
app.use(express.json());
app.use(fileUpload());
// connect database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o4xkh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//admin
async function verifyToken(req, res, next) {
  if (req.headers?.authorization.startsWith("Bearer")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();

    const database = client.db("doctorsPortal");
    const serviceCollection = database.collection("services");
    const bookingCollection = database.collection("bookingAppointment");
    const appointmentsCollection = database.collection("appointments");
    const usersCollection = database.collection("users");
    const doctorsCollection = database.collection("doctors");

    // doctors collection start

    // get
    app.get("/doctors", async (req, res) => {
      const cursor = doctorsCollection.find({});
      const doctor = await cursor.toArray();
      res.json(doctor);
    });

    // post image file
    app.post("/doctors", async (req, res) => {
      const name = req.body.name;
      const email = req.body.email;
      const pic = req.files.image;
      //
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      const doctor = {
        name,
        email,
        image: imageBuffer,
      };
      //
      const result = await doctorsCollection.insertOne(doctor);
      res.json(result);
    });

    // GET api
    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find({}).toArray();
      res.json(result);
    });

    //
    app.get("/booking", async (req, res) => {
      const result = await bookingCollection.find({}).toArray();
      res.json(result);
    });

    //
    app.get("/appointments", verifyToken, async (req, res) => {
      const email = req.query.email;
      const date = req.query.date;

      const query = { email: email, date: date };

      const cursor = appointmentsCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });

    //
    app.get("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointmentsCollection.findOne(query);
      res.json(result);
    });

    //
    app.post("/appointments", async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);
      res.json(result);
    });

    // update api
    app.put("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: payment,
        },
      };
      const result = await appointmentsCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // get users
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    //save users in database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    // update
    app.put("/users", async (req, res) => {
      const user = req.body;
      // এটা দিয়ে চিক করবো ইউজার টা আছে কি নাই।
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    //
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      // console.log( 'put', req.decodedEmail);
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({ email: requester });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = {
            $set: {
              role: "admin",
            },
          };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res.status(403).json({ message: "You do not have permission to Admin" });
      }
    });

    // card
    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      // সবসময় খেয়াল রাখতে হবে প্রাইজ টা যেন ইনটেজার হয়.. না হইলে  এরর খাবে।
      const amount = paymentInfo.price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
//

app.get("/", (req, res) => {
  res.send("Welcome to Doctors Portal");
});

app.listen(port, () => {
  console.log("Listening to port", port);
});
