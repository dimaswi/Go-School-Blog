import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppDialogProvider } from './context/AppDialogContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout';
import RoleRoute from './components/RoleRoute';
import BlogLayout from './components/public/BlogLayout';
import Home from './pages/public/Home';
import PostDetail from './pages/public/PostDetail';
import PublicSchools from './pages/public/PublicSchools';
import { Toaster } from 'react-hot-toast';

import UsersIndex from './pages/users/index';
import UserCreate from './pages/users/create';
import UserEdit from './pages/users/edit';
import UserShow from './pages/users/show';
import Login from './pages/auth/login';

import RolesIndex from './pages/roles/index';
import RoleCreate from './pages/roles/create';
import RoleEdit from './pages/roles/edit';

import Dashboard from './pages/dashboard/index';
import Announcements from './pages/dashboard/Announcements';
import SettingsIndex from './pages/settings/index';

import SchoolsIndex from './pages/schools/index';
import SchoolCreate from './pages/schools/create';

import SchoolEdit from './pages/schools/edit';
import SchoolShow from './pages/schools/show';

import CategoriesIndex from './pages/categories/index';
import CategoryCreate from './pages/categories/create';
import CategoryEdit from './pages/categories/edit';

import PostsIndex from './pages/posts/index';
import PostCreate from './pages/posts/create';
import PostEdit from './pages/posts/edit';
import AdsIndex from './pages/admin/ads/index';
import AdCreate from './pages/admin/ads/create';
import AdEdit from './pages/admin/ads/edit';

function DashboardLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const isSubdomain = parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== 'domain' && parts[0] !== 'literasidigital';

  return (
    <AuthProvider>
      <SiteConfigProvider>
        <AppDialogProvider>
          <Toaster position="top-center" />
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<BlogLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/schools" element={<PublicSchools />} />
                <Route path="/post/:slug" element={<PostDetail />} />
                <Route path="/category/:slug" element={<Home />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin">
                <Route path="login" element={<Login />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="settings" element={<SettingsIndex />} />

                    {/* Routes for Subdomains (Tenants) */}
                    <Route element={<RoleRoute permissions={["users.view", "users.create", "users.edit", "users.delete"]} />}>
                      <Route path="users" element={<UsersIndex />} />
                      <Route path="users/create" element={<UserCreate />} />
                      <Route path="users/:id" element={<UserShow />} />
                      <Route path="users/:id/edit" element={<UserEdit />} />
                    </Route>

                    <Route element={<RoleRoute permissions={["posts.view", "posts.create", "posts.edit", "posts.delete"]} />}>
                      <Route path="posts" element={<PostsIndex />} />
                      <Route path="posts/create" element={<PostCreate />} />
                      <Route path="posts/:id/edit" element={<PostEdit />} />
                    </Route>

                    <Route element={<RoleRoute permissions={["roles.view", "roles.create", "roles.edit", "roles.delete"]} />}>
                      <Route path="roles" element={<RolesIndex />} />
                      <Route path="roles/create" element={<RoleCreate />} />
                      <Route path="roles/:id/edit" element={<RoleEdit />} />
                    </Route>

                    {/* Routes for Root Domain (Super Admin) */}
                    {!isSubdomain && (
                      <>
                        <Route path="schools" element={<SchoolsIndex />} />
                        <Route path="schools/create" element={<SchoolCreate />} />
                        <Route path="schools/:id" element={<SchoolShow />} />
                        <Route path="schools/:id/edit" element={<SchoolEdit />} />
                      </>
                    )}

                    <Route element={<RoleRoute permissions={["categories.view", "categories.create", "categories.edit", "categories.delete"]} />}>
                      <Route path="categories" element={<CategoriesIndex />} />
                      <Route path="categories/create" element={<CategoryCreate />} />
                      <Route path="categories/:id/edit" element={<CategoryEdit />} />
                    </Route>

                    <Route path="ads" element={<AdsIndex />} />
                    <Route path="ads/create" element={<AdCreate />} />
                    <Route path="ads/:id/edit" element={<AdEdit />} />

                    <Route path="announcements" element={<Announcements />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AppDialogProvider>
      </SiteConfigProvider>
    </AuthProvider>
  );
}

export default App;
