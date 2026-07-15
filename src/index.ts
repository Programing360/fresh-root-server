import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  type WithId,
  type Document,
} from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// const PORT = process.env.PORT || 5000;

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

declare global {
  namespace Express {
    interface Request {
      user?: WithId<Document> | null;
    }
  }
}

app.get("/", async (req: Request, res: Response) => {
  res.send("Server is running successfully 🚀");
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

async function run() {
  try {
    // await client.connect();

    const db = client.db("fresh_root");
    const productCollection = db.collection("products");
    const userCollection = db.collection("user");

    // Verification Center----------------------------------------------------
    const verifyToken = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).send({ message: "unauthorize access" });
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "unauthorize access" });
      }

      const query = { token: token };

      const session = await userCollection.findOne(query);

      const userId = session?.userId;
      const user = await userCollection.findOne({
        _id: userId,
      });

      req.user = user;

      next();
    };

    // const verifyUser = (req: Request, res: Response, next: NextFunction) => {
    //   if (req.user?.role !== "user" && req.user?.role !== "admin") {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }
    //   next();
    // };

    // const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
    //   if (req.user?.role !== "admin") {
    //     return res.status(403).send({ message: "forbidden access" });
    //   }
    //   next();
    // };

    app.get("/products", async (req: Request, res: Response) => {
      const { category, sort, search } = req.query;

      const queryObj: any = {};
      
      if (category && typeof category === "string") {
        queryObj.category = category;
      }

      if (search && typeof search === "string") {
        queryObj.title = { $regex: search, $options: "i" };
      }

      let sortObj: any = {};

      if (sort === "low-to-high") {
        sortObj.price = 1;
      } else if (sort === "high-to-low") {
        sortObj.price = -1;
      } else if (sort === "rating") {
        sortObj.rating = -1;
      } else {
        sortObj.createdAt = -1;
      }

      const result = await productCollection.find(queryObj).sort(sortObj).toArray();

      res.send(result);
    });

    // product get by Id---------------------------------------------------------------
    app.get(
      "/product/:id",

      async (req: Request, res: Response) => {
        try {
          const id = req.params.id;

          if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid product ID" });
          }

          // if (!ObjectId.isValid(id)) {
          //   return res.status(400).json({ message: "Invalid product ID" });
          // }

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
      },
    );

    // porduct add api ---------------------------------------------------

    app.post(
      "/api/item/add",
      verifyToken,
      async (req: Request, res: Response) => {
        const data = req.body;
        const newData = {
          ...data,
          createAt: new Date(),
        };

        const result = await productCollection.insertOne(newData);
        res.send(result);
      },
    );

    // product Update api ------------------------------------------------

    app.patch(
      "/api/product-update/:id",
      verifyToken,
      async (req: Request, res: Response) => {
        const id = req.params.id;
        const updateData = req.body;
        delete updateData._id;
        if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }

        // if (!ObjectId.isValid(id)) {
        //   return res.status(400).json({ message: "Invalid product ID" });
        // }

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

    app.delete(
      "/api/delete/:id",
      verifyToken,
      async (req: Request, res: Response) => {
        const id = req.params.id;

        if (!id || typeof id !== "string" || !ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid product ID" });
        }

        // if (!ObjectId.isValid(id)) {
        //   return res.status(400).json({ message: "Invalid product ID" });
        // }

        const query = { _id: new ObjectId(id) };

        const result = await productCollection.deleteOne(query);
        res.send(result);
      },
    );

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } catch (err) {
    console.error(err);
  }
}

run().catch(console.dir);

export default app;
