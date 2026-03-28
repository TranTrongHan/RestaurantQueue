import { useEffect, useState } from "react";
import StarInput from "./StarInput";
import useUserStore from "../../../store/useUserStore";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import { authApis, endpoints } from "../../configs/Apis";
import AlertComp from "../../common/AlertComp"; // AlertComp được giữ lại phòng hờ
import CommentList from "../CommentList";
import { AlertCircle } from "lucide-react";
import toast from 'react-hot-toast';

const CommentSection = () => {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const handleChange = (e) => {
        setContent(e.target.value);
    }
    const { user } = useUserStore();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [cookie] = useCookies(['token']);
    // --- Start Old Alert State ---
    // const [success, setSuccess] = useState("");
    // const [error, setError] = useState("");
    // --- End Old Alert State ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) { setShowLoginModal(true); return; }
        if (content.trim().length === 0) { 
            toast.error("Nội dung bình luận không được để trống"); 
            return; 
        }
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['comments']}/add`;
            let res = await authApis(cookie.token).post(url, { rating, content });
            if (res.status === 200) {
                // setSuccess(res.data.result.message);
                toast.success(res.data.result.message);
            }
        } catch (err) {
            if (err.response?.data) {
                // setError(err.response.data.message);
                toast.error(err.response.data.message);
            }
        } finally {
            setRating(0);
            setContent("");
        }
    };

    // --- Start Old Alert Effect ---
    // useEffect(() => {
    //     if (success || error) {
    //         const t = setTimeout(() => { setSuccess(""); setError(""); }, 5000);
    //         return () => clearTimeout(t);
    //     }
    // }, [success, error]);
    // --- End Old Alert Effect ---

    return (
        <>
            <div className="container mx-auto px-4 my-8 max-w-2xl">
                {/* 
                {success && <AlertComp variant="success" lable={success} />}
                {error && <AlertComp variant="danger" lable={error} />} 
                */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-6">
                        <StarInput rating={rating} setRating={setRating} />
                        <div className="mb-5">
                            <textarea
                                rows={5}
                                placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
                                value={content}
                                onChange={handleChange}
                                className="w-full p-4 rounded-xl resize-none border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition min-h-[140px]"
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="w-full py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-active transition shadow-lg shadow-primary/20"
                        >
                            Gửi đánh giá của bạn
                        </button>
                    </div>
                </div>
                <CommentList />
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
                    <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 border border-gray-100 dark:border-gray-800 text-center">
                        <AlertCircle size={40} className="text-warning mx-auto mb-3" />
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-2">Yêu cầu đăng nhập</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            Vui lòng{" "}
                            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="font-bold text-primary underline">đăng nhập</Link>{" "}
                            để thực hiện bình luận.
                        </p>
                        <button onClick={() => setShowLoginModal(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CommentSection;