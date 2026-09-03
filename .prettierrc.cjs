const prettierConfig = require('./config/prettier/index.mjs')

module.exports = prettierConfig?.default ?? prettierConfig
