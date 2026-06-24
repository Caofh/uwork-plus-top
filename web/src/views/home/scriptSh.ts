const sh_script = [
  {
    name: 'installBrew',
    needDialog: false, // 安装是否需要交互式终端
    preCommand: 'brew -v',
    command: `/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"`,
  },
  {
    name: 'installGit',
    needDialog: false, // 安装是否需要交互式终端
    preCommand: 'git --version',
    command: `brew install git && git --version`,
  },
  {
    name: 'installNvm',
    needDialog: false, // 安装是否需要交互式终端
    preCommand: 'nvm -v',
    command: `brew install nvm && echo "\n# from UworkPlus\nexport NVM_DIR=~/.nvm\nsource $(brew --prefix nvm)/nvm.sh" >> ~/.bash_profile && source ~/.bash_profile && nvm ls && nvm install 20.19.2 && nvm alias default 20.19.2 && echo '\n# from UworkPlus\nsource ~/.bash_profile' >> ~/.zshrc && source ~/.zshrc`,
  },
  {
    name: 'installNrm',
    needDialog: false, // 安装是否需要交互式终端
    preCommand: 'nrm -V',
    command: `npm install nrm -g && nrm ls`,
  },
  {
    name: 'installYarn',
    needDialog: false, // 安装是否需要交互式终端
    preCommand: 'yarn -v',
    command: `npm install yarn -g && yarn -v`,
  },

  //   {
  //     needDialog: false, // 安装是否需要交互式终端
  //     preCommand: "nvm use 14.17.3",
  //     command: `arch -x86_64 zsh && nvm install 14.17.3`,
  //   },
]

export { sh_script }
