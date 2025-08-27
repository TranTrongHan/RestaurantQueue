import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#912910', color: 'white', padding: '20px 0' }}>
      <Container className="text-center">
        <p> 123 Đường Ẩm Thực, Quận 1, TP. HCM</p>
        <p> 0123 456 789</p>
        <p>© {new Date().getFullYear()} Restaurant App. All rights reserved.</p>
      </Container>
    </footer>
  );
};

export default Footer;
