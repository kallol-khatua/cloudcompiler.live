const dotenv = require("dotenv");
dotenv.config();
const Redis = require("ioredis");
const { activeJobs } = require("./script")


const REDIS_CONFIG_ENDPOINT = process.env.REDIS_CONFIG_ENDPOINT;
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_TRANSIT_ENCRYPTION_MODE = process.env.REDIS_TRANSIT_ENCRYPTION_MODE;

// Create a Redis client for subscribing
const subscriber = new Redis({
    host: REDIS_CONFIG_ENDPOINT,
    port: REDIS_PORT,
    tls: REDIS_TRANSIT_ENCRYPTION_MODE ==="true" ? {} : undefined
});


// Handle connection events
subscriber.on('connect', () => {
    console.log('✅ Connected to Redis server');
});

subscriber.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

subscriber.on('ready', () => {
    console.log('🚀 Redis client is ready');
});

// Handle incoming messages
subscriber.on('message', (channel, message) => {
    console.log(`\n📨 [${channel}] Received:`, message);

    const job_id = channel.split(":")[1];

    const ptyProcess = activeJobs.get(job_id)
    if (!ptyProcess) {
        return;
    }

    const data = JSON.parse(message);

    if (data.event_type === "INPUT_EVENT") {
        const content = data.content
        console.log("INPUT_EVENT ", content)
        ptyProcess.write(data.content);
    } else if (data.event_type === "SESSION_CLOSED_EVENT") {
        // stop execution
        // Kill the PTY process
        console.log("\nKilling PTY process...");
        process.kill(ptyProcess.pid, 'SIGKILL');  // or 'SIGTERM' for graceful
    }
});

// Handle subscription events
subscriber.on('subscribe', (channel, count) => {
    console.log(`✅ Successfully subscribed to channel: ${channel}`);
    console.log(`📊 Total subscribed channels: ${count}`);
});

subscriber.on('unsubscribe', (channel, count) => {
    console.log(`❌ Unsubscribed from channel: ${channel}`);
    console.log(`📊 Remaining subscribed channels: ${count}`);
});

const subscribeToChannel = (channelName) => {
    // Subscribe to a channel
    subscriber.subscribe(channelName, (err, count) => {
        if (err) {
            console.error("Failed to subscribe:", err);
        } else {
            console.log(`Subscribed successfully! Now subscribed to ${count} channel(s).`);
        }
    });
}

// Unsubscribe function
const unsubscribeFromChannel = () => {
    subscriber.unsubscribe((err, count) => {
        if (err) {
            console.error("❌ Failed to unsubscribe from all channels:", err);
        } else {
            console.log(`🚪 Unsubscribed from ALL channels. Remaining subscriptions: ${count}`);
        }
    });
};

module.exports = { subscribeToChannel, unsubscribeFromChannel }