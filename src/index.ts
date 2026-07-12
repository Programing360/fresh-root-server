
import express, { type Request, type Response}  from 'express';

import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
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


    app.get('/products', async(req: Request, res: Response) => {
      const result = await productCollection.find().toArray()
      res.send(result)
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

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