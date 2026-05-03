import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet
} from '@tanstack/react-router';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Tenants from './views/Tenants';
import Records from './views/Records';
import { ToastProvider } from './components/Toast';

const rootRoute = createRootRoute({
  component: () => (
    <ToastProvider>
      <Layout>
        <Outlet />
      </Layout>
    </ToastProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const tenantsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tenants',
  component: Tenants,
});

const recordsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/records',
  component: Records,
});

const routeTree = rootRoute.addChildren([indexRoute, tenantsRoute, recordsRoute]);

const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
