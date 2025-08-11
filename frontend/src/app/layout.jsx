// src/app/layout.tsx
'use client';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import store from '../store';
import { ConfigProvider } from 'antd';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Provider store={store}>
            <ConfigProvider>
              {children}
            </ConfigProvider>
          </Provider>
        </SessionProvider>
      </body>
    </html>
  );
}
