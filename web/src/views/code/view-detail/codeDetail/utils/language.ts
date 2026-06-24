/**
 * Monaco Editor 支持的所有编程语言列表
 * 基于 Monaco Editor 官方文档和 VS Code 支持的语言
 * 包含语言标识符、显示名称和文件扩展名
 */

const monacoEditorLanguages = [
  // 主要编程语言
  { language: 'javascript', name: 'JavaScript', extensions: ['.js', '.es6', '.jsx', '.mjs'] },
  { language: 'typescript', name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  {
    language: 'python',
    name: 'Python',
    extensions: ['.py', '.rpy', '.pyw', '.cpy', '.gyp', '.gypi'],
  },
  { language: 'java', name: 'Java', extensions: ['.java', '.jav'] },
  { language: 'c', name: 'C', extensions: ['.c', '.h'] },
  { language: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'] },
  { language: 'csharp', name: 'C#', extensions: ['.cs', '.csx', '.cake'] },
  { language: 'php', name: 'PHP', extensions: ['.php', '.php4', '.php5', '.phtml', '.ctp'] },
  { language: 'ruby', name: 'Ruby', extensions: ['.rb', '.rbx', '.rjs', '.gemspec', '.pp'] },
  { language: 'go', name: 'Go', extensions: ['.go'] },
  { language: 'rust', name: 'Rust', extensions: ['.rs', '.rlib'] },
  { language: 'swift', name: 'Swift', extensions: ['.swift'] },
  { language: 'kotlin', name: 'Kotlin', extensions: ['.kt'] },
  { language: 'scala', name: 'Scala', extensions: ['.scala', '.sc', '.sbt'] },
  { language: 'dart', name: 'Dart', extensions: ['.dart'] },
  { language: 'r', name: 'R', extensions: ['.r', '.rhistory', '.rmd', '.rprofile', '.rt'] },
  { language: 'julia', name: 'Julia', extensions: ['.jl'] },
  { language: 'lua', name: 'Lua', extensions: ['.lua'] },
  { language: 'perl', name: 'Perl', extensions: ['.pl'] },
  { language: 'pascal', name: 'Pascal', extensions: ['.pas', '.p', '.pp'] },
  { language: 'vb', name: 'Visual Basic', extensions: ['.vb'] },
  { language: 'objective-c', name: 'Objective-C', extensions: ['.m'] },
  { language: 'clojure', name: 'Clojure', extensions: ['.clj', '.cljs', '.cljc', '.edn'] },
  {
    language: 'fsharp',
    name: 'F#',
    extensions: ['.fs', '.fsi', '.ml', '.mli', '.fsx', '.fsscript'],
  },
  { language: 'scheme', name: 'Scheme', extensions: ['.scm', '.ss', '.sch', '.rkt'] },
  { language: 'coffeescript', name: 'CoffeeScript', extensions: ['.coffee'] },

  // Web 技术
  {
    language: 'html',
    name: 'HTML',
    extensions: ['.html', '.htm', '.shtml', '.xhtml', '.mdoc', '.jsp', '.asp', '.aspx', '.jshtm'],
  },
  { language: 'css', name: 'CSS', extensions: ['.css'] },
  { language: 'scss', name: 'SCSS', extensions: ['.scss'] },
  { language: 'less', name: 'Less', extensions: ['.less'] },
  {
    language: 'xml',
    name: 'XML',
    extensions: [
      '.xml',
      '.dtd',
      '.ascx',
      '.csproj',
      '.config',
      '.wxi',
      '.wxl',
      '.wxs',
      '.xaml',
      '.svg',
      '.svgz',
      '.opf',
      '.xsl',
    ],
  },
  { language: 'yaml', name: 'YAML', extensions: ['.yaml', '.yml'] },
  { language: 'json', name: 'JSON', extensions: ['.json'] },
  {
    language: 'markdown',
    name: 'Markdown',
    extensions: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd', '.mdwn', '.mdtxt', '.mdtext'],
  },
  { language: 'handlebars', name: 'Handlebars', extensions: ['.handlebars', '.hbs'] },
  { language: 'pug', name: 'Pug', extensions: ['.jade', '.pug'] },
  { language: 'twig', name: 'Twig', extensions: ['.twig'] },
  { language: 'razor', name: 'Razor', extensions: ['.cshtml'] },
  { language: 'vue', name: 'Vue', extensions: ['.vue'] },

  // 数据库和查询语言
  { language: 'sql', name: 'SQL', extensions: ['.sql'] },
  { language: 'mysql', name: 'MySQL', extensions: [] },
  { language: 'pgsql', name: 'PostgreSQL', extensions: [] },
  { language: 'redis', name: 'Redis', extensions: ['.redis'] },
  { language: 'graphql', name: 'GraphQL', extensions: ['.graphql', '.gql'] },
  { language: 'msdax', name: 'DAX', extensions: ['.dax', '.msdax'] },
  { language: 'powerquery', name: 'Power Query', extensions: ['.pq', '.pqm'] },

  // 配置和脚本语言
  { language: 'ini', name: 'INI', extensions: ['.ini', '.properties', '.gitconfig'] },
  { language: 'dockerfile', name: 'Dockerfile', extensions: ['.dockerfile'] },
  { language: 'powershell', name: 'PowerShell', extensions: ['.ps1', '.psm1', '.psd1'] },
  { language: 'shell', name: 'Shell', extensions: ['.sh', '.bash'] },
  { language: 'bat', name: 'Batch', extensions: ['.bat', '.cmd'] },
  { language: 'hcl', name: 'HCL', extensions: ['.tf', '.tfvars', '.hcl'] },

  // 专业领域语言
  { language: 'abap', name: 'ABAP', extensions: ['.abap'] },
  { language: 'apex', name: 'Apex', extensions: ['.cls'] },
  { language: 'azcli', name: 'Azure CLI', extensions: ['.azcli'] },
  { language: 'cameligo', name: 'CameLIGO', extensions: ['.mligo'] },
  { language: 'csp', name: 'CSP', extensions: [] },
  { language: 'ecl', name: 'ECL', extensions: ['.ecl'] },
  { language: 'lexon', name: 'Lexon', extensions: ['.lex'] },
  { language: 'm3', name: 'Modula-3', extensions: ['.m3', '.i3', '.mg', '.ig'] },
  { language: 'mips', name: 'MIPS Assembly', extensions: ['.s'] },
  { language: 'pascaligo', name: 'PascalIGO', extensions: ['.ligo'] },
  { language: 'postiats', name: 'ATS', extensions: ['.dats', '.sats', '.hats'] },
  { language: 'redshift', name: 'Redshift', extensions: [] },
  { language: 'restructuredtext', name: 'reStructuredText', extensions: ['.rst'] },
  { language: 'sb', name: 'Small Basic', extensions: ['.sb'] },
  { language: 'sophia', name: 'Sophia', extensions: ['.aes'] },
  { language: 'sol', name: 'Solidity', extensions: ['.sol'] },
  { language: 'st', name: 'Structured Text', extensions: ['.st', '.iecst', '.iecplc', '.lc3lib'] },
  { language: 'systemverilog', name: 'SystemVerilog', extensions: ['.sv', '.svh'] },
  { language: 'tcl', name: 'TCL', extensions: ['.tcl'] },
  { language: 'verilog', name: 'Verilog', extensions: ['.v', '.vh'] },

  // 其他
  { language: 'plaintext', name: 'Plain Text', extensions: [] },
]

/**
 * 获取所有支持的语言标识符
 * @returns {string[]} 语言标识符数组
 */
export function getAllLanguageIds() {
  return monacoEditorLanguages.map(lang => lang.language)
}

/**
 * 获取所有支持的语言显示名称
 * @returns {string[]} 语言显示名称数组
 */
export function getAllLanguageNames() {
  return monacoEditorLanguages.map(lang => lang.name)
}

/**
 * 根据语言标识符获取语言信息
 * @param {string} languageId - 语言标识符
 * @returns {Object|null} 语言信息对象或null
 */
export function getLanguageInfo(languageId) {
  return monacoEditorLanguages.find(lang => lang.language === languageId) || null
}

/**
 * 根据文件扩展名获取语言信息
 * @param {string} extension - 文件扩展名
 * @returns {Object|null} 语言信息对象或null
 */
export function getLanguageByExtension(extension) {
  return monacoEditorLanguages.find(lang => lang.extensions.some(ext => ext === extension)) || null
}

/**
 * 获取用于下拉选择器的选项数组
 * @returns {Array} 包含label和value的选项数组
 */
export function getLanguageOptions() {
  return monacoEditorLanguages.map(lang => ({
    label: lang.name,
    value: lang.language,
  }))
}

/**
 * 获取常用编程语言选项（用于简化选择）
 * @returns {Array} 常用语言选项数组
 */
export function getCommonLanguageOptions() {
  const commonLanguages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'c',
    'cpp',
    'csharp',
    'php',
    'ruby',
    'go',
    'rust',
    'swift',
    'kotlin',
    'html',
    'css',
    'scss',
    'vue',
    'json',
    'xml',
    'yaml',
    'markdown',
    'sql',
    'shell',
  ]

  return monacoEditorLanguages
    .filter(lang => commonLanguages.includes(lang.language))
    .map(lang => ({
      label: lang.name,
      value: lang.language,
    }))
}

// 默认导出
export default monacoEditorLanguages
