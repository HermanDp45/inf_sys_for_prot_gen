import React, { useState } from 'react';
import { 
  Box, Button, Field, Input, 
  VStack, Heading, Text, Flex
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = ({ onRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/users/', {
        username,
        email,
        password
      });

      // Automatically log in after registration
      const loginResponse = await axios.post('http://localhost:8000/token', 
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
      
      onRegister(loginResponse.data.access_token, { username, email: response.data.email });
      navigate('/dashboard');
      
      alert('Registration successful! Welcome to Protein Design System!');
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.response) {
        if (error.response.data.detail === 'Username already registered') {
          errorMessage = 'Username already exists';
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      alert(`Registration failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPassword = () => setShowPassword(!showPassword);
  const handleViewConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4} align="stretch">
          <Heading textAlign="center">Create Account</Heading>
          <form onSubmit={handleSubmit}>
            <Field.Root required>
              <Field.Label>Username</Field.Label>
              <Input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter your username"
                maxLength={50}
              />
            </Field.Root>
            
            <Field.Root mt={4} required>
              <Field.Label>Email</Field.Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email"
                maxLength={100}
              />
            </Field.Root>
            
            <Field.Root mt={4} required>
                <Field.Label>Password</Field.Label>
                <Flex>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    minLength={8}
                    flex="1"
                  />
                  <Button
                    ml={10}
                    h="1.75rem"
                    size="sm"
                    onClick={handleViewPassword}
                    variant="ghost"
                  >
                    {showPassword ? <Icon as={MdVisibilityOff} /> : <Icon as={MdVisibility} />}
                  </Button>
                </Flex>
            </Field.Root>
           
            
            <Field.Root mt={4} required>
                <Field.Label>Confirm Password</Field.Label>
                <Flex>
                    <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm your password"
                    flex="1"
                    />

                    <Button ml={10} h="1.75rem" size="sm" variant="ghost" onClick={handleViewConfirmPassword}>
                        {showConfirmPassword ? <Icon as={MdVisibilityOff} /> : <Icon as={MdVisibility} />}
                    </Button>

                </Flex>
            </Field.Root>
            
            <Button 
              mt={6} 
              colorScheme="green" 
              width="full" 
              type="submit" 
              isLoading={isLoading}
            >
              Register
            </Button>
          </form>
          <Text textAlign="center">
            Already have an account?{' '}
            <Button variant="link" colorScheme="blue" onClick={() => navigate('/login')}>
              Login
            </Button>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Register;