import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from '@/components/shared/Toast';
import { useNotificationStore } from '@/stores/notificationStore';

export default function MainLayout() {
  const location = useLocation();
  const { notifications, dismiss } = useNotificationStore();
  const isLanding = location.pathname === '/';

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-dark text-smoke">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(227,166,93,0.18),transparent_26%),radial-gradient(circle_at_84%_14%,rgba(136,190,159,0.16),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(183,132,82,0.14),transparent_30%),linear-gradient(180deg,#17120f_0%,#120d0b_56%,#0f0b09_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle at center, black 35%, transparent 88%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 35%, transparent 88%)',
          }}
        />
        <div className="absolute -left-28 top-24 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-[-2rem] h-96 w-96 rounded-full bg-accent-green/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-accent-red/10 blur-3xl" />
      </div>

      <Navbar />
      <main className="relative z-10 flex-1 pt-[96px]">
        {isLanding ? (
          <Outlet />
        ) : (
          <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        )}
      </main>
      <Footer />
      <ToastContainer notifications={notifications} onDismiss={dismiss} />
    </div>
  );
}
