const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors')
const app = express();
const port = process.env.PORT || 5000;

//middleware----------------
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.af4at.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// ----------------------------------------------
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
        app.post('/orders', async (req, res) => {
            const order = req.body;
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
    res.send("Ema jon server Running")
});

app.listen(port, () => {
    console.log('Server Running at port', port)
})