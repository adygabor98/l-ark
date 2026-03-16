import {
	Suspense,
	useEffect,
	useRef
} from "react";
import {
	createBrowserRouter,
	useNavigate,
	Outlet
} from "react-router-dom";
import {
	useDispatch
} from "react-redux";
import {
	setNavigate
} from "../shared/hooks/useGNavigate";
import {
	tokenExpirationMonitor
} from "../shared/services/tokenExpirationMonitor";
import {
	getAccessToken
} from "../shared/helpers/auth";
import {
	removeUser
} from "../store/actions/user.actions";
import Loading from "../shared/components/loading";
import ProtectedRoute from "../shared/components/protected-route";
import RootLayout from "../layouts/root-layout";
import Login from "../pages/login";
import i18n from "../shared/helpers/i18n";
import DashboardManagement from "../features/dashboard/dashboard.management";
import UsersManagement from "../features/user/users.management";
import AgendaManagement from "../features/agenda/agenda.management";
import OfficesManagement from "../features/offices/offices.management";
import SettingsManagement from "../features/settings/settings.management";
import OfficeDetail from "../features/offices/office-detail";
import DivisionsManagement from "../features/divisions/divisions.management";
import DivisionDetail from "../features/divisions/division-detail";
import UserDetail from "../features/user/user-detail";
import OperationsManagement from "../features/operations/operations.management";
import TemplatesManagement from "../features/templates/templates.management";
import TemplateDetail from "../features/templates/template-detail";
import ExportLayoutPage from "../features/templates/export-layout/export-layout.page";
import { PermissionsProvider, RolesManagement } from "../features/roles";
import { OperationProvider } from "../features/operations/context/operation-context";
import OperationDetail from "../features/operations/operation-detail";

// Component to initialize global navigation and token expiration monitoring
const NavigationInitializer = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const navigateRef = useRef(navigate);

	useEffect(() => {
		navigateRef.current = navigate;
		setNavigate(navigate);
	}, [navigate]);

	useEffect(() => {
		// Start token expiration monitoring if user is logged in
		const token = getAccessToken();
		if (token) {
			tokenExpirationMonitor.start(() => {
				console.log('Token expired, logging out user');
				dispatch(removeUser());
				navigateRef.current('/');
			}, 60000); // Check every 60 seconds
		}

		// Cleanup on unmount
		return () => {
			tokenExpirationMonitor.stop();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return <Outlet />;
};

export const globalRoutes = [
	{
		path: "/",
		handle: { title: i18n.t('titles.login'), path: '/' },
		element: <NavigationInitializer />,
		children: [
			{
				path: "",
				element: (
					<Suspense fallback={<Loading />}>
						<Login />
					</Suspense>
				)
			},
			{
				path: "invite/:id/:date",
				element: (
					<Suspense fallback={<Loading />}>
						<Login />
					</Suspense>
				)
			},
			{
				path: "reset-password/:id/:date/:isReset",
				element: (
					<Suspense fallback={<Loading />}>
						<Login />
					</Suspense>
				)
			},
			{
				path: "agenda",
				element: (
					<Suspense fallback={<Loading />}>
						<ProtectedRoute>
							<RootLayout>
								<AgendaManagement />
							</RootLayout>
						</ProtectedRoute>
					</Suspense>
				)
			},
			{
				path: "dashboard",
				element: (
					<Suspense fallback={<Loading />}>
						<ProtectedRoute>
							<RootLayout>
								<DashboardManagement />
							</RootLayout>
						</ProtectedRoute>
					</Suspense>
				)
			},
			{
				path: "users",
				children: [
					{
						path: "",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<UsersManagement />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "detail/:id?",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<UserDetail />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
				]
			},
			{
				path: "offices",
				children: [
					{
						path: "",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<OfficesManagement />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "detail/:id?",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<OfficeDetail />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					}
				]
			},
			{
				path: "divisions",
				children: [
					{
						path: "",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<DivisionsManagement />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "detail/:id?",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<DivisionDetail />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
				]
			},
			{
				path: "operations",
				children: [
					{
						path: "",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<OperationsManagement />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "detail/:id?",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<OperationProvider>
										<RootLayout>
											<OperationDetail />
										</RootLayout>
									</OperationProvider>
								</ProtectedRoute>
							</Suspense>
						)
					}
				]
			},
			{
				path: "templates",
				children: [
					{
						path: "",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<TemplatesManagement />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "builder",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<TemplateDetail />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "export-layout/:templateId/:versionId",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute>
									<RootLayout>
										<ExportLayoutPage />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					}
				]
			},
			{
				path: "roles",
				element: (
					<Suspense fallback={<Loading />}>
						<ProtectedRoute>
							<PermissionsProvider>
								<RootLayout>
									<RolesManagement />
								</RootLayout>
							</PermissionsProvider>
						</ProtectedRoute>
					</Suspense>
				)
			},
			{
				path: "settings",
				element: (
					<Suspense fallback={<Loading />}>
						<ProtectedRoute>
							<RootLayout>
								<SettingsManagement />
							</RootLayout>
						</ProtectedRoute>
					</Suspense>
				)
			},
		]
	}
];

const router = createBrowserRouter(globalRoutes);

export default router;
