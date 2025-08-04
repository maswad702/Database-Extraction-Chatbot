import React from 'react';
import { Typography, Box } from '@mui/material';

const Logo = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <img
        src="/qualitas.png"
        alt="openai"
        width="194px"
        height="50px"
        className="image-inverted"
      />
      <Typography
        sx={{
          display: { md: 'block', sm: 'none', xs: 'none' },
          fontWeight: '800',
          textShadow: '2px 2px 20px #000'
        }}
      >
        <span style={{ fontSize: '40px' }}>AI-ChatBot</span>
      </Typography>
    </Box>
  );
};

export default Logo;