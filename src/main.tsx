import {
	StrictMode
} from 'react';
import {
	createRoot
} from 'react-dom/client';
import {
	I18nextProvider
} from 'react-i18next';
import {
	RouterProvider
} from 'react-router-dom';
import {
	ApolloProvider
} from '@apollo/client';
import {
	apolloClient
} from './server/client';
import {
	PersistGate
} from 'redux-persist/integration/react';
import {
	persistor,
	store
} from './store/store';
import {
	Provider
} from 'react-redux';
import {
	ThemeProvider
} from './shared/context/theme.context';
import {
	TooltipProvider
} from './shared/components/tooltip';
import {
	Toaster
} from "sileo";
import i18n from './shared/helpers/i18n';
import router from './router/router';
import './style/main.css';
import './style/index.scss';
import '@xyflow/react/dist/style.css';
import '@ant-design/v5-patch-for-react-19';
import Layout from './layouts/layout';

const App = () => {

	return (
		<StrictMode>
			<ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
				<TooltipProvider>
					<ApolloProvider client={apolloClient}>
						<I18nextProvider i18n={i18n}>
							<Provider store={store}>
								<PersistGate loading={null} persistor={persistor}>
									<Layout>
										<>
											<RouterProvider router={router} />
											<Toaster
												position="top-center"
												options={{
													fill: "#171717",
													styles: { description: "text-white/75!" },
													duration: null
												}}
											/>
										</>
									</Layout>
								</PersistGate>
							</Provider>
						</I18nextProvider>
					</ApolloProvider>
				</TooltipProvider>
			</ThemeProvider>
		</StrictMode>
	)
}

export default App;

createRoot(document.getElementById('root')!).render( <App /> );
