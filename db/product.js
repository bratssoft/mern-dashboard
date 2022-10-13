const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(                                  //schema for products fields

    {
        name: String,
        price: String,
        category: String,
        company: String,
        userId: String

    });

module.exports = mongoose.model('products', productSchema);             //model for products

