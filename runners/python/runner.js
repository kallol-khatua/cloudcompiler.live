const { promises: fs } = require("fs");
const path = require("path");

const { runCode } = require("./run-code");
const { subscribeToChannel, unsubscribeFromChannel } = require("./redis-subscriber")


const runner = (messageBody, job_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log(messageBody)
      const file_name = messageBody.file_name;
      const source_code = messageBody.source_code;

      const jobsDir = path.resolve("jobs");
      await fs.mkdir(jobsDir, { recursive: true }); // ensure folder exists
      // console.log(jobsDir);

      const filePath = path.join(jobsDir, `${file_name}.py`);
      // console.log(filePath);

      // Write code to the file
      await fs.writeFile(filePath, source_code, "utf8");

      // subcribe to input event from redis
      // input:job_id
      subscribeToChannel(`input:${job_id}`);

      // runcode  
      console.log("running python code")
      const runCodeResult = await runCode(file_name, job_id)
      console.log("Run python code result:", runCodeResult);

      unsubscribeFromChannel();

      // delete jobs/file_name.cpp & jobs/file_name.exe files

      resolve({ job_id, filePath, status: "Code ran successfully" });
    } catch (err) {
      unsubscribeFromChannel();
      reject(err);
    }
  });
}


module.exports = { runner }

// runCode({
//     "source_code": "hello",
//     "file_name": "Main",
//     "language": "java"
// }, "djjd")