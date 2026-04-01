import React from 'react';
import { 
  Grid, GridItem, Card, CardHeader, CardBody, CardFooter, 
  Heading, Text, Button, Flex, IconButton, Badge, VStack
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { MdDelete, MdVisibility } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const ProteinStructureList = ({ structures, onDelete, projectId }) => {
  const navigate = useNavigate();

  if (structures.length === 0) {
    return (
      <Text color="gray.500" textAlign="center" py={8}>
        No protein structures available
      </Text>
    );
  }

  return (
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
                  onClick={() => onDelete(structure.id)}
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
  );
};

export default ProteinStructureList;