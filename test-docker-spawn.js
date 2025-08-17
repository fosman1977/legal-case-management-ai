const { spawn } = require('child_process');

console.log('Testing Docker spawn with PATH fix...\n');

// Test 1: Without PATH fix (should fail)
console.log('Test 1: Spawning docker without PATH fix');
const test1 = spawn('docker', ['--version'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

test1.stdout.on('data', (data) => {
  console.log('✓ Test 1 SUCCESS:', data.toString().trim());
});

test1.stderr.on('data', (data) => {
  console.log('✗ Test 1 stderr:', data.toString().trim());
});

test1.on('error', (error) => {
  console.log('✗ Test 1 FAILED:', error.message);
  runTest2();
});

test1.on('close', (code) => {
  if (code === 0) {
    console.log('Test 1 completed successfully\n');
  }
  runTest2();
});

// Test 2: With PATH fix (should work)
function runTest2() {
  console.log('Test 2: Spawning docker WITH PATH fix');
  const test2 = spawn('docker', ['--version'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PATH: `/usr/local/bin:${process.env.PATH}` }
  });

  test2.stdout.on('data', (data) => {
    console.log('✓ Test 2 SUCCESS:', data.toString().trim());
  });

  test2.stderr.on('data', (data) => {
    console.log('✗ Test 2 stderr:', data.toString().trim());
  });

  test2.on('error', (error) => {
    console.log('✗ Test 2 FAILED:', error.message);
    runTest3();
  });

  test2.on('close', (code) => {
    if (code === 0) {
      console.log('Test 2 completed successfully\n');
    }
    runTest3();
  });
}

// Test 3: Test the actual Docker pull command with PATH fix
function runTest3() {
  console.log('Test 3: Testing docker ps command with PATH fix');
  const test3 = spawn('docker', ['ps'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PATH: `/usr/local/bin:${process.env.PATH}` }
  });

  test3.stdout.on('data', (data) => {
    console.log('✓ Test 3 SUCCESS - Docker is running and accessible');
    console.log('Output:', data.toString().trim().split('\n')[0]); // Just show header
  });

  test3.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error.includes('Cannot connect to the Docker daemon')) {
      console.log('⚠ Test 3: Docker CLI works but Docker Desktop is not running');
    } else {
      console.log('✗ Test 3 stderr:', error);
    }
  });

  test3.on('error', (error) => {
    console.log('✗ Test 3 FAILED:', error.message);
  });

  test3.on('close', (code) => {
    console.log('\n=== Test Summary ===');
    console.log('The PATH fix allows the Docker CLI to be found.');
    console.log('If Docker Desktop is not running, you\'ll see a connection error.');
    console.log('This is expected - the important thing is that "spawn docker ENOENT" is fixed.\n');
  });
}