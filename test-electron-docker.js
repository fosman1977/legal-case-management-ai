// Test that simulates Electron environment with limited PATH
const { spawn, exec } = require('child_process');

console.log('=== Testing Docker access in Electron-like environment ===\n');

// Simulate Electron's limited PATH environment
const limitedEnv = {
  ...process.env,
  PATH: '/usr/bin:/bin:/usr/sbin:/sbin'  // Excludes /usr/local/bin
};

console.log('Current PATH:', process.env.PATH);
console.log('Limited PATH (simulating Electron):', limitedEnv.PATH);
console.log('');

// Test 1: Try with limited PATH (should fail)
console.log('Test 1: Docker with LIMITED PATH (simulating Electron default)');
const test1 = spawn('docker', ['--version'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: limitedEnv
});

test1.stdout.on('data', (data) => {
  console.log('✓ Unexpected success:', data.toString().trim());
});

test1.on('error', (error) => {
  if (error.code === 'ENOENT') {
    console.log('✗ Expected failure: spawn docker ENOENT');
    console.log('   This is the error you were seeing!\n');
  } else {
    console.log('✗ Different error:', error.message);
  }
  runTest2();
});

test1.on('close', () => {
  runTest2();
});

// Test 2: Try with PATH fix
function runTest2() {
  console.log('Test 2: Docker with FIXED PATH (includes /usr/local/bin)');
  const fixedEnv = {
    ...limitedEnv,
    PATH: `/usr/local/bin:${limitedEnv.PATH}`
  };
  
  const test2 = spawn('docker', ['--version'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: fixedEnv
  });

  test2.stdout.on('data', (data) => {
    console.log('✓ SUCCESS with PATH fix:', data.toString().trim());
    console.log('   The fix works!\n');
  });

  test2.on('error', (error) => {
    console.log('✗ Still failing:', error.message);
    console.log('   Docker might not be at /usr/local/bin\n');
  });
  
  test2.on('close', () => {
    testExecCommand();
  });
}

// Test 3: Test exec command with PATH fix
function testExecCommand() {
  console.log('Test 3: Testing exec() command with PATH fix');
  
  const options = {
    env: { ...process.env, PATH: `/usr/local/bin:${process.env.PATH}` }
  };
  
  exec('docker --version', options, (error, stdout, stderr) => {
    if (error) {
      console.log('✗ exec failed:', error.message);
    } else {
      console.log('✓ exec SUCCESS:', stdout.trim());
    }
    
    console.log('\n=== Summary ===');
    console.log('The PATH fix in dockerManager.ts should resolve the ENOENT error.');
    console.log('Both spawn() and exec() calls now include /usr/local/bin in PATH on macOS.');
  });
}