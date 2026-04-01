import React, { useEffect, useRef } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { PluginContext, PluginConfig, PluginUIContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { StateTransformer } from 'molstar/lib/mol-state';
import { ColorNames } from 'molstar/lib/mol-util/color/names';
import { createPluginAsync } from 'molstar';
import { PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';

const MolStarViewer = ({ pdbFilePath, style = {} }) => {
  const containerRef = useRef(null);
  const pluginRef = useRef(null);

  useEffect(() => {
    let plugin = null;
    
    const initPlugin = async () => {
      if (!containerRef.current) return;
      
      plugin = await createPluginAsync(containerRef.current, {
        ...PluginUISpec(),
        layout: {
          initial: {
            isExpanded: true,
            showControls: false,
            controlsDisplay: 'reactive',
          }
        },
        components: {
          remoteState: 'none',
          buttons: {
            selection: true,
            camera: true,
          },
          viewport: {
            'molstar-logo': 'none'
          }
        },
        disableAntialiasing: true,
      });
      
      pluginRef.current = plugin;
      
      // Load PDB file
      await loadStructure(plugin, pdbFilePath);
    };
    
    const loadStructure = async (plugin, pdbFilePath) => {
      try {
        // Clear existing structures
        plugin.managers.structure.hierarchy.current.structures.forEach(s => {
          plugin.managers.structure.hierarchy.removeStructure(s.cell);
        });
        
        // Load from URL
        const data = await plugin.builders.data.download({ url: pdbFilePath, isBinary: false });
        const trajectory = await plugin.builders.structure.parseTrajectory(data, 'pdb');
        await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
        
        // Apply nice representation
        await plugin.builders.structure.representation.applyPreset(trajectory, 'auto');
        
        // Focus camera
        plugin.managers.camera.requestSpin();
        plugin.managers.camera.requestReset();
        
      } catch (error) {
        console.error('Error loading structure:', error);
      }
    };
    
    initPlugin();
    
    return () => {
      if (plugin) {
        plugin.destroy();
      }
    };
  }, [pdbFilePath]);

  return (
    <Box 
      ref={containerRef} 
      width="100%" 
      height="500px" 
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      position="relative"
      {...style}
    >
      {!pluginRef.current && (
        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
          <Spinner size="xl" />
          <Text mt={2}>Loading protein structure...</Text>
        </Box>
      )}
    </Box>
  );
};

export default MolStarViewer;