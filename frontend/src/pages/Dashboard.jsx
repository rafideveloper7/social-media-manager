import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import ConnectionsDashboard from '../components/ConnectionsDashboard';

const Dashboard = () => {
  // Pull the current logged-in user data out of your global context hook
  const { user } = useContext(UserContext);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      {/* Pass your real MongoDB authenticated user ID down to the studio engine.
        If user data isn't loaded yet, it falls back gracefully to standard execution values.
      */}
      <ConnectionsDashboard userId={user?._id || user?.id || "65f1a9b2c3d4e5f6a7b8c9d0"} />
    </div>
  );
};

export default Dashboard;