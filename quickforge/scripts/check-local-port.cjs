#!/usr/bin/env node
/**
 * Check whether a TCP port is in use on the local machine.
 * Usage: node scripts/check-local-port.cjs [port]
 */
const { execSync } = require('node:child_process')

const port = process.argv[2] || '5176'
const cmd =
  process.platform === 'win32'
    ? `netstat -an | findstr :${port}`
    : `lsof -i :${port} 2>/dev/null || netstat -an 2>/dev/null | grep :${port} || echo Port ${port} is free`

execSync(cmd, { stdio: 'inherit', shell: true })
