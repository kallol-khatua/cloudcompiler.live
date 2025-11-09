// Active jobs map (job_id → ptyProcess)
const activeJobs = new Map();


const addJob = (job_id, ptyProcess) => {
  activeJobs.set(job_id, ptyProcess);
}


// Terminate a running job
const terminateJob = (job_id) => {
  const process = activeJobs.get(job_id);

  if (process) {
    console.log(`Terminating job: ${job_id}`);
    process.kill(); // sends SIGTERM
    activeJobs.delete(job_id);
    return true;
  }

  return false;
}


module.exports = { addJob, terminateJob, activeJobs }