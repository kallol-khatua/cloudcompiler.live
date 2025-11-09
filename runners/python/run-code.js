// Compile and execute java program with infinite loop detection
const pty = require("node-pty");
const path = require("path");
const pidusage = require('pidusage');

const { publishMessage } = require("./send-output");
const { terminateJob, addJob } = require("./script.js");

let pending = Promise.resolve();

const runCode = (file_name, job_id, options = {}) => {
    return new Promise(async (resolve, reject) => {
        // Configuration options with defaults
        const config = {
            // maxExecutionTime: options.maxExecutionTime || 30000, // 30 seconds default
            // maxOutputSize: options.maxOutputSize || 1024 * 1024, // 1MB default

            maxOutputLines: options.maxOutputLines || 5000, // 5k lines default

            cpuCheckInterval: options.cpuCheckInterval || 500, // Check every 0.5 second
            maxCpuUsage: options.maxCpuUsage || 85, // 85% CPU threshold
            cpuCheckDuration: options.cpuCheckDuration || 6000, // 6 seconds of high CPU

            memoryLimit: options.memoryLimit || "800m", // 800MB memory limit
            enableResourceMonitoring: options.enableResourceMonitoring !== false // Default true
        };

        const jobsDir = path.resolve("jobs");

        // Track metrics
        // let outputSize = 0;
        let outputLines = 0;

        let lastActivityTime = Date.now();
        let processStartTime = Date.now();
        let highCpuStartTime = null;
        let isTerminated = false;

        let cpuMonitor = null;
        let activityMonitor = null;
        

        const ptyProcess = pty.spawn("bash", ["-c", `stty -echo; python3 ${file_name}.py`], {
            name: "dumb",
            cols: 100,
            rows: 30,
            cwd: jobsDir,
            env: process.env,
        });

        addJob(job_id, ptyProcess);



        // Helper function to terminate the process
        const terminateProcess = (reason, exitCode = 2) => {
            if (isTerminated) return;
            isTerminated = true;

            console.log(`Terminating process: ${reason}`);

            // Clear all timers
            if (cpuMonitor) clearInterval(cpuMonitor);
            if (activityMonitor) clearInterval(activityMonitor);

            // Kill the process
            try {
                console.log("\nTerminating PTY process...");
                process.kill(ptyProcess.pid, 'SIGKILL');
            } catch (e) {
                console.error("Error killing process:", e);
            }

            const executionTime = Date.now() - processStartTime;

            // Send termination message
            const sendData = {
                job_id: job_id,
                type: "TERMINATION",
                content: {
                    exitCode: exitCode,
                    reason: reason,
                    // ===============================
                    // TODO time and memory usage
                    // ===============================
                    metrics: {
                        executionTime,
                    }
                }
            };


            pending = pending.then(() =>
                publishMessage(job_id, JSON.stringify(sendData))
            );

            terminateJob(job_id);

            setTimeout(() => {
                reject({
                    job_id,
                    message: reason,
                    metrics: {
                        executionTime,
                        outputLines
                    }
                });
            }, 1000);
        };


        // ===============================================
        // TODO:
        // CPU usage monitoring
        // ===============================================
        if (config.enableResourceMonitoring && ptyProcess.pid) {
            cpuMonitor = setInterval(async () => {
                try {
                    const stats = await pidusage(ptyProcess.pid);
                    // console.log("CPU usage", stats)

                    if (stats.cpu > config.maxCpuUsage) {
                        if (!highCpuStartTime) {
                            highCpuStartTime = Date.now();
                        } else if (Date.now() - highCpuStartTime > config.cpuCheckDuration) {
                            // ===========================================
                            terminateProcess(`High CPU usage: Process used > ${config.maxCpuUsage}% CPU for ${config.cpuCheckDuration}ms`);
                            // ===========================================
                        }
                    } else {
                        highCpuStartTime = null; // Reset if CPU usage drops
                    }

                    // Check memory usage
                    if (stats.memory > parseInt(config.memoryLimit) * 1024 * 1024) {
                        // ============================================
                        terminateProcess(`Memory limit exceeded: Process used more than ${config.memoryLimit}`);
                        // ============================================
                    }
                } catch (e) {
                    // pidusage might not be available or process might have ended
                    console.log("CPU monitoring error:", e.message);
                }
            }, config.cpuCheckInterval);
        }



        // ===============================================
        // TODO:
        // Activity monitoring - detect if process is producing no output for 30 sec
        // first send 2 - 3 warning then terminate the process
        // ===============================================
        activityMonitor = setInterval(() => {
            const timeSinceLastActivity = Date.now() - lastActivityTime;
            // If no output for 30 seconds but process is still running, it might be stuck
            if (timeSinceLastActivity > 30000 && !isTerminated) {
                console.log(`Warning: No output for ${timeSinceLastActivity}ms`);

                // ======================================
                terminateProcess(`Process appears to be stuck (no output for 30+ seconds)`);
                // ======================================
            }
        }, 10000); // Check every 10 seconds



        // Handle process output
        ptyProcess.onData((data) => {
            // if already terminated means stop by system 
            // send halted message
            if (isTerminated) return;

            const dataStr = data.toString();
            // console.log("ptyProcess stdout:");
            // console.log(dataStr);

            // Update metrics
            lastActivityTime = Date.now();
            // outputSize += dataStr.length;
            outputLines += (dataStr.match(/\n/g) || []).length + 1;

            // Check output size limit
            // if (outputSize > config.maxOutputSize) {
            //     terminateProcess(`Output size limit exceeded: >${config.maxOutputSize} bytes`);
            //     return;
            // }

            // Check output lines limit
            if (outputLines > config.maxOutputLines) {
                terminateProcess(`Output lines limit exceeded: > ${config.maxOutputLines} lines`);
                return;
            }

            const sendData = {
                job_id: job_id,
                type: "STDOUT",
                content: dataStr,
            };

            pending = pending.then(() =>
                publishMessage(job_id, JSON.stringify(sendData))
            );
        });



        // Handle process exit
        ptyProcess.onExit(({ exitCode, signal }) => {
            // if already terminated means stop by system 
            // send halted message
            if (isTerminated) return; // Already handled

            console.log("ptyProcess");
            console.log(`Exited with code ${exitCode}, signal ${signal}`);

            // Clear timers
            if (cpuMonitor) clearInterval(cpuMonitor);
            if (activityMonitor) clearInterval(activityMonitor);

            const executionTime = Date.now() - processStartTime;

            if (exitCode === 0) {
                console.log("Python code run successfully");

                const sendData = {
                    job_id: job_id,
                    type: "COMPLETION",
                    content: {
                        exitCode: exitCode,
                        // ===============================
                        // TODO time and memory usage
                        // ===============================
                        metrics: {
                            executionTime,
                        }
                    },
                };

                pending = pending.then(() =>
                    publishMessage(job_id, JSON.stringify(sendData))

                );

                resolve({
                    job_id,
                    message: "Python code run successfully",
                    metrics: {
                        executionTime,
                        outputLines
                    }
                });

            } else if (exitCode === 1) {
                console.log("Failed to run code");

                const sendData = {
                    job_id: job_id,
                    type: "COMPLETION",
                    content: {
                        exitCode: exitCode,
                        // ===============================
                        // TODO time and memory usage
                        // ===============================
                        metrics: {
                            executionTime,
                        }
                    },
                };

                pending = pending.then(() =>
                    publishMessage(job_id, JSON.stringify(sendData))
                );

                reject({ job_id, message: "Failed to run code" });
            }

            terminateJob(job_id);
        });
    });
};


module.exports = {
    runCode
};