'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  PencilLine,
  PlusSquare,
  Settings,
  Tags,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  children?: Array<{ label: string; href: string }>;
};

const navigation: NavItem[] = [
  { label: 'Painel', href: '/admin', icon: LayoutDashboard, exact: true },
  {
    label: 'Posts',
    href: '/admin/posts',
    icon: PencilLine,
    children: [
      { label: 'Todos os posts', href: '/admin/posts' },
      { label: 'Adicionar novo', href: '/admin/posts/new' },
    ],
  },
  { label: 'Novo post', href: '/admin/posts/new', icon: PlusSquare },
  { label: 'Categorias', href: '/admin/categories', icon: FolderTree },
  { label: 'Tags', href: '/admin/tags', icon: Tags },
  { label: 'Mídia', href: '/admin/media', icon: ImageIcon },
  { label: 'Configurações', href: '/admin/settings', icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [postsMenuOpen, setPostsMenuOpen] = useState(pathname.startsWith('/admin/posts'));

  useEffect(() => {
    setPostsMenuOpen(pathname.startsWith('/admin/posts'));
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className={clsx('admin-dashboard', sidebarOpen && 'sidebar-open')}>
      <aside className="admin-sidebar" aria-label="Menu principal">
        <div className="admin-sidebar__brand">Grafia Admin</div>

        <ul className="admin-sidebar__menu">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            const hasChildren = !!item.children?.length;
            const open = hasChildren && postsMenuOpen;

            if (hasChildren) {
              return (
                <li key={item.href} className={clsx('admin-sidebar__item', open && 'is-open')}>
                  <button
                    type="button"
                    className={clsx('admin-sidebar__link', active && 'is-active')}
                    aria-expanded={open}
                    onClick={() => setPostsMenuOpen((prev) => !prev)}
                  >
                    <Icon className="admin-sidebar__icon" />
                    <span className="admin-sidebar__text">{item.label}</span>
                    <ChevronDown className="admin-sidebar__caret" />
                  </button>
                  <ul className="admin-submenu">
                    {item.children?.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          className={clsx(
                            'admin-submenu__link',
                            pathname === subItem.href && 'is-active',
                          )}
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }

            return (
              <li key={item.href} className="admin-sidebar__item">
                <Link href={item.href} className={clsx('admin-sidebar__link', active && 'is-active')}>
                  <Icon className="admin-sidebar__icon" />
                  <span className="admin-sidebar__text">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="px-4 pb-4">
          <button type="button" className="btn btn-danger w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar" aria-label="Barra superior administrativa">
          <div className="admin-topbar__left">
            <button
              className="admin-toggle"
              type="button"
              aria-label="Abrir menu lateral"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <h2 className="admin-topbar__title">Controle editorial</h2>
          </div>

          <div className="admin-topbar__right">
            <button className="admin-icon-btn" type="button" aria-label="Notificações">
              <Bell className="h-4 w-4" />
              <span className="admin-badge">3</span>
            </button>
            <button className="admin-icon-btn" type="button" aria-label="Configurações rápidas">
              <Settings className="h-4 w-4" />
            </button>

            <div className={clsx('admin-user-menu', userMenuOpen && 'is-open')}>
              <button
                className="admin-user-trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((prev) => !prev)}
              >
                <span className="admin-user-avatar">AD</span>
                <span>Admin</span>
              </button>
              <div className="admin-user-dropdown" role="menu" aria-label="Menu do usuário">
                <Link href="/admin/settings" role="menuitem">
                  Perfil
                </Link>
                <Link href="/admin/settings" role="menuitem">
                  Minha conta
                </Link>
                <button type="button" className="btn btn-secondary w-full" onClick={handleLogout}>
                  <User className="h-4 w-4" />
                  Encerrar sessão
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="admin-content fade-in">{children}</section>
      </main>
    </div>
  );
}
