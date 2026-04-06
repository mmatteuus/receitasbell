const { spawn } = require('child_process');

function addEnv(name, value) {
  return new Promise((resolve) => {
    // Note: use 'vercel.cmd' on windows
    const child = spawn('vercel.cmd', ['env', 'add', name, 'production']);
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[STDOUT ${name}]: ${output}`);
      if (output.includes("What's the value of") || output.includes('What?s the value')) {
         child.stdin.write(value + '\n');
      } else if (output.includes("Mark as sensitive") || output.includes("encrypted")) {
         child.stdin.write('n\n'); 
      }
    });

    child.stderr.on('data', (data) => {
      console.log(`[STDERR ${name}]: ${data.toString()}`);
    });

    child.on('exit', (code) => {
      console.log(`Finished ${name} with code ${code}`);
      resolve(code);
    });
  });
}

(async () => {
   console.log("Removing pre-existing vars...");
   await new Promise(r => spawn('vercel.cmd', ['env', 'rm', 'STRIPE_PUBLISHABLE_KEY', 'production', '-y']).on('exit', r));
   await new Promise(r => spawn('vercel.cmd', ['env', 'rm', 'STRIPE_SECRET_KEY', 'production', '-y']).on('exit', r));
   await new Promise(r => spawn('vercel.cmd', ['env', 'rm', 'STRIPE_WEBHOOK_SECRET', 'production', '-y']).on('exit', r));

   console.log("Adding vars interactively...");
   await addEnv('STRIPE_PUBLISHABLE_KEY', 'pk_live_51T4JafCuHeylIIjIkLjChNasO1Uvq7iiCMxEi3zYs2t6NPg6CLl5vUmVVEGeeWscqqssyOKJ5pA23yVs1z6CST5X00MrLSijqt');
   await addEnv('STRIPE_SECRET_KEY', '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');
   await addEnv('STRIPE_WEBHOOK_SECRET', 'whsec_8db724495e86d06d50ff1bba69784df6f991667b9319de812165f9037805cbcf');
})();
