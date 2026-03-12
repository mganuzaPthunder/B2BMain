import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistGate } from 'redux-persist/integration/react';

import { CustomStyleProvider } from '@/shared/customStyleButton';
import { DynamicallyVariableProvider } from '@/shared/dynamicallyVariable';
import { GlobalProvider } from '@/shared/global';

import B3StoreContainer from './components/B3StoreContainer';
import App from './App';
import { LangWrapper } from './lang';
import { persistor, store } from './store';
import B3ThemeProvider from './theme';

import './main.css';

const CONTAINER_ID = 'b2b-portal-root';

let container = document.getElementById(CONTAINER_ID);
if (!container) {
  container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.appendChild(container);
}

container.className = 'bundle-namespace';

// PTHUNDER : ADD THIS FUNCTION
function shouldRenderPortal() {
  const href = window.location.href;
  const bodyClass = document.body.className;

  return (
    href.includes('/my-account') ||
    bodyClass.includes('page-my-account') ||
    window.location.pathname.includes('account.php')
  );
}

// Hide or render the portal conditionally
if (!shouldRenderPortal()) {
  container.style.display = 'none';
} else {
  container.style.display = 'block';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
        staleTime: 0,
        refetchInterval: false,
      },
    },
  });

  ReactDOM.createRoot(container).render(
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <GlobalProvider>
            <CustomStyleProvider>
              <LangWrapper>
                <B3StoreContainer>
                  <DynamicallyVariableProvider>
                    <B3ThemeProvider>
                      <App />
                    </B3ThemeProvider>
                  </DynamicallyVariableProvider>
                </B3StoreContainer>
              </LangWrapper>
            </CustomStyleProvider>
          </GlobalProvider>
        </PersistGate>
      </Provider>
    </QueryClientProvider>
  );
}