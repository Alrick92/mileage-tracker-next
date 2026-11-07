/**
 * Templates remount on every navigation between child routes, which gives
 * each page a short fade/slide-in so transitions feel fluid rather than
 * snapping. Disabled automatically for users who prefer reduced motion.
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-page-in">{children}</div>;
}
