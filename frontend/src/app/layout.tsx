import type { Metadata } from "next";
import "@/styles/globals.css";
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

export const metadata: Metadata = {
  title: "Reportzy - AI Analytics Platform",
  description: "Professional analytics and reporting platform with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider
          theme={{
            primaryColor: 'blue',
            defaultRadius: 'md',
            fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            colors: {
              brand: [
                '#f0f4ff',
                '#dce7ff',
                '#b8d4ff',
                '#91c1ff',
                '#6faeff',
                '#5a9bff',
                '#4d87ff',
                '#3b74e6',
                '#2d60cc',
                '#1e4db3'
              ]
            },
            components: {
              Card: {
                defaultProps: {
                  shadow: 'sm',
                  radius: 'md',
                  withBorder: true,
                },
              },
              Button: {
                defaultProps: {
                  radius: 'md',
                },
              },
            },
          }}
        >
          <Notifications position="top-right" />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
