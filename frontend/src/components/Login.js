import React, { useState } from 'react';
import { 
  Box, Button, Field, Input, 
  VStack, Heading, Text
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8000/token', 
        new URLSearchParams({
          username: username,
          password: password,
          grant_type: 'password'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      onLogin(response.data.access_token, { username });
      navigate('/dashboard');
    } catch (error) {
      alert(`Login failed: ${error.response?.data?.detail || 'Invalid credentials'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4} align="stretch">
          <Heading textAlign="center">Protein Design System</Heading>
          <form onSubmit={handleSubmit}>
            <Field.Root required>
              <Field.Label>Username</Field.Label>
              <Input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter your username"
              />
            </Field.Root>
            <Field.Root mt={4} required>
              <Field.Label>Password</Field.Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
              />
            </Field.Root>
            <Button 
              mt={4} 
              colorScheme="blue" 
              width="full" 
              type="submit" 
              isLoading={isLoading}
            >
              Login
            </Button>
          </form>
          <Text textAlign="center">
            Don't have an account?{' '}
            <Button variant="link" colorScheme="blue" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;