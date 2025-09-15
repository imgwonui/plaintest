import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  useColorMode,
  useOutsideClick,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Z_INDEX_LAYERS } from '../utils/zIndexLayers';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  maxW?: string;
  minW?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  size = 'md',
  maxW,
  minW,
}) => {
  const { colorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const getSizeProps = () => {
    switch (size) {
      case 'sm':
        return {
          height: '32px',
          fontSize: 'sm',
          px: 3,
          py: 1,
        };
      case 'lg':
        return {
          height: '48px',
          fontSize: 'lg',
          px: 4,
          py: 3,
        };
      default:
        return {
          height: '40px',
          fontSize: 'md',
          px: 3,
          py: 2,
        };
    }
  };

  const sizeProps = getSizeProps();

  useOutsideClick({
    ref: ref,
    handler: () => setIsOpen(false),
  });

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <Box position="relative" maxW={maxW} minW={minW} ref={ref}>
      {/* Select Trigger */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
        border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        borderRadius="md"
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
        _hover={{
          borderColor: colorMode === 'dark' ? '#626269' : '#9e9ea4'
        }}
        _focus={{
          outline: 'none',
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
        }}
        transition="all 0.2s"
        {...sizeProps}
      >
        <Text 
          color={selectedOption 
            ? (colorMode === 'dark' ? '#e4e4e5' : '#2c2c35')
            : (colorMode === 'dark' ? '#7e7e87' : '#9e9ea4')
          }
          fontSize={sizeProps.fontSize}
          noOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        
        <ChevronDownIcon 
          boxSize={5}
          color={colorMode === 'dark' ? '#7e7e87' : '#626269'}
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
        />
      </Box>

      {/* Dropdown Menu */}
      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          borderRadius="md"
          boxShadow="lg"
          zIndex={Z_INDEX_LAYERS.DROPDOWN}
          overflow="hidden"
        >
          <VStack spacing={0} align="stretch">
            {options.map((option) => (
              <Box
                key={option.value}
                px={sizeProps.px}
                py={sizeProps.py}
                cursor="pointer"
                bg={value === option.value 
                  ? (colorMode === 'dark' ? '#4d4d59' : '#e4e4e5')
                  : 'transparent'
                }
                _hover={{
                  bg: colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'
                }}
                onClick={() => handleOptionClick(option.value)}
                transition="background 0.2s"
              >
                <Text 
                  color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                  fontSize={sizeProps.fontSize}
                  fontWeight={value === option.value ? '500' : 'normal'}
                >
                  {option.label}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default CustomSelect;