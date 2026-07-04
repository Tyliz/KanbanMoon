import tseslint from 'typescript-eslint'
import obsidianmd from 'eslint-plugin-obsidianmd'
import globals from 'globals'
import { globalIgnores } from 'eslint/config'

export default tseslint.config(
	globalIgnores([
		'node_modules',
		'dist',
		'esbuild.config.mjs',
		'version-bump.mjs',
		'versions.json',
		'main.js',
		'package.json',
		'package-lock.json',
		'tsconfig.json',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
		rules: {
			// 🚫 ¡Aquí obligamos a NO usar puntos y comas!
			semi: ['error', 'never'],

			// Ejemplo: Permitir console.log en desarrollo pero avisar
			'no-console': 'warn',

			// Puedes añadir más reglas específicas aquí si lo deseas
		},
	},
	...obsidianmd.configs.recommended,
)
