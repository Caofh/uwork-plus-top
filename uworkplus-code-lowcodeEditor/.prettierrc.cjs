// Prettier 配置文件
// 用于统一代码格式化规则

module.exports = {
  // 不使用分号结尾
  semi: false,
  
  // 使用单引号而不是双引号
  singleQuote: true,
  
  // 每行最大字符数
  printWidth: 100,
  
  // 缩进宽度
  tabWidth: 2,
  
  // 使用空格而不是制表符
  useTabs: false,
  
  // 尾随逗号 (es5: 在ES5中有效的尾随逗号)
  trailingComma: 'es5',
  
  // 对象字面量的大括号间是否有空格
  bracketSpacing: true,
  
  // 箭头函数参数只有一个时是否要有小括号
  arrowParens: 'avoid',
  
  // 换行符使用 lf
  endOfLine: 'lf',
  
  // Vue 文件特定配置
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue'
      }
    }
  ]
}
