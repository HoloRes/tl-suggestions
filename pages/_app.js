import Head from 'next/head';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import red from '@material-ui/core/colors/red';

function MyApp({ Component, pageProps }) {
	const theme = createMuiTheme({
		palette: {
			primary: {
				main: '#556cd6',
			},
			secondary: {
				main: '#19857b',
			},
			error: {
				main: red.A400,
			},
			type: 'dark',
		},
	});

	return (
		<>
			<Head>
				<title>Hololive Resort Subs - Video submission</title>
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
				/>
			</Head>
			<ThemeProvider theme={theme}>
				<Component {...pageProps} />
			</ThemeProvider>
		</>
	);
}

export default MyApp;
