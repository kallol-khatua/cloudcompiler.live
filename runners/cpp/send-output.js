// Compile and execute java program without input from the user
const dotenv = require("dotenv");
dotenv.config();
const Redis = require("ioredis");


const REDIS_CONFIG_ENDPOINT = process.env.REDIS_CONFIG_ENDPOINT;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_TRANSIT_ENCRYPTION_MODE = process.env.REDIS_TRANSIT_ENCRYPTION_MODE;

const redis = new Redis({
    host: REDIS_CONFIG_ENDPOINT,
    port: REDIS_PORT,
    tls: REDIS_TRANSIT_ENCRYPTION_MODE ==="true" ? {} : undefined
});


const publishMessage = async (job_id, sendData) => {
    await redis.publish(`job:${job_id}`, sendData);
    // console.log("Message published!", sendData);
}


module.exports = { publishMessage }