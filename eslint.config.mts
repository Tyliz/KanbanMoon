import obsidianmd from 'eslint-plugin-obsidianmd'
import globals from 'globals'

const baseConfig = [
	{
		ignores: [
			'node_modules',
			'dist',
			'esbuild.config.mjs',
			'version-bump.mjs',
			'versions.json',
			'main.js',
			'package.json',
			'package-lock.json',
			'tsconfig.json',
		],
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: [
						'eslint.config.mts',
						'manifest.json',
						'vitest.config.ts',
					],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
		rules: {
			semi: ['error', 'never'],
			'no-console': 'warn',
		},
	},
]

export default [...baseConfig, ...obsidianmd.configs.recommended]
