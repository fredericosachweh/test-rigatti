import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth, type AuthUser } from "../contexts/AuthContext";
import { useCatalogFilters } from "../contexts/CatalogFilterContext";
import { useTheme } from "../hooks/useTheme";
import { SidebarFilters } from "./SidebarFilters";

const NAV_ITEMS = [
  {
    to: "/catalogo",
    label: "Catálogo",
    visible: (_user: AuthUser | null) => true,
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    to: "/favoritos",
    label: "Favoritos",
    visible: (user: AuthUser | null) => user?.role === "cliente",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    )
  },
  {
    to: "/chat",
    label: "Chat IA",
    visible: (user: AuthUser | null) => Boolean(user),
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  },
  {
    to: "/analytics",
    label: "Analytics",
    visible: (user: AuthUser | null) => user?.role === "admin",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle: toggleTheme } = useTheme();
  const { brands } = useCatalogFilters();
  const [expanded, setExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.visible(user));

  // Filtros só aparecem no catálogo público (não-admin) e quando há estoque carregado
  const showCatalogFilters =
    location.pathname === "/catalogo" && user?.role !== "admin" && brands.length > 0;

  return (
    <div className={`shell ${expanded ? "shell--expanded" : "shell--collapsed"}`}>
      {/* ── Sidebar (desktop) ── */}
      <aside className="sidebar">
        <button
          className="sidebar-toggle"
          onClick={() => setExpanded((v) => !v)}
          type="button"
          title={expanded ? "Recolher menu" : "Expandir menu"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.3s ease"
            }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="sidebar-brand">
          {expanded ? (
            <img src="/logo-modena.webp" alt="Modena SPO" className="sidebar-logo-img--full" />
          ) : (
            <div className="sidebar-monogram" title="Modena SPO">
              <img src="/favicon.svg" alt="Modena SPO" className="sidebar-monogram-img" />
            </div>
          )}
        </div>

        <nav className="nav">
          {visibleItems.map((item) => (
            <NavLink
              className="nav-link"
              key={item.to}
              to={item.to}
              title={!expanded ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {expanded && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {expanded && showCatalogFilters && (
          <div className="sidebar-filters-wrap">
            <SidebarFilters />
          </div>
        )}

        {user ? (
          <div className="tenant-card">
            <div className="tenant-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            {expanded && (
              <div className="tenant-info">
                <span className="tenant-label">Sessão ativa</span>
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
                <span className="pill">{user?.role === "admin" ? "Admin" : "Cliente"}</span>
              </div>
            )}
            <button
              className="ghost-button sidebar-logout"
              onClick={logout}
              title="Sair"
              type="button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {expanded && <span>Sair</span>}
            </button>
          </div>
        ) : (
          <button
            className="primary-button sidebar-login"
            onClick={() => navigate("/auth")}
            type="button"
            title="Entrar"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {expanded && <span>Entrar</span>}
          </button>
        )}
      </aside>

      {/* ── Content ── */}
      <main className="content">
        {/* Mobile top bar */}
        <header className="mobile-topbar">
          <img src="/logo-modena.webp" alt="Modena SPO" className="mobile-topbar-logo" />
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            type="button"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </header>

        {/* Mobile drawer overlay */}
        {mobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
            <nav className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <img src="/logo-modena.webp" alt="Modena SPO" className="sidebar-logo-img--full" />
              </div>
              <div className="mobile-drawer-nav">
                {visibleItems.map((item) => (
                  <NavLink
                    className="nav-link"
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
              {showCatalogFilters && (
                <div className="sidebar-filters-wrap sidebar-filters-wrap--drawer">
                  <SidebarFilters />
                </div>
              )}
              <div className="mobile-drawer-footer">
                {user && (
                  <>
                    <div className="tenant-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                    <div className="tenant-info">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                      <span className="pill">{user?.role === "admin" ? "Admin" : "Cliente"}</span>
                    </div>
                  </>
                )}
                <button
                  className="ghost-button"
                  onClick={toggleTheme}
                  type="button"
                  title={theme === "dark" ? "Modo claro" : "Modo escuro"}
                >
                  {theme === "dark" ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
                {user ? (
                  <button
                    className="ghost-button sidebar-logout"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      navigate("/catalogo");
                    }}
                    type="button"
                    title="Sair"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/auth");
                    }}
                    type="button"
                  >
                    Entrar
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}

        <Outlet />
      </main>

      {/* ── Bottom nav (mobile) ── */}
      <nav className="mobile-bottom-nav">
        {visibleItems.map((item) => (
          <NavLink className="mobile-bottom-link" key={item.to} to={item.to}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
