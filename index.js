const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mongodb connection string
const { MongoClient } = require("mongodb");
const uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.19q2o.mongodb.net:27017,cluster0-shard-00-01.19q2o.mongodb.net:27017,cluster0-shard-00-02.19q2o.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-9mitof-shard-0&authSource=admin&retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();

    const database = client.db("watchStore");
    const watchCollection = database.collection("watchCollections");
    const ordersCollection = database.collection("orders");
    const usersCollection = database.collection("users");
    const reviewsCollection = database.collection("reviews");

    //Save users
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // Check admin
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

    // Make Admin
    app.put("/users/makeAdmin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          role: "admin"
        }
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // Get all watchCollection
    app.get("/watchCollection", async (req, res) => {
      const query = {};
      const result = await watchCollection.find(query).toArray();
      res.json(result);
    });

    // Get watch info by id
    app.get("/watchCollection/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await watchCollection.findOne(query);
      res.send(result);
    });

    // add product
    app.post("/addProduct", async (req, res) => {
      const result = await watchCollection.insertOne(req.body);
      res.send(result);
    });

    // delete Product
    app.delete("/deleteProduct/:id", async (req, res) => {
      const result = await watchCollection.deleteOne({
        _id: ObjectId(req.params.id)
      });
      res.send(result);
    });

    //Place Order
    app.post("/placeOrder", async (req, res) => {
      const result = await ordersCollection.insertOne(req.body);
      res.send(result);
    });

    // get all Orders
    app.get("/allOrders", async (req, res) => {
      const result = await ordersCollection.find({}).toArray();
      res.send(result);
    });

    // get orders by email
    app.get("/orders/:email", async (req, res) => {
      const result = await ordersCollection
        .find({
          email: req.params.email
        })
        .toArray();
      res.send(result);
    });

    //Update order status to shipped
    app.put("/updateOrder/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "shipped"
        }
      };
      const result = await ordersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // delete order
    app.delete("/deleteOrder/:id", async (req, res) => {
      const result = await ordersCollection.deleteOne({
        _id: ObjectId(req.params.id)
      });
      res.send(result);
    });

    // Get all reviews
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find({}).toArray();
      res.send(result);
    });

    //Add Reviews
    app.post("/addReview", async (req, res) => {
      const result = await reviewsCollection.insertOne(req.body);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// Server home
app.get("/", (req, res) => {
  res.send("Chrono dial Watch server home");
});

app.listen(port, () => {
  console.log("listening to port ", port);
});
