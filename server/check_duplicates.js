
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('util');

const uri = "mongodb+srv://nitheeshs:nitheesh149@bus.bpygbsj.mongodb.net/Consultancy_db?retryWrites=true&w=majority&appName=BUS";

mongoose.connect(uri)
    .then(() => console.log('Connected to Atlas DB'))
    .catch(err => console.error(err));

const materialSchema = new mongoose.Schema({
    name: String,
    quantity: Number,
    unit: String
}, { strict: false });

const Material = mongoose.model('Material', materialSchema, 'materials');

const logFile = fs.createWriteStream('duplicates.txt', { flags: 'w' });
const log = (d) => {
    console.log(d);
    logFile.write(util.format(d) + '\n');
};

async function checkDuplicates() {
    try {
        const materials = await Material.find({});
        log(`Total materials found: ${materials.length}`);

        const nameMap = {};

        materials.forEach(m => {
            const name = m.name || "UNKNOWN_NAME";
            if (!nameMap[name]) {
                nameMap[name] = [];
            }
            nameMap[name].push({ id: m._id, quantity: m.quantity, unit: m.unit });
        });

        let foundDuplicates = false;
        for (const [name, items] of Object.entries(nameMap)) {
            if (items.length > 1) {
                log(`Duplicate found for: ${name}`);
                items.forEach(item => {
                    log(` - ID: ${item.id}, Qty: ${item.quantity} ${item.unit}`);
                });
                foundDuplicates = true;
            }
        }

        if (!foundDuplicates) {
            log("No exact name duplicates found.");
        }

        // Check "ACETIC" specifically
        const acetic = materials.filter(m => m.name && m.name.includes('ACETIC'));
        log("\n--- 'ACETIC' Matches ---");
        acetic.forEach(m => log(`Name: "${m.name}", Qty: ${m.quantity}, ID: ${m._id}`));

    } catch (e) {
        log(e);
    } finally {
        // Wait for buffer to flush
        setTimeout(() => {
            mongoose.disconnect();
        }, 1000);
    }
}

checkDuplicates();
