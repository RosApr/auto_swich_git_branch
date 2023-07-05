const path = require('path')
const fs = require('fs')
const shell = require('shelljs')
const { SelectVersion } = require('./select')

const CONFIG = {
  versionPath: './config.json',
  versionConfig: {},
  targetVersion: '',
}
updateVersionConfig()
new SelectVersion([...Object.keys(CONFIG.versionConfig)])
  .start()
  .onSelect(async function (selectedVersion) {
    CONFIG.targetVersion = selectedVersion
    await promised(checkAliasProjectsExist)
    await promised(checkTargetVersionProjectsGitBranchExist)
    await promised(switch2TargetVersion)
  })
function updateVersionConfig() {
  const dataStr = fs.readFileSync(CONFIG.versionPath, 'utf-8')
  CONFIG.versionConfig = JSON.parse(dataStr)
}
function getTargetUpdateVersionConfig() {
  return Object.entries(CONFIG.versionConfig[CONFIG.targetVersion])
}
function promised(fn) {
  return new Promise((resolve, reject) => {
    try {
      resolve(fn())
    } catch (e) {
      console.log(`Error: ${e.message}`)
    }
  })
}
function checkAliasProjectsExist() {
  console.log('开始检查依赖项目是否存在')
  const config = getTargetUpdateVersionConfig()
  for (let [key, project] of config) {
    const { diskPath, isExist } = checkProjectExist(project.path)
    if (!isExist) {
      throw Error(
        `${key}: 磁盘路径: ${diskPath} 路径解析异常，请检查是否安装或配置异常!`
      )
    }
    console.log(`项目: ${key} 磁盘路径: ${diskPath} success!`)
  }
  console.log('依赖项目检查完毕 success')
}
function checkProjectExist(relativePath) {
  const diskPath = path.resolve(__dirname, relativePath)
  return {
    diskPath,
    isExist: fs.existsSync(diskPath),
  }
}
function checkTargetVersionProjectsGitBranchExist() {
  console.log('开始检查依赖项目分支是否存在')
  const config = getTargetUpdateVersionConfig()
  for (let [key, project] of config) {
    shell.cd(project.path)
    if (
      shell.exec(`git ls-remote --exit-code --heads origin ${project.branch}`)
        .code !== 0
    ) {
      throw Error(
        `项目: ${key} 目标分支: ${project.branch} 不存在!, 请检查配置文件!`
      )
    }
    shell.cd(path.resolve(__dirname))
    console.log(`项目: ${key} 目标分支: ${project.branch}  目标分支存在!`)
  }
  console.log('依赖项目分支检查完毕 success')
}
function switch2TargetVersion() {
  console.log('开始切换至目标分支, 切换分支前会将当前工作区未提交内容重置!')
  const config = getTargetUpdateVersionConfig()
  for (let [key, project] of config) {
    shell.cd(project.path)
    shell.exec('git checkout .')
    shell.exec('git clean -fd')
    shell.exec(`git checkout -B ${project.branch} origin/${project.branch}`)
    console.log('拉取目标分支最新代码 start')
    shell.exec(`git pull origin ${project.branch}`)
    console.log('拉取目标分支最新代码 over')
    shell.cd(path.resolve(__dirname))
    console.log(`项目: ${key} 目标分支: ${project.branch} success`)
  }
  console.log('依赖项目分支切换完毕 success')
}
