import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/ToastProvider';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import BookPage from './pages/BookPage';
import BookFragmentPage from './pages/BookFragmentPage';
import AuthorPage from './pages/AuthorPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import AdminPage from './pages/AdminPage';
import FormulaPage from './pages/FormulaPage';
import { ArticlePage, NotFoundPage, ReviewPage } from './pages/GenericPages';
import {
  CreateArticlePage,
  CreateReviewPage,
  EditArticlePage,
  EditReviewPage,
  FavoritesPage,
  LibraryPage,
  MyRatingsPage
} from './pages/UserLibraryPages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'books/:id', element: <BookPage /> },
      { path: 'books/:id/fragment', element: <BookFragmentPage /> },
      { path: 'authors/:id', element: <AuthorPage /> },
      { path: 'articles/:id', element: <ArticlePage /> },
      { path: 'reviews/:id', element: <ReviewPage /> },
      { path: 'reviews/new', element: <CreateReviewPage /> },
      { path: 'reviews/:id/edit', element: <EditReviewPage /> },
      { path: 'articles/new', element: <CreateArticlePage /> },
      { path: 'articles/:id/edit', element: <EditArticlePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'people/:username', element: <PublicProfilePage /> },
      { path: 'profile/my-ratings', element: <MyRatingsPage /> },
      { path: 'profile/favorites', element: <FavoritesPage /> },
      { path: 'profile/library', element: <LibraryPage /> },
      { path: 'formula-84', element: <FormulaPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={new QueryClient()}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
