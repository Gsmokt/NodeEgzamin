const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addSchema = new Schema({
     title: {
         type: String,
         required: [true, 'Title required']
     },
     description: {
         type: String,
         required: [true, 'Description required']
     },
     author : {
         type: String,
         required: [true, 'Author name required']
     },
     category: {
         type: String,
         required: [true, 'Choose category']
     },
     tags: {
         type: String,
         required: [true, 'Tags required']
     },
     price: {
         type: String,
         required: false
     }
}, { timestamps: true });

const Add = mongoose.model('Add', addSchema);

module.exports = Add;