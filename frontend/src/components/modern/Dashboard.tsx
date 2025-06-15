'use client';

import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Textarea,
  ThemeIcon,
  SimpleGrid,
  Progress,
  Table,
  ScrollArea,
  Container,
  Title,
} from '@mantine/core';
import {
  IconDatabase,
  IconTable,
  IconSearch,
  IconBrain,
  IconTrendingUp,
  IconActivity,
  IconUsers,
  IconRefresh,
  IconSend,
  IconChartBar,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { API_CONFIG } from '@/lib/config';

interface DashboardStats {
  totalRecords: number;
  activeTables: number;
  queriesToday: number;
  aiInsights: number;
}

interface AnalyticsSummary {
  success: boolean;
  summary?: {
    available_tables?: string[];
    suggested_queries?: string[];
    data_stats?: {
      total_records?: number;
      queries_today?: number;
      ai_insights?: number;
    };
  };
}

const API_BASE = API_CONFIG.API_BASE;

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    activeTables: 0,
    queriesToday: 0,
    aiInsights: 0,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [sqlQuery, setSqlQuery] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    console.log('Loading dashboard with API_BASE:', API_BASE);
    try {
      const url = `${API_BASE}/analytics-summary`;
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data: AnalyticsSummary = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          setStats({
            totalRecords: data.summary?.data_stats?.total_records || 0,
            activeTables: data.summary?.available_tables?.length || 0,
            queriesToday: data.summary?.data_stats?.queries_today || 0,
            aiInsights: data.summary?.data_stats?.ai_insights || 0
          });
        }
      } else {
        console.error('Response not ok:', response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    }
  };

  const askQuestion = async () => {
    if (!sqlQuery.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a question',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: sqlQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(data.results || []);
          setShowResults(true);
          notifications.show({
            title: 'Success',
            message: 'Query executed successfully',
            color: 'green',
          });
        }
      }
    } catch (error) {
      console.error("Error asking question:", error);
      notifications.show({
        title: 'Error',
        message: 'Failed to execute query',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, description, color, trend }: {
    icon: any;
    title: string;
    value: string | number;
    description: string;
    color: string;
    trend?: number;
  }) => (
    <Card withBorder radius="md" p="xl">
      <Group justify="space-between">
        <div>
          <Group align="flex-end" gap="xs">
            <Text size="xl" fw={700}>
              {value.toLocaleString()}
            </Text>
            {trend && (
              <Badge
                color={trend > 0 ? 'green' : 'red'}
                variant="light"
                size="sm"
              >
                {trend > 0 ? '+' : ''}{trend}%
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed" mt={4}>
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </div>
        <ThemeIcon color={color} size={44} radius="md">
          <Icon size="1.5rem" />
        </ThemeIcon>
      </Group>
    </Card>
  );

  return (
    <Container size="xl" p="md">
      <div className="fade-in">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} size="h2" mb="xs">
              Analytics Dashboard
            </Title>
            <Text c="dimmed">
              Monitor your data insights and performance metrics
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size="1rem" />}
            variant="light"
            onClick={loadDashboard}
          >
            Refresh
          </Button>
        </Group>

        {/* Stats Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
          <StatCard
            icon={IconDatabase}
            title="Total Records"
            value={stats.totalRecords}
            description="Across all datasets"
            color="blue"
            trend={12}
          />
          <StatCard
            icon={IconTable}
            title="Active Tables"
            value={stats.activeTables}
            description="Connected data sources"
            color="green"
            trend={8}
          />
          <StatCard
            icon={IconSearch}
            title="Queries Today"
            value={stats.queriesToday}
            description="Analytics requests"
            color="violet"
            trend={-5}
          />
          <StatCard
            icon={IconBrain}
            title="AI Insights"
            value={stats.aiInsights}
            description="Generated insights"
            color="orange"
            trend={24}
          />
        </SimpleGrid>

        <Grid>
          {/* AI Query Interface */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card withBorder radius="md" p="xl" className="glass-card">
              <Group justify="space-between" mb="md">
                <div>
                  <Text size="lg" fw={600}>
                    AI Data Assistant
                  </Text>
                  <Text size="sm" c="dimmed">
                    Ask questions about your data in natural language
                  </Text>
                </div>
                <Badge variant="light" color="violet">
                  AI Powered
                </Badge>
              </Group>

              <Stack>
                <Textarea
                  placeholder="Ask a question about your data... (e.g., 'Show me top 10 customers by sales')"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  minRows={3}
                  maxRows={6}
                  autosize
                />
                <Group justify="flex-end">
                  <Button
                    leftSection={<IconSend size="1rem" />}
                    onClick={askQuestion}
                    loading={loading}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'violet' }}
                  >
                    Ask AI
                  </Button>
                </Group>
              </Stack>
            </Card>

            {/* Results */}
            {showResults && (
              <Card withBorder radius="md" p="xl" mt="md">
                <Group justify="space-between" mb="md">
                  <Text size="lg" fw={600}>
                    Query Results
                  </Text>
                  <Badge color="green" variant="light">
                    {results.length} rows
                  </Badge>
                </Group>

                {results.length > 0 ? (
                  <ScrollArea>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          {Object.keys(results[0]).map((key) => (
                            <Table.Th key={key}>{key}</Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {results.slice(0, 10).map((row, index) => (
                          <Table.Tr key={index}>
                            {Object.values(row).map((value, i) => (
                              <Table.Td key={i}>
                                {String(value)}
                              </Table.Td>
                            ))}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">
                    No results found
                  </Text>
                )}
              </Card>
            )}
          </Grid.Col>

          {/* Activity Panel */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack>
              {/* Performance Overview */}
              <Card withBorder radius="md" p="xl">
                <Text size="lg" fw={600} mb="md">
                  Performance Overview
                </Text>
                
                <Stack gap="md">
                  <div>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Query Performance</Text>
                      <Text size="sm" fw={500}>87%</Text>
                    </Group>
                    <Progress value={87} color="blue" size="sm" />
                  </div>
                  
                  <div>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">Data Quality</Text>
                      <Text size="sm" fw={500}>94%</Text>
                    </Group>
                    <Progress value={94} color="green" size="sm" />
                  </div>
                  
                  <div>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm">AI Accuracy</Text>
                      <Text size="sm" fw={500}>91%</Text>
                    </Group>
                    <Progress value={91} color="violet" size="sm" />
                  </div>
                </Stack>
              </Card>

              {/* Quick Actions */}
              <Card withBorder radius="md" p="xl">
                <Text size="lg" fw={600} mb="md">
                  Quick Actions
                </Text>
                
                <Stack gap="sm">
                  <Button variant="light" fullWidth leftSection={<IconDatabase size="1rem" />}>
                    Import New Data
                  </Button>
                  <Button variant="light" fullWidth leftSection={<IconChartBar size="1rem" />}>
                    Create Report
                  </Button>
                  <Button variant="light" fullWidth leftSection={<IconBrain size="1rem" />}>
                    Generate Insights
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </div>
    </Container>
  );
}
