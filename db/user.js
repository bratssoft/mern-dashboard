const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(                         //this is schema we are defing the fields that we have to make

    {
        name: String,
        email: String,
        password: String
    }
);

module.exports = mongoose.model('users', userSchema);           //this is making model and then exporting it