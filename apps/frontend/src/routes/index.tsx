import { memo } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.tsx';
import PrivateRoute from './PrivateRoute.tsx';
import PublicRoute from './PublicRoute.tsx';
import LoginView from '../modules/auth/views/LoginView.tsx';
import RegisterView from '../modules/auth/views/RegisterView.tsx';
import VerifyEmailView from '../modules/auth/views/VerifyEmailView.tsx';
import ForgotPasswordView from '../modules/auth/views/ForgotPasswordView.tsx';
import ResetPasswordView from '../modules/auth/views/ResetPasswordView.tsx';
import DashboardView from '../modules/notebooks/views/DashboardView.tsx';
import { NotebookView } from '../modules/notebooks/views/NotebookView.tsx';
import { EditorView } from '../modules/leaves/views/EditorView.tsx';
import StudyView from '../modules/study/views/StudyView.tsx';
import TagsManagementView from '../modules/tags/views/TagsManagementView.tsx';
import BookmarksView from '../modules/bookmarks/views/BookmarksView.tsx';
import TrashView from '../modules/trash/views/TrashView.tsx';
import ArchivedLeavesView from '../modules/leaves/views/ArchivedLeavesView.tsx';
import TodoListView from '../modules/todos/views/TodoListView.tsx';
import PlanningView from '../modules/planning/views/PlanningView.tsx';
import PlanningSettingsView from '../modules/planning/views/PlanningSettingsView.tsx';
import EstudosView from '../modules/study/views/EstudosView.tsx';
import FlashcardsStudyView from '../modules/study/views/FlashcardsStudyView.tsx';
import QuestionsStudyView from '../modules/study/views/QuestionsStudyView.tsx';
import MockExamsView from '../modules/study/views/MockExamsView.tsx';
import ReviewsStudyView from '../modules/study/views/ReviewsStudyView.tsx';

/* ─── Componentes nomeados e memoizados para cada rota ────────────── */

const LoginPage = memo(function LoginPage() {
  return (
    <PublicRoute>
      <LoginView />
    </PublicRoute>
  );
});

const RegisterPage = memo(function RegisterPage() {
  return (
    <PublicRoute>
      <RegisterView />
    </PublicRoute>
  );
});

const VerifyEmailPage = memo(function VerifyEmailPage() {
  return (
    <PublicRoute>
      <VerifyEmailView />
    </PublicRoute>
  );
});

const ForgotPasswordPage = memo(function ForgotPasswordPage() {
  return (
    <PublicRoute>
      <ForgotPasswordView />
    </PublicRoute>
  );
});

const ResetPasswordPage = memo(function ResetPasswordPage() {
  return (
    <PublicRoute>
      <ResetPasswordView />
    </PublicRoute>
  );
});

const AppRoot = memo(function AppRoot() {
  return (
    <PrivateRoute>
      <AppLayout />
    </PrivateRoute>
  );
});

const DashboardPage = memo(function DashboardPage() {
  return <DashboardView />;
});

const NotebookDetailPage = memo(function NotebookDetailPage() {
  return <NotebookView />;
});

const LeafEditorPage = memo(function LeafEditorPage() {
  return <EditorView />;
});

const StudyPage = memo(function StudyPage() {
  return <StudyView />;
});

const TagsPage = memo(function TagsPage() {
  return <TagsManagementView />;
});

const BookmarksPage = memo(function BookmarksPage() {
  return <BookmarksView />;
});

const TrashPage = memo(function TrashPage() {
  return <TrashView />;
});

const ArchivedPage = memo(function ArchivedPage() {
  return <ArchivedLeavesView />;
});

const TodoListPage = memo(function TodoListPage() {
  return <TodoListView />;
});

const PlanningPage = memo(function PlanningPage() {
  return <PlanningView />;
});

const PlanningSettingsPage = memo(function PlanningSettingsPage() {
  return <PlanningSettingsView />;
});

const EstudosPage = memo(function EstudosPage() {
  return <EstudosView />;
});

const FlashcardsStudyPage = memo(function FlashcardsStudyPage() {
  return <FlashcardsStudyView />;
});

const QuestionsStudyPage = memo(function QuestionsStudyPage() {
  return <QuestionsStudyView />;
});

const MockExamsPage = memo(function MockExamsPage() {
  return <MockExamsView />;
});

const ReviewsStudyPage = memo(function ReviewsStudyPage() {
  return <ReviewsStudyView />;
});

const DefaultRedirect = memo(function DefaultRedirect() {
  return <Navigate to="/dashboard" replace />;
});

const CatchAllRedirect = memo(function CatchAllRedirect() {
  return <Navigate to="/dashboard" replace />;
});

/* ─── Router estático (fora de qualquer componente/função) ─────────── */

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/',
    element: <AppRoot />,
    children: [
      {
        path: '',
        element: <DefaultRedirect />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'notebooks/:notebookId',
        element: <NotebookDetailPage />,
      },
      {
        path: 'notebooks/:notebookId/leaves/:leafId',
        element: <LeafEditorPage />,
      },
      {
        path: 'notebooks/:notebookId/study',
        element: <StudyPage />,
      },
      {
        path: 'tags',
        element: <TagsPage />,
      },
      {
        path: 'bookmarks',
        element: <BookmarksPage />,
      },
      {
        path: 'trash',
        element: <TrashPage />,
      },
      {
        path: 'archived',
        element: <ArchivedPage />,
      },
      {
        path: 'todos',
        element: <TodoListPage />,
      },
      {
        path: 'planning',
        element: <Navigate to="/planning/agenda" replace />,
      },
      {
        path: 'planning/settings',
        element: <PlanningSettingsPage />,
      },
      {
        path: 'planning/:tab',
        element: <PlanningPage />,
      },
      {
        path: 'studies',
        element: <EstudosPage />,
      },
      {
        path: 'studies/flashcards',
        element: <FlashcardsStudyPage />,
      },
      {
        path: 'studies/questions',
        element: <QuestionsStudyPage />,
      },
      {
        path: 'studies/mock-exams',
        element: <MockExamsPage />,
      },
      {
        path: 'studies/reviews',
        element: <ReviewsStudyPage />,
      },
    ],
  },
  {
    path: '*',
    element: <CatchAllRedirect />,
  },
]);

/* ─── Componente público que expõe o RouterProvider ───────────────── */

export function AppRoutes() {
  return <RouterProvider router={router} />;
}

export default AppRoutes;
