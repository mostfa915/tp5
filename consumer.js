const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const messageSchema = new mongoose.Schema({
    value: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'test-group' });
const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'test-topic', fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                value: message.value.toString(),
            });
            const newMessage = new Message({
                value: message.value.toString()
            });
            await newMessage.save();
        },
    });
};
run().catch(console.error);

const express = require('express');
const app = express();
const port = 3000;

app.get('/messages', async (req, res) => { 
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});
