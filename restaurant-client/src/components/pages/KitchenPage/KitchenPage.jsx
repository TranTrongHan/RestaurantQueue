import { useEffect, useState } from "react";
import { authApis, endpoints } from "../../configs/Apis";
import { useCookies } from "react-cookie";
import Header from "../../layout/Header";
import { Button, Card, Col, Container, Pagination, Row } from "react-bootstrap";
import CookingPage from "./CookingPage";
import FinishPage from "./FinishPage";
import { db } from "../../../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import PendingPage from "./PendingPage";

const KitchenPage = () => {
    const [kitchenOrders, setKitchenOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [page, setPage] = useState(0);
    const [totalPage, setTotalPage] = useState(0);
    const [pageSize, setPageSize] = useState(0);
    const [cookie,] = useCookies(["token"]);
    const [activeTab, setActiveTab] = useState('cooking');
    const primaryColor = '#912910';
    const lightColor = '#f8f9fa';
    const whiteColor = '#ffffff';

    const handleFinishButton = async (item) => {
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.kitchen_order}/${item.kitchenId}`;
            console.log("put url: ", url)
            let res = await authApis(cookie.token).put(url);
            console.log("token: ", cookie.token);
            if (res.status === 200) {
                console.log("Update successfull");

            }
        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
                setError("Lỗi từ máy chủ: " + error.response.data.message);
            } else {
                console.error("Axios error:", error.message);
                setError("Lỗi kết nối mạng. Vui lòng thử lại sau.");
            }
        } finally {
            setLoading(false);
            fetchKitchenOrders();
        }

    }
    // FinsishPage
    const fetchKitchenOrders = async () => {
        try {
            setLoading(true);
            let url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.kitchen_order}?page=${page}`;
            console.log("fetching url: ", url);
            let res = await authApis(cookie.token).get(url);
            if (res.status === 200) {
                setKitchenOrders(res.data.result.content);
                setTotalPage(res.data.result.page.totalPages);
                setPageSize(res.data.result.page.size);
            }

        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
            } else {
                console.error("Axios error:", error.message);
            }
        } finally {
            setLoading(false);
        }
    }
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPage) {
            setPage(newPage - 1);
        }
    };
    const renderPagination = () => {
        const items = [];
        const maxPagesToShow = 5;
        const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(totalPage, startPage + maxPagesToShow - 1);

        items.push(
            <Pagination.Prev
                key='prev'
                onClick={() => handlePageChange(page)}
                disabled={page === 0}
            />
        );

        for (let newPage = startPage; newPage <= endPage; newPage++) {
            items.push(
                <Pagination.Item
                    key={newPage}
                    active={newPage === page + 1}
                    onClick={() => handlePageChange(newPage)}
                >
                    {newPage}
                </Pagination.Item>
            );
        }

        items.push(
            <Pagination.Next
                key='next'
                onClick={() => handlePageChange(page + 2)}
                disabled={page + 1 === totalPage}
            />
        );

        return (
            <Pagination className='justify-content-center mt-3'>{items}</Pagination>
        );
    };
    useEffect(() => {
        fetchKitchenOrders();
        console.log("current :", page)
    }, [page]);
    const [items, setItems] = useState([]);
    // CookingPage
    const fetchKitchenOrdersFireStore = () => {
        const colRef = collection(db, "kitchen");

        const q = query(colRef, where("status", "==", "COOKING"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                kitchenId: doc.id,
                ...doc.data(),
            }));
            setItems(data);
        });

        return () => unsubscribe();
    }
    useEffect(() => {
        const unsubscribe = fetchKitchenOrdersFireStore();
        return () => unsubscribe && unsubscribe();
    }, [])
    const [orderItems, setOrderItems] = useState([]);
    // PendingPage 
    const fetchOrderItemsFireStore = () => {
        const colRef = collection(db, "orderItems");
        const q2 = query(colRef, where("status", "==", "PENDING"));
        const unsubscribe = onSnapshot(q2, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                orderItemId: doc.id,
                ...doc.data(),
            }));
            setOrderItems(data);
        });

        return () => unsubscribe();
    }
    useEffect(() => {
        const unsubscribe = fetchOrderItemsFireStore();
        return () => unsubscribe && unsubscribe();
    }, [])
    return (
        <>
            <Header />
            <Container fluid style={{
                height: '100vh',
                backgroundColor: "#fff",
                padding: '15px',
                overflow: 'hidden'
            }}>
                <Row>
                    <Col lg={12} md={12} >
                        <Card
                            style={{
                                height: '100%',
                                border: 'none',
                                boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Card.Header>
                                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                    <Button
                                        onClick={() => setActiveTab('cooking')}
                                        style={{
                                            backgroundColor: activeTab === 'cooking' ? primaryColor : 'transparent',
                                            borderColor: primaryColor,
                                            color: activeTab === 'cooking' ? whiteColor : primaryColor,
                                            fontWeight: '600',
                                            flex: 1,
                                            padding: '10px',
                                            border: `2px solid ${primaryColor}`
                                        }}
                                    >
                                        Món đang nấu
                                    </Button>
                                    <Button
                                        onClick={() => setActiveTab('pending')}
                                        style={{
                                            backgroundColor: activeTab === 'pending' ? primaryColor : 'transparent',
                                            borderColor: primaryColor,
                                            color: activeTab === 'pending' ? whiteColor : primaryColor,
                                            fontWeight: '600',
                                            flex: 1,
                                            padding: '10px',
                                            border: `2px solid ${primaryColor}`
                                        }}
                                    >
                                        Món đang chờ
                                    </Button>
                                    <Button
                                        onClick={() => setActiveTab('done')}
                                        style={{
                                            backgroundColor: activeTab === 'done' ? primaryColor : 'transparent',
                                            borderColor: primaryColor,
                                            color: activeTab === 'done' ? whiteColor : primaryColor,
                                            fontWeight: '600',
                                            flex: 1,
                                            padding: '10px',
                                            border: `2px solid ${primaryColor}`
                                        }}
                                    >
                                        Món đã xong
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '20px'
                                }}>
                                {activeTab === 'cooking' && <CookingPage items={items} handleFinishButton={handleFinishButton}/>}
                                {activeTab === 'pending' && <PendingPage orderItems={orderItems} />}
                                {activeTab === 'done' && <FinishPage kitchenOrders={kitchenOrders} renderPagination={renderPagination} totalPage={totalPage} />}
                            </Card.Body>

                        </Card>
                    </Col>
                </Row>
            </Container>

        </>
    )
}

export default KitchenPage;