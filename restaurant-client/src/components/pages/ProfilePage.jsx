import {
    FaUser, FaEdit, FaSave, FaTimes, FaPhone,
    FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaCamera, FaEye, FaEyeSlash
} from 'react-icons/fa';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import SpinnerComp from '../common/SpinnerComp';
import { authApis, endpoints } from '../configs/Apis';
import { useCookies } from 'react-cookie';
import { useState, useEffect } from 'react';
import useUserStore from '../../store/useUserStore';
import toast from 'react-hot-toast';

const inputCls = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed";
const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2";

const ProfilePage = () => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    // --- Start Old Alert State ---
    // const [error, setError] = useState('');
    // const [success, setSuccess] = useState('');
    // --- End Old Alert State ---
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', phone: '', email: '', address: '', dob: '' });
    const [avatar, setAvatar] = useState();
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [cookie,] = useCookies(['token']);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.profile}`;
            let res = await authApis(cookie.token).get(url);
            if (res.status === 200) {
                setUserInfo(res.data.result);
                setFormData({
                    fullName: res.data.result.fullName,
                    phone: res.data.result.phone,
                    email: res.data.result.email,
                    address: res.data.result.address,
                    dob: res.data.result.dob,
                });
                setAvatar(res.data.result.image);
            }
        } catch (err) {
            // setError('Không thể tải thông tin người dùng');
            toast.error('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (userId) => {
        try {
            setSaving(true);
            // setError('');
            if (!formData.fullName || !formData.phone || !formData.email) {
                // setError('Vui lòng điền đầy đủ thông tin bắt buộc');
                toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
                return;
            }
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.register}/${userId}`;
            let data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== userInfo[key]) data.append(key, value);
            });
            let res = await authApis(cookie.token).put(url, data, { headers: { "Content-Type": "multipart/form-data" } });
            if (res.status === 200) {
                // setSuccess('Cập nhật thông tin thành công!');
                toast.success('Cập nhật thông tin thành công!');
                fetchUserProfile();
                setIsEditing(false);
            }
        } catch (err) {
            // setError(err.response?.data?.message || 'Có lỗi xảy ra');
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin mật khẩu'); return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp'); return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự'); return;
        }
        try {
            setSaving(true);
            // setError('');
            const data = new FormData();
            data.append("password", passwordData.newPassword);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.register}/${userInfo.userId}`;
            let res = await authApis(cookie.token).put(url, data, { headers: { "Content-Type": "multipart/form-data" } });
            if (res.status === 200) {
                // setSuccess('Đổi mật khẩu thành công!');
                toast.success('Đổi mật khẩu thành công!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordModal(false);
            }
        } catch (err) {
            // setError('Có lỗi xảy ra khi đổi mật khẩu');
            toast.error('Có lỗi xảy ra khi đổi mật khẩu');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.register}/${userInfo.userId}`;
            const data = new FormData();
            data.append("avatar", file);
            let res = await authApis(cookie.token).patch(url, data, { headers: { "Content-Type": "multipart/form-data" } });
            if (res.status === 200) { 
                // setSuccess('Cập nhật ảnh thành công!'); 
                toast.success('Cập nhật ảnh thành công!'); 
                fetchUserProfile(); 
            }
        } catch (error) {
            // setError(error.response ? "Có lỗi xảy ra" : "Lỗi kết nối mạng");
            toast.error(error.response ? "Có lỗi xảy ra" : "Lỗi kết nối mạng");
        }
    };

    const cancelEdit = () => {
        setFormData({ fullName: userInfo.fullName, phone: userInfo.phone, email: userInfo.email, address: userInfo.address, dob: userInfo.dob });
        setIsEditing(false);
        // setError('');
    };

    useEffect(() => { fetchUserProfile(); }, []);

    // --- Start Old Alert Effect ---
    // useEffect(() => {
    //     if (error || success) {
    //         const timer = setTimeout(() => { setError(''); setSuccess(''); }, 3000);
    //         return () => clearTimeout(timer);
    //     }
    // }, [error, success]);
    // --- End Old Alert Effect ---

    if (loading) return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 flex items-center justify-center"><SpinnerComp /></div>
            <Footer />
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-10 max-w-3xl">
                {/* Toast Alerts 
                {error && (
                    <div className="mb-4 flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl font-medium text-sm">
                        <span>⚠</span> {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl font-medium text-sm">
                        <span>✓</span> {success}
                    </div>
                )}
                */}

                {userInfo && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        {/* Card Header */}
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-700 p-8 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-3">
                                        <FaUser /> Thông tin cá nhân
                                    </h3>
                                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                                        {userInfo.role === 'CUSTOMER' ? 'Khách hàng' : userInfo.role}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {!isEditing ? (
                                        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                                            <FaEdit /> Chỉnh sửa
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => handleSave(userInfo.userId)} disabled={saving} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-70">
                                                {saving ? <SpinnerComp className="w-4 h-4 border-2" /> : <><FaSave /> Lưu</>}
                                            </button>
                                            <button onClick={cancelEdit} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                                                <FaTimes /> Hủy
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Avatar */}
                                <div className="md:w-1/3 flex flex-col items-center shrink-0">
                                    <div className="relative inline-block">
                                        <img
                                            src={avatar || 'https://via.placeholder.com/150'}
                                            alt="Avatar"
                                            className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-xl"
                                        />
                                        {isEditing && (
                                            <label className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110">
                                                <FaCamera />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        )}
                                    </div>
                                    <div className="text-center mt-4">
                                        <h5 className="font-bold text-gray-900 dark:text-gray-100">{formData.fullName}</h5>
                                        <p className="text-sm text-gray-500">@{userInfo.username}</p>
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}><FaUser className="text-primary" /> Họ và tên *</label>
                                            <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} disabled={!isEditing} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}><FaPhone className="text-green-500" /> Số điện thoại *</label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}><FaEnvelope className="text-red-500" /> Email *</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}><FaCalendarAlt className="text-yellow-500" /> Ngày sinh</label>
                                            <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} disabled={!isEditing} className={inputCls} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}><FaMapMarkerAlt className="text-blue-500" /> Địa chỉ</label>
                                        <textarea name="address" value={formData.address} onChange={handleInputChange} disabled={!isEditing} rows={2} className={`${inputCls} resize-none`} />
                                    </div>
                                    <div className="pt-2">
                                        <button onClick={() => setShowPasswordModal(true)} className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary transition border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl">
                                            🔑 Đổi mật khẩu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
                    <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 border border-gray-100 dark:border-gray-800">
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">🔑 Đổi mật khẩu</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Mật khẩu hiện tại *</label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className={`${inputCls} pr-12`} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Mật khẩu mới *</label>
                                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Xác nhận mật khẩu mới *</label>
                                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className={inputCls} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setShowPasswordModal(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Hủy
                            </button>
                            <button onClick={handleChangePassword} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-active disabled:opacity-70 transition shadow-lg shadow-primary/20">
                                {saving ? <SpinnerComp className="w-4 h-4 border-2" /> : 'Đổi mật khẩu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ProfilePage;