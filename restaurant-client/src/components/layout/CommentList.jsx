import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { authApis } from "../configs/Apis";
import { Calendar, Star, User } from "lucide-react";

const CommentList = () => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [cookie,] = useCookies(['token']);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getAverageRating = () => {
        if (comments.length === 0) return 0;
        const total = comments.reduce((sum, comment) => sum + comment.rating, 0);
        return (total / comments.length).toFixed(1);
    };
    const getRatingColor = (rating) => {
        if (rating >= 4) return '#22c55e'; // green
        if (rating >= 3) return '#f59e0b'; // yellow
        return '#ef4444'; // red
    };
    const fetchComments = async () => {

        try {
            setLoading(true);
            let url = `${import.meta.env.VITE_API_BASE_URL}/comments`;
            if(currentPage){
                url += `?page=${currentPage}&size=5`;
            }
            console.log("Fetching comments from:", url);
            let res = await authApis(cookie.token).get(url);
            if (res.status === 200) {
                const results = res.data.result.content;
                setComments(results.filter(comment => comment.status === "APPROVED"));
                setCurrentPage(res.data.result.page.number);
                setTotalPages(res.data.result.page.totalPages);
                setTotalElements(res.data.result.page.totalElements);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }

    }
    useEffect(() => {
        fetchComments();
    }, [currentPage]);
    return (
        <>
            {loading ?
                (<div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center">
                            <div
                                className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
                                style={{ borderColor: '#912910' }}
                            ></div>
                            <p style={{ color: '#912910' }} className="text-lg font-semibold">
                                Đang tải bình luận...
                            </p>
                        </div>
                    </div>
                </div>) : (
                    <div>
                       

                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-600">Chưa có đánh giá nào.</p>
                            ) : (
                                comments.map(comment =>
                                    <div
                                        key={comment.id}
                                        className="rounded p-6 shadow-lg transition-all duration-300 hover:shadow-xl mt-3"
                                        style={{
                                            backgroundColor: '#ffffff',
                                            border: comment.spam ? '2px solid #fee2e2' : '1px solid #e5e7eb',
                                            transform: 'translateY(0)',
                                            animation: `slideIn 0.5s ease-out 0.5s both`
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {/* Header */}
                                        <div className="">
                                            <div className="d-flex align-items-center mx-3 mt-1 ">
                                                <div
                                                    className="rounded-circle d-flex justify-content-center align-items-center"
                                                    style={{ backgroundColor: '#912910',width:50,height:50,marginRight:10}}
                                                >
                                                    <User size={30} color="#fff" />
                                                </div>
                                                <div
                                                    className="d-flex flex-column justify-content-center align-items-start"
                                                >
                                                    <h3 className="font-semibold text-lg" style={{ color: '#912910' }}>
                                                        {comment.customer}
                                                    </h3>
                                                    <div className="d-flex align-items-center text-sm text-gray-600 ">
                                                        <Calendar size={14} />
                                                        <span>{formatDate(comment.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Rating */}
                                        <div className="d-flex justify-content-start align-items-center mt-3 mx-5">
                                            <div>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={25}
                                                        fill={i < comment.rating ? getRatingColor(comment.rating) : 'transparent'}
                                                        color={i < comment.rating ? getRatingColor(comment.rating) : '#d1d5db'}
                                                    />
                                                ))}
                                            </div>
                                            <span
                                                className="font-semibold"
                                                style={{ color: getRatingColor(comment.rating),fontSize:25 }}
                                            >
                                                {comment.rating}/5
                                            </span>
                                        </div>
                                        {/* Content */}
                                        <div
                                            className="text-gray-700 leading-relaxed p-4 rounded-lg"
                                            style={{
                                                backgroundColor: '#f8f9fa',
                                                border: '1px solid #e9ecef'
                                            }}
                                        >
                                            <p className="text-base">{comment.content}</p>
                                        </div>
                                    </div>)
                            )}
                        </div>

                    </div>

                )
            }
            {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex space-x-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className="w-10 h-10 rounded-full font-medium transition-all duration-200"
                                    style={{
                                        backgroundColor: currentPage === i ? '#912910' : '#ffffff',
                                        color: currentPage === i ? '#ffffff' : '#912910',
                                        border: `2px solid #912910`
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    )

}

export default CommentList;