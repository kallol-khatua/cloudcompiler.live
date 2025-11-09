const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { runner } = require("./runner.js");


// aws credentials, access from env
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_REGION = process.env.AWS_REGION;

// Configure AWS client
const sqsClient = new SQSClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});


// access from env
const queueUrl = process.env.PYTHON_RUNNER_QUEUE;
let status = "READY";


const pollMessages = async () => {
  try {
    if (status !== "READY") {
      return setTimeout(pollMessages, 2000);
    }

    console.log("Polling for messages...");

    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20
    });

    const response = await sqsClient.send(command);

    if (!response.Messages || response.Messages.length === 0) {
      return pollMessages();
    }


    const message = response.Messages[0];
    const body = JSON.parse(message.Body);
    const job_id = body.job_id;

    console.log(`Received message [jobId=${job_id}]:`);


    // Delete 
    await sqsClient.send(new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: message.ReceiptHandle
    }));

    status = "RUNNING";

    const runCodeResult = await runner(body, job_id);;
    // console.log("run code result:", runCodeResult)

    status = "READY";
    setTimeout(pollMessages, 2000);
  } catch (err) {
    console.error("Error:", err);
    status = "READY";
    setTimeout(pollMessages, 2000);
  }
}


pollMessages();

module.exports = { pollMessages }