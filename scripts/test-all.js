#!/usr/bin/env node

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStatus(message) {
  log(`[INFO] ${message}`, 'blue')
}

function logSuccess(message) {
  log(`[SUCCESS] ${message}`, 'green')
}

function logError(message) {
  log(`[ERROR] ${message}`, 'red')
}

function logWarning(message) {
  log(`[WARNING] ${message}`, 'yellow')
}

function checkDocker() {
  try {
    execSync('docker info', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function checkDatabase() {
  try {
    const output = execSync('docker compose ps', { encoding: 'utf-8' })
    return output.includes('db') && output.includes('Up')
  } catch {
    return false
  }
}

function startDatabase() {
  logStatus('Levantando base de datos...')
  try {
    execSync('docker compose up -d', { stdio: 'inherit' })
    return true
  } catch (error) {
    logError('Error levantando base de datos')
    return false
  }
}

function getDbContainerId() {
  try {
    const output = execSync('docker compose ps -q db', { encoding: 'utf-8' }).trim()
    return output || null
  } catch {
    return null
  }
}

function waitForDatabase(maxAttempts = 30, delayMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      attempts++
      const containerId = getDbContainerId()
      if (!containerId) {
        if (attempts >= maxAttempts) {
          reject(new Error('Contenedor de base de datos no encontrado'))
        } else {
          setTimeout(check, delayMs)
        }
        return
      }
      
      try {
        execSync(`docker exec ${containerId} pg_isready -U sju -d sju_dev`, {
          stdio: 'ignore'
        })
        resolve(true)
      } catch {
        if (attempts >= maxAttempts) {
          reject(new Error('Base de datos no disponible después de máximo intentos'))
        } else {
          setTimeout(check, delayMs)
        }
      }
    }
    check()
  })
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    })
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Comando falló con código ${code}`))
      }
    })
    
    proc.on('error', reject)
  })
}

async function main() {
  log('🧪 Ejecutando suite completa de pruebas...', 'blue')
  
  logStatus('Verificando Docker...')
  if (!checkDocker()) {
    logError('Docker no está corriendo')
    process.exit(1)
  }
  logSuccess('Docker encontrado')
  
  logStatus('Verificando base de datos...')
  if (!checkDatabase()) {
    if (!startDatabase()) {
      logError('No se pudo levantar la base de datos')
      process.exit(1)
    }
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  try {
    logStatus('Esperando a que la base de datos esté lista...')
    await waitForDatabase()
    logSuccess('Base de datos disponible')
  } catch (error) {
    logError('Base de datos no disponible')
    process.exit(1)
  }
  
  logStatus('Ejecutando tests de API...')
  try {
    await runCommand('npm', ['run', 'test'], { cwd: path.join(__dirname, '..', 'apps', 'api') })
    logSuccess('Tests de API pasaron')
  } catch (error) {
    logError('Tests de API fallaron')
    process.exit(1)
  }
  
  logStatus('Ejecutando tests E2E...')
  try {
    await runCommand('npm', ['run', 'test:e2e'], { cwd: path.join(__dirname, '..', 'apps', 'web') })
    logSuccess('Tests E2E pasaron')
  } catch (error) {
    logWarning('Algunos tests E2E fallaron o fueron skipeados')
    if (process.env.CI === 'true') {
      logError('Tests E2E fallaron en CI')
      process.exit(1)
    } else {
      logWarning('Continuando a pesar de fallos en E2E (modo desarrollo)')
    }
  }
  
  logSuccess('🎉 ¡Suite de pruebas completada!')
}

main().catch((error) => {
  logError(`Error: ${error.message}`)
  process.exit(1)
})

