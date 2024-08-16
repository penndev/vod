// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        "rules": {
            'no-trailing-spaces': ['error'], // 文件结束整理
            'no-multiple-empty-lines': ['error', { max: 1 }], // 限制连续空行数量
            'semi': ['error', 'never'],  // 禁止使用分号
            "indent": ["error", 4] // 缩进使用 4空格
        },
    }
)
