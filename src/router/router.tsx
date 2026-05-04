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
import RolesPermissionsManagement from "../features/roles/roles-permissions.management";

import TemplatesManagement from "../features/templates/templates.management";
import TemplateDetail from "../features/templates/template-detail";
import ExportLayoutPage from "../features/templates/export-layout/export-layout.page";
import FieldMappingsPage from "../features/templates/field-mappings/field-mappings.page";

import OperationBlueprintsManagement from "../features/operation-blueprints/operation-blueprints-management";
import OperationBlueprintDetailPage from "../features/operation-blueprints/operation-blueprint-detail";
import MyWorkspaceManagement from "../features/my-workspace/my-workspace-management";
import MyWorkspaceNewInstance from "../features/my-workspace/my-workspace-new-instance";
import MyWorkspaceDetail from "../features/my-workspace/my-workspace-detail";
import SharedDocumentsManagement from "../features/shared-documents/shared-documents-management";

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
						<ProtectedRoute permissions={['agenda.view_all', 'agenda.view_mine_and_sub', 'agenda.view_mine']}>
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
								<ProtectedRoute permissions="users.view">
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
								<ProtectedRoute permissions="users.view">
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
								<ProtectedRoute permissions="offices.view">
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
								<ProtectedRoute permissions="offices.view">
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
								<ProtectedRoute permissions="divisions.view">
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
								<ProtectedRoute permissions="divisions.view">
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
								<ProtectedRoute permissions="operations.view" deniedRoles={["ADM"]}>
									<RootLayout>
										<OperationBlueprintsManagement />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "detail",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute permissions="operations.view" deniedRoles={["ADM"]}>
									<RootLayout>
										<OperationBlueprintDetailPage />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					}
				]
			},
			{
				path: "workspace",
				children: [
					{
						path: "",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute permissions="operations.view" deniedRoles={["ADM"]}>
									<RootLayout>
										<MyWorkspaceManagement />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "new",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute permissions="operations.view" deniedRoles={["ADM"]}>
									<RootLayout>
										<MyWorkspaceNewInstance />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "detail/:id",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute permissions="operations.view" deniedRoles={["ADM"]}>
									<RootLayout>
										<MyWorkspaceDetail />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					}
				]
			},
			{
				path: "shared",
				element: (
					<Suspense fallback={<Loading />}>
						<ProtectedRoute>
							<RootLayout>
								<SharedDocumentsManagement />
							</RootLayout>
						</ProtectedRoute>
					</Suspense>
				)
			},
			{
				path: "templates",
				children: [
					{
						path: "",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute permissions="templates.view">
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
								<ProtectedRoute permissions="templates.view">
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
								<ProtectedRoute permissions="templates.view">
									<RootLayout>
									<ExportLayoutPage />
									</RootLayout>
								</ProtectedRoute>
							</Suspense>
						)
					},
					{
						path: "field-mappings/:templateId/:versionId",
						element: (
							<Suspense fallback={<Loading />}>
								<ProtectedRoute permissions="templates.view">
									<RootLayout>
									<FieldMappingsPage />
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
						<ProtectedRoute permissions="roles_permissions.view">
							<RootLayout>
								<RolesPermissionsManagement />
							</RootLayout>
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
