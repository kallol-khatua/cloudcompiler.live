// Compile and execute java program without input from the user
const dotenv = require("dotenv");
dotenv.config();
const pty = require("node-pty");
const path = require("path");

const { publishMessage } = require("./send-output.js")
const { terminateJob, addJob } = require("./script.js")


let pending = Promise.resolve();


const compileJavaCode = (file_name, job_id) => {

    return new Promise(async (resolve, reject) => {

        const jobsDir = path.resolve("jobs");
        let processStartTime = Date.now();

        const ptyProcess = pty.spawn("javac", [file_name], {
            name: "xterm-color",
            cols: 100,
            rows: 30,
            cwd: jobsDir,
            env: process.env,
        });

        addJob(job_id, ptyProcess);


        // only emit errors, if compilation is successfull then it will not emit any data
        ptyProcess.onData((data) => {
            // console.log("ptyProcess stderr:")
            // console.log(data.toString());


            const sendData = {
                job_id: job_id,
                type: "STDERR",
                content: data.toString(),
            }

            pending = pending.then(() =>
                publishMessage(job_id, JSON.stringify(sendData))
            );
        });


        // if exit compilation successfull then exitcode will be 0
        // so call runJavaCodeFunction
        // if failed then exit the process
        ptyProcess.onExit(({ exitCode, signal }) => {
            console.log("ptyProcess")
            console.log(`Exited with code ${exitCode}, signal ${signal}`);

            if (exitCode == 0) {
                // compilation successfull
                console.log("java code compiled successfully");


                resolve({ job_id, "message": "java code compiled successfully" });

            } else if (exitCode == 1) {
                // compilation failed
                console.log("Failed to compile code")

                const sendData = {
                    job_id: job_id,
                    type: "COMPLETION",
                    content: {
                        exitCode: exitCode,
                        // ===============================
                        // TODO time and memory usage
                        // ===============================
                        metrics: {
                            executionTime: Date.now() - processStartTime,
                        }
                    },
                };

                pending = pending.then(() =>
                    publishMessage(job_id, JSON.stringify(sendData))
                );

                reject({ job_id, "message": "Failed to compile code" });
            }

            terminateJob(job_id)
        });
    });
}


module.exports = { compileJavaCode }