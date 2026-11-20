import { Outlet, useLocation } from "react-router-dom";

/** Re-keys on path change so every page fades in softly (CSS: .page-enter). */
export function PageTransition() {
  const { pathname } = useLocation();
  return <div key={pathname} className="page-enter"><Outlet /></div>;
}
