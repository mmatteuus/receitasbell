import { RouteObject, Navigate } from 'react-router-dom';
import PwaEntryPage from './entry/PwaEntryPage';
import UserLoginPage from './pages/UserLoginPage';
import { UserPwaShell } from './components/PwaShell';

export const pwaRoutes: RouteObject[] = [
  {
    path: '/pwa/entry',
    element: <PwaEntryPage />,
  },
  {
    path: '/pwa/login',
    element: <UserLoginPage />,
  },
  {
    path: '/pwa/app',
    element: <UserPwaShell />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: AccountHome } = await import('@/pages/AccountHome');
          return { element: <AccountHome /> };
        },
      },
      {
        path: 'favoritos',
        lazy: async () => {
          const { default: Favorites } = await import('@/pages/Favorites');
          return { element: <Favorites /> };
        },
      },
      {
        path: 'lista-de-compras',
        lazy: async () => {
          const { default: ShoppingListPage } = await import('@/pages/ShoppingListPage');
          return { element: <ShoppingListPage /> };
        },
      },
      {
        path: 'compras',
        element: <Navigate to="/pwa/app?tab=compras" replace />,
      },
    ],
  },
  // We'll hook into existing admin children in the main router.
];
