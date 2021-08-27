/* eslint-disable no-restricted-syntax */
/* eslint-disable no-restricted-globals */

const fs = require('fs-extra')
const execa = require('execa')
const path = require('path')
const chalk = require('chalk')
const { gzipSync } = require('zlib')
const { compress } = require('brotli')

const args = require('minimist')(process.argv.slice(2))
const { targets: allTargets, fuzzyMatchTarget } = require('./utils')

const targets = args._
const sourceMap = args.sourcemap || args.s
const formats = args.formats || args.f
const devOnly = args.devOnly || args.d
const prodOnly = !devOnly && (args.prodOnly || args.p)
const isRelease = args.release
const buildTypes = args.t || args.types
const buildAllMatching = args.all || args.a
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

run()

async function run() {
  if (!targets.length) {
    await buildAll(allTargets)
    checkAllSizes(allTargets)
  } else {
    const matchedTargetTargets = fuzzyMatchTarget(targets, buildAllMatching)
    await buildAll(matchedTargetTargets)
    checkAllSizes(matchedTargetTargets)
  }
}

async function buildAll(targets) {
  await runParallel(require('os').cpus().length, targets, build)
}

// 并行打包逻辑
async function runParallel(maxConcurrency, source, iteratorFn) {
  const ret = []
  const executing = []
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source))
    ret.push(p)

    if (maxConcurrency <= source.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }
  }
  return Promise.all(ret)
}

async function build(target) {
  const pkgDir = path.resolve(`packages/${target}`)
  const pkg = require(`${pkgDir}/package.json`)

  if ((isRelease || !targets.length) && pkg.private) {
    return
  }

  const env =
    (pkg.buildOptions && pkg.buildOptions.env) ||
    (devOnly ? 'development' : 'production')

  await execa(
    'rollup',
    [
      '-c',
      '--environment',
      [
        `COMMIT:${commit}`,
        `NODE_ENV:${env}`,
        `TARGET:${target}`,
        formats ? `FORMATS:${formats}` : ``,
        buildTypes ? `TYPES:true` : ``,
        prodOnly ? `PROD_ONLY:true` : ``,
        sourceMap ? `SOURCE_MAP:true` : ``,
      ]
        .filter(Boolean)
        .join(','),
    ],
    { stdio: 'inherit' },
  )

  // TODO: use api-extractor
}

function checkAllSizes(targets) {
  if (devOnly) {
    return
  }
  console.log()
  for (const target of targets) {
    checkSize(target)
  }
  console.log()
}

function checkSize(target) {
  const pkgDir = path.resolve(`packages/${target}`)
  checkFileSize(`${pkgDir}/dist/${target}.global.prod.js`)
  checkFileSize(`${pkgDir}/dist/${target}.runtime.global.prod.js`)
}

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }
  const file = fs.readFileSync(filePath)
  const minSize = (file.length / 1024).toFixed(2) + 'kb'
  const gzipped = gzipSync(file)
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
  const compressed = compress(file)
  const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb'
  console.log(
    `${chalk.gray(
      chalk.bold(path.basename(filePath)),
    )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`,
  )
}
