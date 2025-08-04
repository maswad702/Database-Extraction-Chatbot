import React from 'react';
import { TypeAnimation } from 'react-type-animation';

const TypingAnim = () => {
  return (
    <TypeAnimation
      sequence={[
        'Chat With Your AI Assistant',
        1000,
        'Ask Me Anything!',
        2000,
        'Your Personal AI Helper',
        1500
      ]}
      speed={50}
      style={{
        fontSize: '20px',
        color: 'white',
        display: 'inline-block',
        textAlign: 'center',
        textShadow: '1px 1px 20px #000'
      }}
      repeat={Infinity}
    />
  );
};

export default TypingAnim;