#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const execa = require('execa')
const argv = require('minimist')(process.argv.slice(2))
const { cyan, blue, yellow, bold, dim, green } = require('kolorist')
const { version } = require('./package.json')

const cwd = process.cwd()

const renameFiles = {
  _gitignore: '.gitignore',
}

/**
 * log given message in console
 * @param {string|string[]} msgs log message
 */
function log(msgs) {
  msgs = Array.isArray(msgs) ? msgs : [msgs]
  console.log()
  msgs.forEach(msg => console.log(msg))
  console.log()
}

async function init() {
  let targetDir = argv._[0]

  if (!targetDir) {
    const { projectName } = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'vite-demo',
    })

    targetDir = projectName
  }

  const packageName = await getValidPackageName(targetDir)
  const root = path.join(cwd, targetDir)

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  } else {
    const existing = fs.rmdirSync(root)

    if (existing.length) {
      const { yes } = await prompts({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message: 'Remove existing files and continue?',
      })

      if (yes) {
        emptyDir(root)
      } else return
    }

    const templateDir = path.join(__dirname, 'template')

    const write = (file, content) => {
      const targetPath = renameFiles[file]
        ? path.join(root, renameFiles[file])
        : path.join(root, file)

      if (content) {
        fs.writeFileSync(targetPath, content)
      } else {
        copy(path.join(templateDir, file), targetPath)
      }
    }

    const files = fs.readdirSync()
  }
}
