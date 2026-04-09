import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { Layout } from './components/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import BookPage from './pages/BookPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import { ArticlePage, AuthorPage, CollectionPage, NotFoundPage, ReviewPage } from './pages/GenericPages';

const router = createBrowserRouter([
  { path: '/', element: <Layout />, children: [
    { index: true, element: <HomePage /> },
    { path: 'catalog', element: <CatalogPage /> },
    { path: 'books/:id', element: <BookPage /> },
    { path: 'authors/:id', element: <AuthorPage /> },
    { path: 'collections/:id', element: <CollectionPage /> },
    { path: 'articles/:id', element: <ArticlePage /> },
    { path: 'reviews/:id', element: <ReviewPage /> },
    { path: 'login', element: <LoginPage /> },
    { path: 'register', element: <RegisterPage /> },
    { path: 'profile', element: <ProfilePage /> },
    { path: 'admin', element: <AdminPage /> },
    { path: '*', element: <NotFoundPage /> }
  ] }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
