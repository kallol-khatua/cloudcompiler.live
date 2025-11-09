const { promises: fs } = require("fs");
const path = require("path");

const { compileJavaCode } = require("./compile-java-code");
const { runJavaCode } = require("./run-java-code");
const {subscribeToChannel, unsubscribeFromChannel} = require("./redis-subscriber")


function runCode(messageBody, job_id) {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log(messageBody)
      const file_name = messageBody.file_name;
      const source_code = messageBody.source_code;

      const jobsDir = path.resolve("jobs");
      await fs.mkdir(jobsDir, { recursive: true }); // ensure folder exists
      // console.log(jobsDir);

      const filePath = path.join(jobsDir, `${file_name}.java`);
      // console.log(filePath);

      // Write code to the file
      await fs.writeFile(filePath, source_code, "utf8");


      // compile
      console.log("compiling java code")
      const compilationResult = await compileJavaCode(`${file_name}.java`, job_id)
      console.log("Compilation result:", compilationResult)
      

      // subcribe to input event from redis
      // input:job_id
      subscribeToChannel(`input:${job_id}`);

      // runcode  
      console.log("running java code")
      const runJavaCodeResult = await runJavaCode(file_name, job_id)
      console.log("Run java code result:", runJavaCodeResult);

      unsubscribeFromChannel();

      // delete jobs/file_name.java & jobs/file_name.class files

      resolve({ job_id, filePath, status: "Code saved successfully" });
    } catch (err) {
      unsubscribeFromChannel();
      reject(err);
    }
  });
}


module.exports = { runCode }

// runCode({
//     "source_code": "hello",
//     "file_name": "Main",
//     "language": "java"
// }, "djjd")