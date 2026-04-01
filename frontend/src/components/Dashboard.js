import React, { useState, useEffect } from 'react';
import { 
  Box, Heading, VStack, Button, Grid, GridItem, 
  Card, CardHeader, CardBody, CardFooter, Text, 
  Spinner, Dialog, DialogBody, 
  DialogFooter, DialogHeader, DialogContent, 
  DialogBackdrop, useDisclosure, Flex, IconButton
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { MdAdd, MdDelete, MdVisibility, MdOpenInNew } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/projects/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const projectName = prompt('Enter project name:');
      if (!projectName || projectName.trim() === '') return;

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8000/projects/',
        { name: projectName.trim(), description: '' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setProjects([...projects, response.data]);
      alert(`Project "${projectName}" created successfully`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const handleDeleteProject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/projects/${selectedProjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setProjects(projects.filter(project => project.id !== selectedProjectId));
      onClose();
      
      alert('Project has been successfully deleted');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
      onClose();
    }
  };

  const handleOpenDeleteDialog = (projectId) => {
    setSelectedProjectId(projectId);
    onOpen();
  };

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading your projects...</Text>
      </Box>
    );
  }

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start">
          <Heading size="lg">Welcome, {user?.username || 'User'}!</Heading>
          <Text color="gray.500">Your protein design projects</Text>
        </VStack>
        <Button colorScheme="blue" onClick={handleCreateProject} leftIcon={<Icon as={MdAdd} />}>
          Create New Project
        </Button>
      </Flex>

      {projects.length === 0 ? (
        <Box textAlign="center" py={12}>
          <Text fontSize="xl" color="gray.500" mb={4}>
            No projects yet. Create your first project to get started!
          </Text>
          <Button colorScheme="blue" onClick={handleCreateProject} leftIcon={<Icon as={MdAdd} />}>
            Create First Project
          </Button>
        </Box>
      ) : (
        <Grid templateColumns={{ sm: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
          {projects.map((project) => (
            <GridItem key={project.id}>
              <Card 
                borderWidth={1} 
                borderColor="gray.200" 
                _hover={{ 
                  borderColor: 'blue.300', 
                  boxShadow: 'lg',
                  transform: 'translateY(-2px)'
                }}
                transition="all 0.2s"
              >
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">{project.name}</Heading>
                    <IconButton
                      icon={<Icon as={MdDelete} />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleOpenDeleteDialog(project.id)}
                      aria-label="Delete project"
                    />
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Text color="gray.600">
                    {project.description || 'No description'}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </Text>
                </CardBody>
                <CardFooter>
                    <Button 
                    colorScheme="blue" 
                    width="full" 
                    onClick={() => navigate(`/projects/${project.id}`)}
                    rightIcon={<Icon as={MdOpenInNew} />}
                  >
                    Open Project
                  </Button>
                </CardFooter>
              </Card>
            </GridItem>
          ))}
        </Grid>
      )}

      <Dialog
        isOpen={isOpen}
        onClose={onClose}
      >
        <DialogBackdrop>
          <DialogContent>
            <DialogHeader fontSize="lg" fontWeight="bold">
              Delete Project
            </DialogHeader>

            <DialogBody>
              Are you sure you want to delete this project? This action cannot be undone. All protein structures in this project will be permanently deleted.
            </DialogBody>

            <DialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteProject} ml={3}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogBackdrop>
      </Dialog>
    </Box>
  );
};

export default Dashboard;