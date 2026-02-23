import type { Preview } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'

import './styles.css'

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: 'todo',
		},
	},
	decorators: [
		withThemeByClassName({
			themes: {
				light: '', // Светлая тема - без классов
				dark: 'dark', // Темная тема - добавляем класс "dark"
			},
			defaultTheme: 'light',
			// Указываем, куда вешать класс. Для Tailwind обычно нужен 'html'
			parentSelector: 'html',
		}),
	],
}

export default preview
