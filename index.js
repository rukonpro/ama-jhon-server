const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors');

var admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 5000;



///firebasee admin initialization---------------



var serviceAccount = require("./ema-jhon-fb925-firebase-adminsdk-wqb12-dccc5d934d.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
console.log(serviceAccount)
//middleware----------------
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.af4at.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// ----------------------------------------------


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        try {
            const decodeUser = await admin.auth().verifyIdToken(idToken)
            req.decodedUserEmail = decodeUser.email;
        } catch {

        }
    }
    // console.log(req.headers.authorization.split('Bearer ')[1])

    next();
}
async function run() {
    try {
        await client.connect();
        const database = client.db('online_shop');
        const productCollection = database.collection('products');
        const orderCollection = database.collection('orders');

        //get products api-----------------------------------
        app.get('/products', async (req, res) => {
            // console.log(req.query)
            const cursor = productCollection.find({});
            const page = req.query.page;
            const size = Number(req.query.size);
            let products;
            const count = await cursor.count();
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray()
            } else {
                products = await cursor.toArray();
            }


            res.send({ count, products })
        });
        //use Post to get data bye keys
        app.post('/products/bykeys', async (req, res) => {
            // console.log(req.body)
            const keys = req.body;
            const query = { key: { $in: keys } }
            const products = await productCollection.find(query).toArray();
            res.json(products)
        });

        //add orders api
        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query.email;

            if (req.decodedUserEmail === email) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.json(orders)
            } else {
                res.status(404).json({ message: 'User not authorized' })
            }


        })
        app.post('/orders', async (req, res) => {

            const order = req.body;
            order.createAt = new Date();
            const result = await orderCollection.insertOne(order);

            res.json(result);
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir)


// -------------------------------------------------
app.get('/', (req, res) => {
    res.send("Ema jon server Running ")
});

app.listen(port, () => {
    console.log('Ema jon server Running port', port)
})