'use client';

import { useState, useCallback } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Button,
  FileInput,
  Progress,
  Badge,
  Table,
  ScrollArea,
  ActionIcon,
  Modal,
  Textarea,
  Grid,
  Paper,
  ThemeIcon,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconUpload,
  IconFile,
  IconDatabase,
  IconEye,
  IconTrash,
  IconDownload,
  IconBrain,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconCloudUpload,
} from '@tabler/icons-react';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import { API_CONFIG } from '@/lib/config';

const API_BASE = API_CONFIG.API_BASE;

interface Dataset {
  id: string;
  name: string;
  filename: string;
  upload_date: string;
  size: string;
  rows: number;
  columns: number;
  status: 'active' | 'processing' | 'error';
}

export function ImportData() {
  const [files, setFiles] = useState<FileWithPath[]>([]);
  const [uploading, setUploading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles(acceptedFiles);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Please select files to upload',
        color: 'red',
      });
      return;
    }

    setUploading(true);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          notifications.show({
            title: 'Success',
            message: `${file.name} uploaded successfully`,
            color: 'green',
          });
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: `Failed to upload ${file.name}`,
          color: 'red',
        });
      }
    }

    setUploading(false);
    setFiles([]);
    loadDatasets();
  };

  const loadDatasets = async () => {
    try {
      const response = await fetch(`${API_BASE}/datasets`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  const previewDataset = async (dataset: Dataset) => {
    try {
      const response = await fetch(`${API_BASE}/preview-dataset/${dataset.id}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data.preview || []);
        setSelectedDataset(dataset);
        setPreviewOpen(true);
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to load preview',
        color: 'red',
      });
    }
  };

  const UploadCard = () => (
    <Card withBorder radius="lg" p="xl" className="glass-card">
      <Stack>
        <Group>
          <ThemeIcon size={48} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'violet' }}>
            <IconCloudUpload size="1.5rem" />
          </ThemeIcon>
          <div>
            <Title order={3}>Upload Data</Title>
            <Text c="dimmed">Import CSV, Excel, or JSON files</Text>
          </div>
        </Group>

        <Dropzone
          onDrop={handleDrop}
          accept={[
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/json',
          ]}
          maxSize={50 * 1024 ** 2} // 50MB
          styles={{
            root: {
              border: '2px dashed #dee2e6',
              borderRadius: '12px',
              backgroundColor: '#f8f9fa',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            },
          }}
        >
          <Group justify="center" gap="xl" style={{ minHeight: 120, pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload size="3rem" color="var(--mantine-color-blue-6)" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size="3rem" color="var(--mantine-color-red-6)" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconFile size="3rem" color="var(--mantine-color-dimmed)" />
            </Dropzone.Idle>

            <div>
              <Text size="xl" inline>
                Drag files here or click to select
              </Text>
              <Text size="sm" c="dimmed" inline mt={7}>
                Attach CSV, Excel, or JSON files (max 50MB each)
              </Text>
            </div>
          </Group>
        </Dropzone>

        {files.length > 0 && (
          <Stack mt="md">
            <Text size="sm" fw={500}>Selected Files:</Text>
            {files.map((file, index) => (
              <Paper key={index} p="sm" withBorder>
                <Group justify="space-between">
                  <Group>
                    <IconFile size="1rem" />
                    <Text size="sm">{file.name}</Text>
                    <Badge size="xs" variant="light">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </Group>
                  <ActionIcon
                    size="sm"
                    color="red"
                    variant="subtle"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  >
                    <IconX size="0.8rem" />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
            
            <Button
              onClick={handleUpload}
              loading={uploading}
              leftSection={<IconUpload size="1rem" />}
              variant="gradient"
              gradient={{ from: 'blue', to: 'violet' }}
              size="md"
            >
              Upload Files
            </Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  const DatasetsTable = () => (
    <Card withBorder radius="lg" p="xl">
      <Group justify="space-between" mb="md">
        <div>
          <Title order={3}>Your Datasets</Title>
          <Text c="dimmed">Manage your uploaded data files</Text>
        </div>
        <Button variant="light" size="sm" onClick={loadDatasets} leftSection={<IconDatabase size="1rem" />}>
          Refresh
        </Button>
      </Group>

      {datasets.length === 0 ? (
        <Alert icon={<IconAlertCircle size="1rem" />} title="No datasets found" color="blue">
          Upload your first dataset to get started with analytics.
        </Alert>
      ) : (
        <ScrollArea>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Rows</Table.Th>
                <Table.Th>Columns</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {datasets.map((dataset) => (
                <Table.Tr key={dataset.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500} size="sm">{dataset.name}</Text>
                      <Text size="xs" c="dimmed">{dataset.upload_date}</Text>
                    </div>
                  </Table.Td>
                  <Table.Td>{dataset.size}</Table.Td>
                  <Table.Td>{dataset.rows.toLocaleString()}</Table.Td>
                  <Table.Td>{dataset.columns}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        dataset.status === 'active' ? 'green' :
                        dataset.status === 'processing' ? 'yellow' : 'red'
                      }
                      variant="light"
                    >
                      {dataset.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => previewDataset(dataset)}
                      >
                        <IconEye size="1rem" />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="blue">
                        <IconBrain size="1rem" />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="green">
                        <IconDownload size="1rem" />
                      </ActionIcon>
                      <ActionIcon size="sm" variant="subtle" color="red">
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Card>
  );

  return (
    <Container size="xl" p="md">
      <div className="fade-in">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <div>
            <Title order={1} size="h2" mb="xs">
              Import Data
            </Title>
            <Text c="dimmed">
              Upload and manage your datasets for analysis
            </Text>
          </div>
        </Group>

        <Stack gap="xl">
          <UploadCard />
          <DatasetsTable />
        </Stack>

        {/* Preview Modal */}
        <Modal
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={`Preview: ${selectedDataset?.name}`}
          size="xl"
        >
          {previewData.length > 0 && (
            <ScrollArea>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <Table.Th key={key}>{key}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {previewData.slice(0, 10).map((row, index) => (
                    <Table.Tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <Table.Td key={i}>{String(value)}</Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Modal>
      </div>
    </Container>
  );
}
