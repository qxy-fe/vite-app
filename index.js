#!/usr/bin/env node

const path = require('path')
const fs = require('fs-extra')
const prompts = require('prompts')
const execa = require('execa')
const hasYarn = require('has-yarn')
const argv = require('minimist')(process.argv.slice(2))
const { cyan, blue, yellow, bold, dim, green } = require('kolorist')

const cwd = process.cwd()
const pkgManager = hasYarn ? 'yarn' : 'npm'

const renameFiles = {
  _gitignore: '.gitignore',
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
    const existing = fs.readdirSync(root)

    if (existing.length) {
      const { yes } = await prompts({
        type: 'confirm',
        name: 'yes',
        initial: 'Y',
        message: 'Remove existing files and continue?',
      })

      if (yes) {
        fs.emptyDirSync(root)
      } else return
    }

    console.log(dim('  Scaffolding project in ') + targetDir + dim(' ...'))

    const templateDir = path.join(__dirname, 'template')

    const write = (file, content) => {
      const targetPath = renameFiles[file]
        ? path.join(root, renameFiles[file])
        : path.join(root, file)

      if (content) {
        fs.writeFileSync(targetPath, content)
      } else {
        fs.copySync(path.join(templateDir, file), targetPath)
      }
    }

    const files = fs.readdirSync(templateDir)

    for (const file of files.filter(f => f !== 'package.json')) {
      write(file)
    }

    const pkg = require(path.join(templateDir, 'package.json'))

    pkg.name = packageName

    write('package.json', JSON.stringify(pkg, null, 2))

    const related = path.relative(cwd, root)

    console.log(green('  Done.\n'))

    const { yes } = await prompts({
      type: 'confirm',
      name: 'yes',
      initial: 'Y',
      message: 'Install and start it now?',
    })

    if (yes) {
      await execa(pkgManager, ['install'], { stdio: 'inherit', cwd: root })
      await execa(pkgManager, ['dev'], { stdio: 'inherit', cwd: root })
    } else {
      console.log(dim('\n  start it later by:\n'))
      if (root !== cwd) console.log(blue(`  cd ${bold(related)}`))

      console.log(blue(`  ${pkgManager} install`))
      console.log(blue(`  ${pkgManager} dev`))
      console.log()
      console.log(`  ${cyan('●')} ${blue('■')} ${yellow('▲')}`)
      console.log()
    }
  }
}

async function getValidPackageName(projectName) {
  projectName = path.basename(projectName)

  const packageNameRegExp =
    /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
  if (packageNameRegExp.test(projectName)) {
    return projectName
  } else {
    const suggestedPackageName = projectName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^[._]/, '')
      .replace(/[^a-z0-9-~]+/g, '-')

    const { inputPackageName } = await prompts({
      type: 'text',
      name: 'inputPackageName',
      message: 'Package name:',
      initial: suggestedPackageName,
      validate: input =>
        packageNameRegExp.test(input) ? true : 'Invalid package.json name',
    })
    return inputPackageName
  }
}

init().catch(err => {
  console.error(err)
})
