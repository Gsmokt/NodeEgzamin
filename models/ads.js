const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addSchema = new Schema({
     title: {
         type: String,
         required: true
     },
     description: {
         type: String,
         required: true
     },
     author : {
         type: String,
         required: true
     },
     category: {
         type: String,
         required: true
     },
     tags: {
         type: String,
         required: true
     },
     price: {
         type: String,
         required: false
     }
}, { timestamps: true });

const Add = mongoose.model('Add', addSchema);

module.exports = Add;