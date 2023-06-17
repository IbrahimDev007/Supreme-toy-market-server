const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = 3000;
//midleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

//mongodb work from here


const uri = `mongodb://127.0.0.1:27017`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const usersCollection = client.db("toymarketdb").collection("userDB");
        const toysCollection = client.db("toymarketdb").collection("toyListDB");

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_TOKEN, { expiresIn: '1h' })
            res.send({ token })
        })

        //users api

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists' })
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        //delete toy 
        app.delete('/toys/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.deleteOne(query);
            res.send(result);
        })
        //   update toy 
        app.patch('/toys/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const toy = req.body;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.updateOne(query, { $set: toy });
            res.send(result);
        })
        //get toys 
        app.get('/toys', async (req, res) => {
            const result = await toysCollection.find(query).toArray();
            res.send(result);
        })
        //toy post request
        app.post('/toys', verifyJWT, async (req, res) => {
            const toy = req.body;
            const result = await toysCollection.insertOne(toy);
            res.send(result);
        })
        //   single toy details show    
        app.get('/toy/details/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.findOne(query);
            res.send(result);
        })
        // my toy get 
        app.get('/mytoy/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await toysCollection.findOne(query);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('TOY MARKET DB  IS RUNNING')
})

app.listen(port, () => {
    console.log(`TOY MARKET IS RUNNING ${port}`);
})

