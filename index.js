const express = require('express');
const cors = require("cors");                                               //this package is used to fix CORS(Cross-Origin Resource Sharing) error

require('./db/config');                                                     //importing db connection file
const User = require('./db/user');                                          //importing model and schema file
const Product = require('./db/product');                                    //importing product schema and model file

const Jwt = require('jsonwebtoken');                                        //importing jwt token package
const jwtKey = 'project';                                                   //making key of that token that should be secret

const app = express();

app.use(cors())                                                             //it is use as a middleware to fix cors sometimes when we hit an api browser considers it as a insecure api it consider it come from a different domain so it block it                             
app.use(express.json());                                                    //for getting data from postman body

app.post('/register', async (req, resp) => {

    let user = new User(req.body);
    let result = await user.save();

    result = result.toObject();                                              //to delete password from users info first we have to convert info into object
    delete result.password;                                                  //then delete password

    Jwt.sign({ result }, jwtKey, { expiresIn: '12h' }, (err, token) => {      //same jwt token method in register api as in login api

        if (err) {
            resp.send({ result: 'Something went wrong. Please try later' })
        }
        resp.send({ result, auth: token })
    })

});

app.post('/login', async (req, resp) => {

    if (req.body.email && req.body.password)                                 //this is to check if both fields are provided or not if yes only then api will go and fetch data from db
    {
        let user = await User.findOne(req.body).select('-password');         //this api will fetch the matching entry which we will put in postman body + -password means it will remove password from the data 
        if (user) {

            Jwt.sign({ user }, jwtKey, { expiresIn: '12h' }, (err, token) => {  //if system found user in local storage then it should generate a token t0his is fixed syntax of jwt token firstly that user { user } secondly jwtKey that key we have created above third { expiresIn: '12h' } token expiry time its optional

                if (err)                                                        //after 12 hours this part will be run
                {
                    resp.send({ result: 'Something went wrong. Please try later' })
                }
                resp.send({ user, auth: token })                              //if it recives token then send user all information and that token in response
            })

        }
        else {
            resp.send({ Result: 'No User Found' })
        }
    }
    else                                                                     //otherwise this 
    {
        resp.send({ Result: 'No User Found' })
    }

});

app.post('/add-product', verifyToken, async (req, resp) => {

    let product = new Product(req.body);                                      //this api will take product details from postman body and save it in db
    let result = await product.save();
    resp.send(result);
});

app.get('/products', verifyToken, async (req, resp) => {

    let products = await Product.find();                                     //product listing api
    if (products.length > 0) {                                               //to check if there is any product or not
        resp.send(products)
    }
    else {
        resp.send({ result: "No products found" })
    }
});

app.delete('/product/:id', verifyToken, async (req, resp) => {                           //api for deleting an entry by id
    const result = await Product.deleteOne({ _id: req.params.id });         //its id will be in postman url
    resp.send(result);
});

app.get('/product/:id', verifyToken, async (req, resp) => {                              //two APIs can have same routes as above and this have '/product/:id' no prob but if their methods are same then issue exists
    let result = await Product.findOne({ _id: req.params.id });             //finding that product on the base of id on which user has clickd to update
    if (result) {
        resp.send(result)
    }
    else {
        resp.send({ result: 'No record found' })
    }
});

app.put('/product/:id', verifyToken, async (req, resp) => {
    let result = await Product.updateOne(

        { _id: req.params.id },                                               //update that record thats id is in params
        {
            $set: req.body                                                    //and set it equal to that which is in postman's body
        }
    )
    resp.send(result);
});

app.get('/search/:key', verifyToken, async (req, resp) => {                   //verifyToken is that middleware which will verify token
    let result = await Product.find(

        {
            '$or': [                                                          //when we want to find in multiple fields then use $or
                { name: { $regex: req.params.key } },                         //standarized method for searching its mean we want to serach the word that is in url params in name field
                { price: { $regex: req.params.key } },
                { category: { $regex: req.params.key } },
                { company: { $regex: req.params.key } }
            ]
        }
    )
    resp.send(result);
});

function verifyToken(req, resp, next) {                                         //this middleware is for token authentication if a function is with these three parameters then ot in not a function instead it is a middleware
    let token = req.headers['authorization'];

    if (token)                                                                  //it checks if there is some token
    {
        token = token.split(' ')[1];                                            //we have added bearer word before actual token in postman header so now we have to collect only that token so split will split whole arrya into two arryas on the basis of space we have added in bearer and actual token + we are acessing 2nd index that split has created this is actual token so thats why [1]
        
        // console.warn('middleware called', token);                            //just for checking middleware is working or not

        Jwt.verify(token, jwtKey, (err, valid) => {                             //to verify token there is .verify function fisrt param is token 2nd is that key 3rd is call back function

            if (err) {
                resp.status(401).send({ result: 'please provide valid token' })  //if provided token in postman header is incorrect then this will run + .status is for changing status of response in postmna 401 usually for invalid entry
            }
            else {
                next();                                                          //this next continues process flow otherwise it will be loading long time
            }

        })
    }

    else {
        resp.status(403).send({ result: 'please add token with headers' })       //if there is no token provided so this will run + 403 is usually for no provided
    }
}

app.listen(5000);