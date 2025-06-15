'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  NavLink,
  ScrollArea,
  Group,
  Text,
  Badge,
  Stack,
  Divider,
  Box,
} from '@mantine/core';
import {
  IconDashboard,
  IconUpload,
  IconApi,
  IconBrain,
  IconDatabase,
  IconChartBar,
  IconSettings,
  IconHelp,
} from '@tabler/icons-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navigationData = [
  {
    label: 'Dashboard',
    icon: IconDashboard,
    href: '/dashboard',
    description: 'Overview & Analytics',
  },
  {
    label: 'Import Data',
    icon: IconUpload,
    href: '/import-data',
    description: 'Upload datasets',
    badge: 'New',
  },
  {
    label: 'API Connect',
    icon: IconApi,
    href: '/api-connect',
    description: 'External connections',
  },
  {
    label: 'AI Insights',
    icon: IconBrain,
    href: '/ai-insights',
    description: 'AI-powered analysis',
    badge: 'AI',
  },
];

const bottomNavigation = [
  {
    label: 'Settings',
    icon: IconSettings,
    href: '/settings',
  },
  {
    label: 'Help',
    icon: IconHelp,
    href: '/help',
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    router.push(href);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <Box
      style={{
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box p="lg" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Group>
          <IconDatabase size={24} style={{ color: '#228be6' }} />
          <div>
            <Text size="sm" fw={600} c="dark.8">
              Data Analytics
            </Text>
            <Text size="xs" c="dimmed">
              Professional Suite
            </Text>
          </div>
        </Group>
      </Box>

      {/* Main Navigation */}
      <ScrollArea style={{ flex: 1 }} p="md">
        <Stack gap="xs">
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="sm">
            Main Navigation
          </Text>
          
          {navigationData.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={
                <Group justify="space-between" style={{ flex: 1 }}>
                  <div>
                    <Text size="sm" fw={500}>
                      {item.label}
                    </Text>
                    {item.description && (
                      <Text size="xs" c="dimmed">
                        {item.description}
                      </Text>
                    )}
                  </div>
                  {item.badge && (
                    <Badge
                      size="xs"
                      variant="light"
                      color={item.badge === 'AI' ? 'violet' : 'blue'}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Group>
              }
              leftSection={<item.icon size="1.2rem" />}
              active={pathname === item.href}
              onClick={() => handleNavigation(item.href)}
              style={{
                borderRadius: '8px',
                marginBottom: '4px',
              }}
            />
          ))}
        </Stack>

        <Divider my="lg" />

        {/* Stats Section */}
        <Box
          p="md"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '1rem',
          }}
        >
          <Text size="sm" fw={600} mb="sm">
            Quick Stats
          </Text>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="xs">Active Tables</Text>
              <Badge size="xs" color="white" variant="outline">
                12
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="xs">Total Records</Text>
              <Badge size="xs" color="white" variant="outline">
                1.2M
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="xs">AI Insights</Text>
              <Badge size="xs" color="white" variant="outline">
                24
              </Badge>
            </Group>
          </Stack>
        </Box>
      </ScrollArea>

      {/* Bottom Navigation */}
      <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
        <Stack gap="xs">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size="1rem" />}
              onClick={() => handleNavigation(item.href)}
              style={{
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );

  // Desktop version
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return (
      <Box
        style={{
          width: isOpen ? '280px' : '0px',
          overflow: 'hidden',
          transition: 'width 0.3s ease',
        }}
      >
        {sidebarContent}
      </Box>
    );
  }

  // Mobile version would use Drawer from Mantine
  return null;
}
