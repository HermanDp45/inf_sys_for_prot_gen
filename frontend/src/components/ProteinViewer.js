import React, { useState, useEffect } from 'react';
import { 
  Box, Heading, VStack, Text, Tabs, TabsList, TabsContent, TabsTrigger,
  Stat, StatLabel, StatValueText, StatGroup, Badge, Divider, Spinner
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProteinViewer = () => {
  const { structureId } = useParams();
  const [structure, setStructure] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:8000/protein-structures/${structureId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setStructure(response.data);
      } catch (err) {
        setError('Failed to load protein structure');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStructure();
  }, [structureId]);

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading protein structure...</Text>
      </Box>
    );
  }

  if (error || !structure) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500">{error || 'Structure not found'}</Text>
      </Box>
    );
  }

  // Generate absolute URL for PDB file
  const pdbUrl = `http://localhost:8000${structure.pdb_file_path.replace('uploads', '/uploads')}`;

  return (
    <Box p={8} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">{structure.name}</Heading>
        
        <Box display="flex" justifyContent="space-between" flexWrap="wrap">
          <Badge colorScheme="blue" fontSize="md">
            Project ID: {structure.project_id}
          </Badge>
          <Badge colorScheme={structure.metrics?.realism_score > 0.85 ? 'green' : 'yellow'}>
            Realism: {structure.metrics?.realism_score?.toFixed(2) || 'N/A'}
          </Badge>
        </Box>

        <Box p={4} bg="gray.100" borderRadius="md" textAlign="center">
          <Text>3D Protein Viewer</Text>
          <Text fontSize="sm" color="gray.600">Mol* viewer integration coming soon</Text>
        </Box>

        <Tabs mt={4}>
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="sequence">Sequence</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <StatGroup>
                <Stat>
                  <StatLabel>scRMSD</StatLabel>
                  <StatValueText>{structure.metrics?.sc_rmsd || 'N/A'} Å</StatValueText>
                </Stat>
                <Stat>
                  <StatLabel>pLDDT</StatLabel>
                  <StatValueText>{structure.metrics?.pLDDT || 'N/A'}%</StatValueText>
                </Stat>
                <Stat>
                  <StatLabel>Generation Time</StatLabel>
                  <StatValueText>{structure.metrics?.generation_time || 'N/A'}</StatValueText>
                </Stat>
              </StatGroup>
            </TabsContent>
            <TabsContent value="sequence">
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontFamily="monospace" whiteSpace="pre-wrap" wordBreak="break-all">
                  {structure.fasta_sequence || 'No sequence available'}
                </Text>
              </Box>
            </TabsContent>
            <TabsContent value="parameters">
              <Box>
                {structure.generation_params ? (
                  <pre style={{ fontFamily: 'monospace' }}>
                    {JSON.stringify(structure.generation_params, null, 2)}
                  </pre>
                ) : (
                  <Text>No generation parameters available</Text>
                )}
              </Box>
            </TabsContent>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default ProteinViewer;