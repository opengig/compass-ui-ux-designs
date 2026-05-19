import { Outlet } from 'react-router-dom';
import { IconNavRail } from './IconNavRail';

export function Shell() {
  return (
    <div className="flex w-full h-screen bg-background font-heading text-foreground">
      <IconNavRail />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
