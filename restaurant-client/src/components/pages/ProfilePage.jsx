import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Image, Badge, Alert, Modal } from 'react-bootstrap';
import {
    FaUser,
    FaEdit,
    FaSave,
    FaTimes,
    FaPhone,
    FaEnvelope,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaCamera,
    FaEye,
    FaEyeSlash
} from 'react-icons/fa';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import SpinnerComp from '../common/SpinnerComp';
import { authApis, endpoints } from '../configs/Apis';
import { useCookies } from 'react-cookie';

const ProfilePage = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        dob: '',
    });
    const avatar = useRef();
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [cookie,] = useCookies(['token']);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);

            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.profile}`;
            console.log("url : ", url);
            console.log("token: ", cookie.token);
            let res = await authApis(cookie.token).get(url);
            if (res.status === 200) {
                setUserInfo(res.data.result);
                setFormData({
                    fullName: res.data.result.fullName,
                    phone: res.data.result.phone,
                    email: res.data.result.email,
                    address: res.data.result.address,
                    dob: res.data.result.dob,
                    image: res.data.result.image
                });
            }

        } catch (err) {
            setError('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (userId) => {
        try {
            setSaving(true);
            setError('');

            // Validation
            if (!formData.fullName || !formData.phone || !formData.email) {
                setError('Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.register}/${userId}`
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update userInfo with new data
            setUserInfo(prev => ({
                ...prev,
                ...formData
            }));

            setSuccess('Cập nhật thông tin thành công!');
            setIsEditing(false);
        } catch (err) {
            setError('Có lỗi xảy ra khi cập nhật thông tin');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                setError('Vui lòng điền đầy đủ thông tin mật khẩu');
                return;
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                setError('Mật khẩu xác nhận không khớp');
                return;
            }

            if (passwordData.newPassword.length < 6) {
                setError('Mật khẩu mới phải có ít nhất 6 ký tự');
                return;
            }

            setSaving(true);
            setError('');
            const data = new FormData();
            data.append("password", passwordData.newPassword)
            console.log(data);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.register}/${userInfo.userId}`;
            console.log("url :", url);
            let res = await authApis(cookie.token).put(url, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.status === 200) {
                setSuccess('Đổi mật khẩu thành công!');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowPasswordModal(false);
            }


        } catch (err) {
            setError('Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Mock upload - thực tế sẽ upload lên server
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({
                    ...prev,
                    image: e.target.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const cancelEdit = () => {
        setFormData({
            fullName: userInfo.fullName,
            phone: userInfo.phone,
            email: userInfo.email,
            address: userInfo.address,
            dob: userInfo.dob,
            image: userInfo.image
        });
        setIsEditing(false);
        setError('');
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    if (loading) {
        return (
            <div className="d-flex flex-column min-vh-100">
                <Header />
                <Container className="flex-grow-1 d-flex justify-content-center align-items-center">
                    <SpinnerComp />
                </Container>
                <Footer />
            </div>
        );
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />
            <Container className="flex-grow-1 my-5">
                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
                {success && <Alert variant="success" className="mb-4">{success}</Alert>}

                {userInfo && (
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <Card style={{
                                borderRadius: '20px',
                                border: 'none',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                overflow: 'hidden'
                            }}>
                                {/* Header */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    padding: '30px',
                                    color: 'white',
                                    position: 'relative'
                                }}>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h3 style={{ marginBottom: '10px', fontWeight: '700' }}>
                                                <FaUser className="me-3" />
                                                Thông tin cá nhân
                                            </h3>
                                            <Badge
                                                bg="light"
                                                text="dark"
                                                style={{ fontSize: '12px', padding: '5px 10px' }}
                                            >
                                                {userInfo.role === 'CUSTOMER' ? 'Khách hàng' : userInfo.role}
                                            </Badge>
                                        </div>

                                        <div className="d-flex gap-2">
                                            {!isEditing ? (
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    onClick={() => setIsEditing(true)}
                                                    style={{
                                                        borderRadius: '10px',
                                                        fontWeight: '600',
                                                        padding: '8px 15px'
                                                    }}
                                                >
                                                    <FaEdit className="me-1" />
                                                    Chỉnh sửa
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleSave(userInfo.userId)}
                                                        disabled={saving}
                                                        style={{
                                                            borderRadius: '10px',
                                                            fontWeight: '600',
                                                            padding: '8px 15px'
                                                        }}
                                                    >
                                                        {saving ? <SpinnerComp size="sm" /> : <><FaSave className="me-1" />Lưu</>}
                                                    </Button>
                                                    <Button
                                                        variant="outline-light"
                                                        size="sm"
                                                        onClick={cancelEdit}
                                                        style={{
                                                            borderRadius: '10px',
                                                            fontWeight: '600',
                                                            padding: '8px 15px'
                                                        }}
                                                    >
                                                        <FaTimes className="me-1" />
                                                        Hủy
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Card.Body style={{ padding: '40px' }}>
                                    <Row>
                                        {/* Avatar Section */}
                                        <Col md={4} className="text-center mb-4">
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <Image
                                                    src={formData.image || 'https://via.placeholder.com/150'}
                                                    roundedCircle
                                                    style={{
                                                        width: '150px',
                                                        height: '150px',
                                                        objectFit: 'cover',
                                                        border: '4px solid #f8f9fa',
                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                                {isEditing && (
                                                    <label
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '10px',
                                                            right: '10px',
                                                            background: '#007bff',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '40px',
                                                            height: '40px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 12px rgba(0,123,255,0.3)',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.transform = 'scale(1.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        <FaCamera />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            style={{ display: 'none' }}
                                                            onChange={handleImageUpload}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <h5 style={{ fontWeight: '600', color: '#333' }}>
                                                    {formData.fullName}
                                                </h5>
                                                <p style={{ color: '#666', marginBottom: '0' }}>
                                                    @{userInfo.username}
                                                </p>
                                            </div>
                                        </Col>

                                        {/* Form Section */}
                                        <Col md={8}>
                                            <Form>
                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label style={{ fontWeight: '600', color: '#333' }}>
                                                                <FaUser className="me-2 text-primary" />
                                                                Họ và tên *
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                name="fullName"
                                                                value={formData.fullName}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                style={{
                                                                    borderRadius: '10px',
                                                                    border: '2px solid #e9ecef',
                                                                    fontSize: '15px',
                                                                    padding: '12px 15px'
                                                                }}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label style={{ fontWeight: '600', color: '#333' }}>
                                                                <FaPhone className="me-2 text-success" />
                                                                Số điện thoại *
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="tel"
                                                                name="phone"
                                                                value={formData.phone}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                style={{
                                                                    borderRadius: '10px',
                                                                    border: '2px solid #e9ecef',
                                                                    fontSize: '15px',
                                                                    padding: '12px 15px'
                                                                }}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label style={{ fontWeight: '600', color: '#333' }}>
                                                                <FaEnvelope className="me-2 text-danger" />
                                                                Email *
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="email"
                                                                name="email"
                                                                value={formData.email}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                style={{
                                                                    borderRadius: '10px',
                                                                    border: '2px solid #e9ecef',
                                                                    fontSize: '15px',
                                                                    padding: '12px 15px'
                                                                }}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label style={{ fontWeight: '600', color: '#333' }}>
                                                                <FaCalendarAlt className="me-2 text-warning" />
                                                                Ngày sinh
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                name="dob"
                                                                value={formData.dob}
                                                                onChange={handleInputChange}
                                                                disabled={!isEditing}
                                                                style={{
                                                                    borderRadius: '10px',
                                                                    border: '2px solid #e9ecef',
                                                                    fontSize: '15px',
                                                                    padding: '12px 15px'
                                                                }}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Form.Group className="mb-4">
                                                    <Form.Label style={{ fontWeight: '600', color: '#333' }}>
                                                        <FaMapMarkerAlt className="me-2 text-info" />
                                                        Địa chỉ
                                                    </Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        rows={2}
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        style={{
                                                            borderRadius: '10px',
                                                            border: '2px solid #e9ecef',
                                                            fontSize: '15px',
                                                            padding: '12px 15px',
                                                            resize: 'none'
                                                        }}
                                                    />
                                                </Form.Group>

                                                <div className="text-center">
                                                    <Button
                                                        variant="outline-secondary"
                                                        onClick={() => setShowPasswordModal(true)}
                                                        style={{
                                                            borderRadius: '10px',
                                                            fontWeight: '600',
                                                            padding: '10px 20px'
                                                        }}
                                                    >
                                                        Đổi mật khẩu
                                                    </Button>
                                                </div>
                                            </Form>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* Password Change Modal */}
                <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                    <Modal.Header closeButton style={{ borderRadius: '20px 20px 0 0' }}>
                        <Modal.Title> Đổi mật khẩu</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ padding: '30px' }}>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600' }}>Mật khẩu hiện tại *</Form.Label>
                                <div style={{ position: 'relative' }}>
                                    <Form.Control
                                        type={showPassword ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        style={{
                                            borderRadius: '10px',
                                            border: '2px solid #e9ecef',
                                            fontSize: '15px',
                                            padding: '12px 45px 12px 15px'
                                        }}
                                    />
                                    <Button
                                        variant="link"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            color: '#666'
                                        }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600' }}>Mật khẩu mới *</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    style={{
                                        borderRadius: '10px',
                                        border: '2px solid #e9ecef',
                                        fontSize: '15px',
                                        padding: '12px 15px'
                                    }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label style={{ fontWeight: '600' }}>Xác nhận mật khẩu mới *</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    style={{
                                        borderRadius: '10px',
                                        border: '2px solid #e9ecef',
                                        fontSize: '15px',
                                        padding: '12px 15px'
                                    }}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer style={{ borderTop: 'none', padding: '0 30px 30px' }}>
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setShowPasswordModal(false);
                                setPasswordData({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: ''
                                });
                            }}
                            style={{ borderRadius: '10px', fontWeight: '600' }}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleChangePassword}
                            disabled={saving}
                            style={{ borderRadius: '10px', fontWeight: '600' }}
                        >
                            {saving ? <SpinnerComp size="sm" /> : 'Đổi mật khẩu'}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
            <Footer />
        </div>
    );
};

export default ProfilePage;