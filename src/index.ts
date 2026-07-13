import express, { type Request, type Response } from "express";

import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import cors from "cors";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI as string;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("fresh_root");
    const productCollection = db.collection("products");

    app.get("/products", async (req: Request, res: Response) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    // product get by Id---------------------------------------------------------------
    app.get("/product/:id", async (req: Request, res: Response) => {
      try {
        const id = req.params.id;

        if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }

        const result = await productCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // porduct add api ---------------------------------------------------

    app.post("/api/item/add", async (req: Request, res: Response) => {
      const data = req.body;
      const newData = {
        ...data,
        createAt: new Date(),
      };

      const result = await productCollection.insertOne(newData);
      res.send(result);
    });

    // product Update api ------------------------------------------------

    app.patch(
      "/api/product-update/:id",
      async (req: Request, res: Response) => {
        const id = req.params.id;
        const updateData = req.body;
        delete updateData._id; // _id কখনো update করা যাবে না
        if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }

        const query = { _id: new ObjectId(id) };

        const updateInfo = {
          $set: updateData,
        };

        const result = await productCollection.updateOne(query, updateInfo);
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Product not found" });
        }

        res.send(result);
      },
    );

    // product delete api -------------------------------------------------

    app.delete("/api/delete/:id", async (req: Request, res: Response) => {
      const id = req.params.id;

      if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const query = { _id: new ObjectId(id) };

      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    app.get("/", async (req: Request, res: Response) => {
      res.send("Server is running successfully 🚀");
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);
