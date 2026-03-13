import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutSession } from '@/utils/logoutSession';
import { PageProps } from '@/pages/PageProps';
import React from 'react';

const Logout = (_props: PageProps): React.ReactElement => {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      await logoutSession();

      // ✅ Set flag so login page knows to show toast
      sessionStorage.setItem('logoutSuccess', 'true');

      // redirect to login
      navigate('/login?loginFlag=loggedOutLogin', { replace: true });
    };

    doLogout();
  }, [navigate]);

  return <div>Logging out...</div>;
};

export default Logout;
