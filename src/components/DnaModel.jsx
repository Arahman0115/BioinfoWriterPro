// DnaModel.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

const DnaModel = () => {
  const ref = useRef();
  const { scene } = useGLTF('/dna.glb'); // adjust path as needed

  useFrame(() => {
    ref.current.rotation.y += 0.01; // spin animation
  });

  return <primitive ref={ref} object={scene} scale={1.5} />;
};

export default DnaModel;
