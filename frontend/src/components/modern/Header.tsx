'use client';

import { useState } from 'react';
import {
  Group,
  Burger,
  Text,
  ActionIcon,
  Badge,
  Indicator,
  Avatar,
  Menu,
  Divider,
  UnstyledButton,
  rem,
} from '@mantine/core';
import {
  IconBell,
  IconSettings,
  IconLogout,
  IconUser,
  IconChevronDown,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [userMenuOpened, setUserMenuOpened] = useState(false);

  const handleNotificationClick = () => {
    notifications.show({
      title: 'Notifications',
      message: 'You have 3 new notifications',
      color: 'blue',
    });
  };

  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #e9ecef',
      padding: '1rem 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Group justify="space-between" h="100%">
        {/* Left side - Menu & Logo */}
        <Group>
          <Burger
            opened={sidebarOpen}
            onClick={onMenuToggle}
            size="sm"
            hiddenFrom="sm"
          />
          
          <Text
            size="xl"
            fw={700}
            variant="gradient"
            gradient={{ from: 'blue.6', to: 'violet.6', deg: 45 }}
            style={{ letterSpacing: '-0.5px' }}
          >
            Reportzy
          </Text>
          
          <Badge
            variant="light"
            color="blue"
            size="xs"
            style={{ textTransform: 'none' }}
          >
            Analytics Platform
          </Badge>
        </Group>

        {/* Right side - Actions & User */}
        <Group gap="md">
          {/* Theme Toggle */}
          <ActionIcon
            variant="subtle"
            size="lg"
            radius="md"
            onClick={() => toggleColorScheme()}
            title="Toggle color scheme"
          >
            {colorScheme === 'dark' ? (
              <IconSun style={{ width: rem(20), height: rem(20) }} />
            ) : (
              <IconMoon style={{ width: rem(20), height: rem(20) }} />
            )}
          </ActionIcon>

          {/* Notifications */}
          <Indicator
            inline
            label="3"
            size={16}
            color="red"
            offset={7}
          >
            <ActionIcon
              variant="subtle"
              size="lg"
              radius="md"
              onClick={handleNotificationClick}
            >
              <IconBell style={{ width: rem(20), height: rem(20) }} />
            </ActionIcon>
          </Indicator>

          <Divider orientation="vertical" />

          {/* User Menu */}
          <Menu
            width={260}
            position="bottom-end"
            transitionProps={{ transition: 'pop-top-right' }}
            onClose={() => setUserMenuOpened(false)}
            onOpen={() => setUserMenuOpened(true)}
            withinPortal
          >
            <Menu.Target>
              <UnstyledButton
                style={{
                  padding: 'var(--mantine-spacing-xs)',
                  borderRadius: 'var(--mantine-radius-sm)',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Group gap={7}>
                  <Avatar
                    src={null}
                    alt="User"
                    radius="xl"
                    size={30}
                    color="blue"
                  >
                    <IconUser size="1rem" />
                  </Avatar>
                  <Text fw={500} size="sm" lh={1} mr={3}>
                    John Doe
                  </Text>
                  <IconChevronDown
                    style={{
                      width: rem(12),
                      height: rem(12),
                      transform: userMenuOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms ease',
                    }}
                  />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            
            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item leftSection={<IconUser style={{ width: rem(16), height: rem(16) }} />}>
                Profile
              </Menu.Item>
              <Menu.Item leftSection={<IconSettings style={{ width: rem(16), height: rem(16) }} />}>
                Settings
              </Menu.Item>
              
              <Menu.Divider />
              
              <Menu.Item
                color="red"
                leftSection={<IconLogout style={{ width: rem(16), height: rem(16) }} />}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </header>
  );
}
