import daisyui from 'daisyui';

export default {
	content: ['index.html', './public/**/*.html', './src/**/*.{js,svelte}'],
	safelist: [
		'opacity-40',
		'border-b-4',
		'bg-gray-100',
		'bg-blue-500',
		'bg-blue-700',
		'bg-red-500',
		'bg-green-500',
		'from-gray-300',
		'from-blue-300',
		'from-yellow-300',
		'from-green-300',
		'from-red-300',
		'to-gray-200',
		'to-blue-200',
		'to-yellow-200',
		'to-green-200',
		'to-red-200',
		'justify-evenly',
		'hover:bg-blue-700',
		'hover:bg-blue-800',
		'hover:bg-red-700',
		'hover:bg-green-700',
		'disabled:bg-gray-400',
		'bg-success/80',
		'bg-warning/80',
		'bg-error/80',
	], // If you add a class but it never shows up in the build, add it here
	theme: {
		extend: {
			colors: {
				'blue-eths': '#1a2741',
				'orange-eths': '#c34614',
			},
		},
	},
	plugins: [daisyui],
	daisyui: {
		logs: false,
		themes: [
			{
				light: {
					primary: '#2066E9',
					'primary-focus': '#1D5BCF',
					'primary-content': '#FFFFFF',
					secondary: '#9D1FF5',
					'secondary-focus': '#8C1DDB',
					'secondary-content': '#FFFFFF',
					accent: '#04C9B2',
					'accent-focus': '#04B09D',
					'accent-content': '#FFFFFF',
					neutral: '#1A2741',
					'neutral-focus': '#141F33',
					'neutral-content': '#FFFFFF',
					'base-100': '#FFFFFF',
					'base-200': '#F9FAFB',
					'base-300': '#D1D5DB',
					'base-content': '#1F2937',
					info: '#467FD0',
					success: '#42BA96',
					warning: '#FFC107',
					error: '#DF4759',
				},
				dark: {
					primary: '#2066E9',
					'primary-focus': '#1D5BCF',
					'primary-content': '#FFFFFF',
					secondary: '#9D1FF5',
					'secondary-focus': '#8C1DDB',
					'secondary-content': '#FFFFFF',
					accent: '#04C9B2',
					'accent-focus': '#04B09D',
					'accent-content': '#FFFFFF',
					neutral: '#1A2741',
					'neutral-focus': '#141F33',
					'neutral-content': '#FFFFFF',
					'base-100': '#3D4451',
					'base-200': '#2A2E37',
					'base-300': '#16181D',
					'base-content': '#EBECF0',
					info: '#467FD0',
					success: '#42BA96',
					warning: '#FFC107',
					error: '#DF4759',
				},
			},
		],
	},
};
