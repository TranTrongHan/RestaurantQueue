import React, { useContext, useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import { MyUserContext } from '../configs/Context';
import { useLocation } from 'react-router-dom';
import { authApis, endpoints } from '../configs/Apis';
import { useCookies } from 'react-cookie';


const HomePage = () => {
  const [user,] = useContext(MyUserContext);
  
  return (
    <>
      
      <div className="d-flex flex-column min-vh-100">
        <Header user={user} />

        <Container className="flex-grow-1 my-5">
          <h1 className="text-center mb-4">Chào mừng đến với Nhà Hàng Sang Trọng</h1>
          <p className="text-center">
            Thưởng thức ẩm thực đẳng cấp với không gian sang trọng và dịch vụ chuyên nghiệp.
          </p>
        </Container>

        <Footer />
      </div>
    </>

  );
};

export default HomePage;
