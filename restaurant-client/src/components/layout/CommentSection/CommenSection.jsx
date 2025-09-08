import { useContext, useEffect, useState } from "react";


import StarInput from "./StarInput";
import { Button, Container, Modal } from "react-bootstrap";
import { MyUserContext } from "../../configs/Context";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import { authApis, endpoints } from "../../configs/Apis";
import AlertComp from "../../common/AlertComp";
import CommentList from "../CommentList";

const CommentSection = () => {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const handleChange = (e) => {
        setContent(e.target.value);
    }
    const [cookie,] = useCookies(['token']);
    const [show, setShow] = useState(false);
    const [success,setSuccess] = useState("");
    const [error,setError] = useState("");  
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setShow(true);
            return;
        }
        if(content.trim().length === 0){
            setError("Nội dung bình luận không được để trống");
            return;
        }
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['comments']}/add`;
            const body = {
                "rating": rating,
                "content": content
            };
            console.log("URL:", url);
            let res = await authApis(cookie.token).post(url, body);
            if(res.status === 200){
                setSuccess(res.data.result.message);
            }
        } catch (error) {
            if(error.response && error.response.data){
                setError(error.response.data.message);
            }
        } finally {
            setRating(0);
            setContent("");
        }
    }
    const [user,] = useContext(MyUserContext);
    useEffect(() => {
        if(success || error){
            const timer = setTimeout(() => {
                setSuccess("");
                setError("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    },[success,error]);
    return (
        <>
            <Container className="my-5">
                {success && <AlertComp variant="success" lable={success}/>}
                {error && <AlertComp variant="danger" lable={error}/>}
                <div
                    className="rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',

                    }}
                >
                    {/* Body */}
                    <div className="p-6">
                        <div onSubmit={handleSubmit}>
                            {/* Star Rating */}
                            <StarInput rating={rating} setRating={setRating} />
                            {/* Comment Textarea */}
                            <div className="mb-6">
                                <textarea
                                    rows={5}
                                    placeholder="Chia sẻ chi tiết về trải nghiệm của bạn... Chúng tôi rất mong được nghe ý kiến từ bạn!"
                                    value={content}
                                    onChange={handleChange}
                                    className="w-full p-4 rounded-xl resize-y"
                                    style={{
                                        border: '2px solid #e9ecef',
                                        fontSize: '15px',
                                        minHeight: '140px',
                                        transition: 'all 0.3s ease',
                                        fontFamily: 'inherit',
                                        width: '100%'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#912910';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(145, 41, 16, 0.1)';
                                        e.target.style.outline = 'none';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />

                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleSubmit}
                                className="w-full py-1 px-3 rounded-xl font-semibold text-lg transition-all duration-300"
                                style={{
                                    backgroundColor: '#912910',
                                    color: 'white',
                                    border: 'none',
                                }}
                                onMouseEnter={(e) => {

                                    e.target.style.backgroundColor = '#7a1f0e';
                                    e.target.style.transform = 'translateY(-3px)';
                                    e.target.style.boxShadow = '0 12px 35px rgba(145, 41, 16, 0.4)';

                                }}
                                onMouseLeave={(e) => {

                                    e.target.style.backgroundColor = '#912910';
                                    e.target.style.transform = 'translateY(0)';
                                    e.target.style.boxShadow = 'none';

                                }}
                            >
                                Gửi đánh giá của bạn
                            </Button>

                        </div>
                    </div>

                </div>
                <CommentList  />
            
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Yêu cầu đăng nhập</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Vui lòng{" "}
                    <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                        đăng nhập
                    </Link>{" "}
                    để thực hiện bình luận
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
            </Container>
        </>
    )
}

export default CommentSection;