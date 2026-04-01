import React, { useState, useEffect } from 'react';
import { 
  Box, Heading, VStack, Button, Grid, GridItem, 
  Card, CardHeader, CardBody, CardFooter, Text, 
  Spinner, Tabs, TabsList, TabsContent, TabsTrigger,
  Field, Input, Textarea, NumberInput, 
  Select, Badge, Flex, IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, useDisclosure, Alert
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { MdAdd, MdDelete, MdVisibility, MdUpload, MdSettings, MdCheckCircle, MdWarning, MdInfo } from 'react-icons/md';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [structures, setStructures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const { isOpen: isGenerateOpen, onOpen: onGenerateOpen, onClose: onGenerateClose } = useDisclosure();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  // Generation parameters state
  const [generationParams, setGenerationParams] = useState({
    length: 100,
    quality: 0.8,
    symmetry: 'none',
    shape_conditioning: false
  });

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch project details
      const projectResponse = await axios.get(
        `http://localhost:8000/projects/${projectId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Fetch protein structures for this project
      const structuresResponse = await axios.get(
        `http://localhost:8000/projects/${projectId}/protein-structures/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setProject(projectResponse.data);
      setStructures(structuresResponse.data);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateProtein = async () => {
    if (generationParams.length < 50 || generationParams.length > 500) {
      alert('Invalid parameters: Protein length must be between 50 and 500 amino acids');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('params', JSON.stringify(generationParams));
      
      const response = await axios.post(
        `http://localhost:8000/projects/${projectId}/generate-protein-async/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      alert('Generation started: Your protein structure is being generated. This may take a few minutes.');
      
      onGenerateClose();
      
      // Poll for updates or redirect to check status
      setTimeout(() => {
        fetchProjectData();
      }, 3000);
      
    } catch (error) {
      console.error('Error generating protein:', error);
      alert(`Generation failed: ${error.response?.data?.detail || 'Failed to start generation'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('No file selected: Please select a PDB file to upload');
      return;
    }

    if (!uploadName.trim()) {
      alert('Missing name: Please enter a name for your protein structure');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName.trim());
      
      const response = await axios.post(
        `http://localhost:8000/projects/${projectId}/upload-protein/`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      alert('Upload successful: Your protein structure has been uploaded successfully');
      
      onUploadClose();
      setUploadFile(null);
      setUploadName('');
      
      // Refresh the structures list
      fetchProjectData();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Upload failed: ${error.response?.data?.detail || 'Failed to upload protein structure'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStructure = async (structureId) => {
    if (!window.confirm('Are you sure you want to delete this protein structure? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:8000/protein-structures/${structureId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setStructures(structures.filter(structure => structure.id !== structureId));
      
      alert('Structure deleted: Protein structure has been successfully deleted');
    } catch (error) {
      console.error('Error deleting structure:', error);
      alert('Deletion failed: Failed to delete protein structure');
    }
  };

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading project data...</Text>
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500">{error || 'Project not found'}</Text>
        <Button mt={4} colorScheme="blue" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start">
          <Heading size="lg">{project.name}</Heading>
          <Text color="gray.500">
            Created: {new Date(project.created_at).toLocaleDateString()}
          </Text>
        </VStack>
        <Button colorScheme="blue" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Flex>

      <Tabs value={activeTab.toString()} onValueChange={(value) => setActiveTab(parseInt(value))} mb={8}>
        <TabsList>
          <TabsTrigger value="0">Protein Structures</TabsTrigger>
          <TabsTrigger value="1">Generate New</TabsTrigger>
          <TabsTrigger value="2">Upload Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="0">
            {structures.length === 0 ? (
              <Box textAlign="center" py={12}>
                <Text fontSize="xl" color="gray.500" mb={4}>
                  No protein structures in this project yet.
                </Text>
                  <Flex justify="center" gap={4}>
                  <Button colorScheme="green" onClick={() => setActiveTab(1)} leftIcon={<Icon as={MdAdd} />}>
                    Generate New Protein
                  </Button>
                  <Button colorScheme="blue" onClick={() => setActiveTab(2)} leftIcon={<Icon as={MdUpload} />}>
                    Upload Structure
                  </Button>
                </Flex>
              </Box>
            ) : (
              <Grid templateColumns={{ sm: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                {structures.map((structure) => (
                  <GridItem key={structure.id}>
                    <Card 
                      borderWidth={1} 
                      borderColor="gray.200" 
                      _hover={{ 
                        borderColor: 'blue.300', 
                        boxShadow: 'lg'
                      }}
                      transition="all 0.2s"
                    >
                      <CardHeader>
                        <Flex justify="space-between" align="center">
                          <Heading size="md">{structure.name}</Heading>
                          <IconButton
                            icon={<Icon as={MdDelete} />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteStructure(structure.id)}
                            aria-label="Delete structure"
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <Flex justify="space-between">
                            <Text fontWeight="bold">Source:</Text>
                            <Badge colorScheme={structure.generation_params?.source === 'upload' ? 'blue' : 'green'}>
                              {structure.generation_params?.source === 'upload' ? 'Uploaded' : 'Generated'}
                            </Badge>
                          </Flex>
                          
                          {structure.metrics && (
                            <>
                              <Flex justify="space-between">
                                <Text fontWeight="bold">Quality Score:</Text>
                                <Text color={structure.metrics.realism_score > 0.85 ? 'green.500' : structure.metrics.realism_score > 0.7 ? 'yellow.500' : 'red.500'}>
                                  {(structure.metrics.realism_score * 100).toFixed(1)}%
                                </Text>
                              </Flex>
                              <Flex justify="space-between">
                                <Text fontWeight="bold">pLDDT:</Text>
                                <Text>{structure.metrics.pLDDT || 'N/A'}%</Text>
                              </Flex>
                            </>
                          )}
                          
                          <Text fontSize="sm" color="gray.500">
                            Created: {new Date(structure.created_at).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </CardBody>
                      <CardFooter>
                        <Button 
                          colorScheme="blue" 
                          width="full" 
                          onClick={() => navigate(`/proteins/${structure.id}`)}
                          rightIcon={<Icon as={MdVisibility} />}
                        >
                          View Structure
                        </Button>
                      </CardFooter>
                    </Card>
                  </GridItem>
                ))}
              </Grid>
            )}
          </TabsContent>

          <TabsContent value="1">
            <Card>
              <CardHeader>
                <Heading size="md">Generate New Protein Structure</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Alert status="info" variant="left-accent">
                    <Text>This will generate a new protein structure using our AI model. Generation may take 2-5 minutes.</Text>
                  </Alert>
                  
                  <Field.Root required>
                    <Field.Label>Protein Length (amino acids)</Field.Label>
                    <NumberInput 
                      min={50} 
                      max={500} 
                      value={generationParams.length}
                      onValueChange={(value) => setGenerationParams({...generationParams, length: value.value})}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Recommended range: 100-300 amino acids
                    </Text>
                  </Field.Root>
                  
                  <Field.Root required>
                    <Field.Label>Generation Quality</Field.Label>
                    <NumberInput 
                      min={0.1} 
                      max={1.0} 
                      step={0.1} 
                      value={generationParams.quality}
                      onValueChange={(value) => setGenerationParams({...generationParams, quality: value.value})}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Higher quality = better structures but slower generation
                    </Text>
                  </Field.Root>
                  
                  <Field.Root>
                    <Field.Label>Symmetry Type</Field.Label>
                    <Select 
                      value={generationParams.symmetry}
                      onChange={(e) => setGenerationParams({...generationParams, symmetry: e.target.value})}
                    >
                      <option value="none">None (asymmetric)</option>
                      <option value="cyclic">Cyclic (Cn)</option>
                      <option value="dihedral">Dihedral (Dn)</option>
                      <option value="tetrahedral">Tetrahedral</option>
                      <option value="octahedral">Octahedral</option>
                      <option value="icosahedral">Icosahedral</option>
                    </Select>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Symmetry can improve stability of generated structures
                    </Text>
                  </Field.Root>
                  
                  <Field.Root>
                    <Field.Label>Shape Conditioning</Field.Label>
                    <Select 
                      value={generationParams.shape_conditioning ? "true" : "false"}
                      onChange={(e) => setGenerationParams({...generationParams, shape_conditioning: e.target.value === "true"})}
                    >
                      <option value="false">No shape conditioning</option>
                      <option value="true">Enable shape conditioning</option>
                    </Select>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Guides generation towards specific shape constraints
                    </Text>
                  </Field.Root>
                </VStack>
              </CardBody>
              <CardFooter>
                <Button 
                  colorScheme="green" 
                  width="full" 
                  onClick={handleGenerateProtein}
                  isLoading={isGenerating}
                  leftIcon={<Icon as={MdAdd} />}
                >
                  Start Generation
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="2">
            <Card>
              <CardHeader>
                <Heading size="md">Upload Protein Structure</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Alert status="warning" variant="left-accent">
                    <Text>Only PDB format files are supported. Maximum file size: 10MB.</Text>
                  </Alert>
                  
                  <Field.Root required>
                    <Field.Label>Structure Name</Field.Label>
                    <Input 
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="Enter a name for your structure"
                      maxLength={100}
                    />
                  </Field.Root>
                  
                  <Field.Root required>
                    <Field.Label>PDB File</Field.Label>
                    <Input 
                      type="file" 
                      accept=".pdb" 
                      onChange={(e) => setUploadFile(e.target.files[0])}
                    />
                    {uploadFile && (
                      <Text fontSize="sm" color="green.500" mt={1}>
                        Selected: {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
                      </Text>
                    )}
                  </Field.Root>
                  
                  <Alert status="info" variant="left-accent">
                    <Text>Uploaded structures will be validated and processed before becoming available for visualization.</Text>
                  </Alert>
                </VStack>
              </CardBody>
              <CardFooter>
                <Button 
                  colorScheme="blue" 
                  width="full" 
                  onClick={handleFileUpload}
                  isLoading={isUploading}
                  leftIcon={<Icon as={MdUpload} />}
                >
                  Upload Structure
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
      </Tabs>
    </Box>
  );
};

export default ProjectPage;