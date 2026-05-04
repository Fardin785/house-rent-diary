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
import TenantDetails from './views/TenantDetails';
import CostCalculator from './views/CostCalculator';
import FamilyLedger from './views/FamilyLedger';
import UtilityBills from './views/UtilityBills';
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

const tenantDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tenants/$tenantId',
  component: TenantDetails,
});

const costCalcRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cost-calculator',
  component: CostCalculator,
});

const familyLedgerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/family-ledger',
  component: FamilyLedger,
});

const utilityBillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/utility-bills',
  component: UtilityBills,
});

const routeTree = rootRoute.addChildren([indexRoute, tenantsRoute, tenantDetailsRoute, costCalcRoute, familyLedgerRoute, utilityBillsRoute]);

const router = createRouter({ routeTree });

export default function App() {
  return <RouterProvider router={router} />;
}
