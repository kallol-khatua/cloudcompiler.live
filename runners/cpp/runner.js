const { promises: fs } = require("fs");
const path = require("path");

const { compileCode } = require("./compile-code");
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

      const filePath = path.join(jobsDir, `${file_name}.cpp`);
      // console.log(filePath);

      // Write code to the file
      await fs.writeFile(filePath, source_code, "utf8");


      // compile
      console.log("compiling cpp code")
      const compilationResult = await compileCode(`${file_name}.cpp`, job_id)
      console.log("Compilation result:", compilationResult)


      // subcribe to input event from redis
      // input:job_id
      subscribeToChannel(`input:${job_id}`);

      // runcode  
      console.log("running cpp code")
      const runCodeResult = await runCode(file_name, job_id)
      console.log("Run cpp code result:", runCodeResult);

      unsubscribeFromChannel();

      // delete jobs/file_name.cpp & jobs/file_name.exe files

      resolve({ job_id, filePath, status: "Code saved successfully" });
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