import React from 'react';
import { Heading, Text, Code, Box } from '@chakra-ui/react';

interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  mb?: number;
}

export const CustomHeading: React.FC<HeadingProps> = ({ level, children, mb = 4 }) => {
  const sizes = {
    1: '2xl',
    2: 'xl', 
    3: 'lg',
    4: 'md',
    5: 'sm',
    6: 'xs'
  };

  return (
    <Heading as={`h${level}`} size={sizes[level]} mb={mb} color="gray.900">
      {children}
    </Heading>
  );
};

interface BodyTextProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  mb?: number;
}

export const BodyText: React.FC<BodyTextProps> = ({ 
  children, 
  size = 'md', 
  color = 'gray.700', 
  mb = 4 
}) => {
  return (
    <Text fontSize={size} color={color} mb={mb} lineHeight="1.7">
      {children}
    </Text>
  );
};

interface BlockquoteProps {
  children: React.ReactNode;
}

export const Blockquote: React.FC<BlockquoteProps> = ({ children }) => {
  return (
    <Box
      pl={4}
      py={2}
      my={4}
      borderLeft="4px solid"
      borderColor="brand.200"
      bg="gray.50"
      fontStyle="italic"
      color="gray.700"
    >
      {children}
    </Box>
  );
};

interface CodeBlockProps {
  children: React.ReactNode;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, language }) => {
  return (
    <Box
      my={4}
      p={4}
      bg="gray.900"
      color="gray.100"
      borderRadius="md"
      overflow="auto"
      fontSize="sm"
      fontFamily="mono"
    >
      {language && (
        <Text fontSize="xs" color="gray.400" mb={2}>
          {language}
        </Text>
      )}
      <Code bg="transparent" color="inherit" p={0}>
        {children}
      </Code>
    </Box>
  );
};

interface InlineCodeProps {
  children: React.ReactNode;
}

export const InlineCode: React.FC<InlineCodeProps> = ({ children }) => {
  return (
    <Code
      bg="gray.100"
      color="brand.600"
      px={1}
      py={0.5}
      borderRadius="sm"
      fontSize="0.9em"
    >
      {children}
    </Code>
  );
};