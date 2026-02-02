
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('util');

const uri = "mongodb+srv://nitheeshs:nitheesh149@bus.bpygbsj.mongodb.net/Consultancy_db?retryWrites=true&w=majority&appName=BUS";

mongoose.connect(uri)
    .then(() => console.log('Connected to Atlas DB'))
    .catch(err => console.error(err));

const materialSchema = new mongoose.Schema({
    name: String,
    quantity: Number
}, { strict: false });

const Material = mongoose.model('Material', materialSchema, 'materials');

async function fixStock() {
    try {
        const result = await Material.updateMany(
            { quantity: { $lt: 0 } },
            { $set: { quantity: 0 } }
        );

        console.log("Stock fix complete.");
        console.log(`Matched (Negative): ${result.matchedCount}`);
        console.log(`Modified to 0: ${result.modifiedCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        setTimeout(() => mongoose.disconnect(), 1000);
    }
}

fixStock();
