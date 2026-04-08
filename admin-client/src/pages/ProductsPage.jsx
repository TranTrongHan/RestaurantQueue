import React, { useEffect, useState, useCallback, useRef } from "react";
import { authApis, endpoints } from "../configs/Apis";
import useAuthStore from "../store/useAuthStore";
import SpinnerComp from "../components/common/SpinnerComp";
import toast from "react-hot-toast";
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  Search,
  ToggleLeft,
  ToggleRight,
  Tag,
  Clock,
  DollarSign,
  Info,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const formatPrice = (price) =>
  price != null ? new Intl.NumberFormat("vi-VN").format(price) + "đ" : "—";

// ─── Confirm Delete Dialog ──────────────────────────────────────────────────
const ConfirmDeleteDialog = ({ item, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      onClick={onCancel}
    />
    <div className="relative bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-sm flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-red-50 rounded-[20px] flex items-center justify-center mb-5">
        <Trash2 size={28} className="text-red-500" />
      </div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight">
        Xóa món ăn?
      </h2>
      <p className="text-slate-500 text-sm mt-2 leading-relaxed">
        Bạn có chắc muốn xóa{" "}
        <strong className="text-slate-800">"{item?.name}"</strong>? Hành động
        này không thể hoàn tác.
      </p>
      <div className="flex gap-3 mt-7 w-full">
        <button
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {loading ? (
            <SpinnerComp className="w-4 h-4 border-white border-t-transparent" />
          ) : (
            <>
              <Trash2 size={15} /> Xóa
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ─── Menu Item Form Modal ───────────────────────────────────────────────────
const MenuItemFormModal = ({
  mode, // "create" | "edit"
  item,
  categories,
  onClose,
  onSuccess,
  token,
}) => {
  const [form, setForm] = useState({
    name: item?.name || "",
    price: item?.price || "",
    categoryId: item?.categoryId || "",
    avgCookingTime: item?.avgCookingTime || "",
    description: item?.description || "",
    isAvailable: item?.isAvailable ?? true,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(item?.image || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Tên món không được để trống");
    if (!form.price || isNaN(form.price))
      return toast.error("Giá không hợp lệ");
    if (!form.categoryId) return toast.error("Vui lòng chọn danh mục");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("price", form.price);
      formData.append("categoryId", form.categoryId);
      formData.append("avgCookingTime", form.avgCookingTime || 0);
      if (form.description) formData.append("description", form.description);
      formData.append("isAvailable", form.isAvailable);
      if (file) formData.append("file", file);

      if (mode === "create") {
        await authApis(token).post(
          `${BASE_URL}${endpoints.menu_items}/admin`,
          formData
        );
        toast.success("Thêm món ăn thành công!");
      } else {
        await authApis(token).put(
          `${BASE_URL}${endpoints.menu_items}/admin/${item.menuItemId}`,
          formData
        );
        toast.success("Cập nhật món ăn thành công!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-xl max-h-[92vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-7 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {mode === "create" ? "Thêm món ăn mới" : "Chỉnh sửa món ăn"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === "create"
                  ? "Điền thông tin để tạo món mới"
                  : `Đang chỉnh sửa: ${item?.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-7 space-y-5 scrollbar-hide"
        >
          {/* Image Upload */}
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Ảnh món ăn
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full h-40 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all
                ${preview ? "border-transparent" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"}`}
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-all flex items-center justify-center">
                    <p className="text-white text-xs font-bold">Đổi ảnh</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon size={28} />
                  <p className="text-xs font-medium">Click để chọn ảnh</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Tên món ăn *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nhập tên món..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Price & Cook time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                <DollarSign size={11} /> Giá (VNĐ) *
              </label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="50000"
                min="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                <Clock size={11} /> Thời gian nấu (phút)
              </label>
              <input
                name="avgCookingTime"
                type="number"
                value={form.avgCookingTime}
                onChange={handleChange}
                placeholder="15"
                min="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
              <Tag size={11} /> Danh mục *
            </label>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.categoryId || c.id} value={c.categoryId || c.id}>
                  {c.name || c.categoryName}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
              <Info size={11} /> Mô tả
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn về món ăn..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* isAvailable toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-700">Hiển thị món</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Khách hàng có thể thấy và đặt món này
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, isAvailable: !p.isAvailable }))
              }
              className="transition-all"
            >
              {form.isAvailable ? (
                <ToggleRight size={36} className="text-blue-600" />
              ) : (
                <ToggleLeft size={36} className="text-slate-300" />
              )}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <SpinnerComp className="w-5 h-5 border-white border-t-transparent" />
            ) : mode === "create" ? (
              <>
                <Plus size={16} /> Thêm món
              </>
            ) : (
              <>
                <Pencil size={16} /> Lưu thay đổi
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const ProductsPage = () => {
  const { token } = useAuthStore();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null); // null = create mode
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCat) params.cateId = filterCat;
      const res = await authApis(token).get(
        `${BASE_URL}${endpoints.menu_items}/admin`,
        { params }
      );
      setItems(res.data?.result || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tải danh sách món");
    } finally {
      setLoading(false);
    }
  }, [token, filterCat]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await authApis(token).get(
        `${BASE_URL}${endpoints.categories}`
      );
      setCategories(res.data?.result || []);
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await authApis(token).delete(
        `${BASE_URL}${endpoints.menu_items}/admin/${deleteTarget.menuItemId}`
      );
      toast.success("Đã xóa món ăn!");
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xóa món ăn");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      setToggleLoading(item.menuItemId);
      await authApis(token).patch(
        `${BASE_URL}${endpoints.menu_items}/admin/${item.menuItemId}/status`,
        null,
        { params: { isAvailable: !item.isAvailable } }
      );
      toast.success(
        !item.isAvailable ? "Đã bật hiển thị món" : "Đã tắt hiển thị món"
      );
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setToggleLoading(null);
    }
  };

  const filteredItems = items.filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <UtensilsCrossed className="text-blue-600" size={26} />
            Danh sách món ăn
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý toàn bộ thực đơn nhà hàng
          </p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          Tạo món ăn
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 group">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Tìm tên món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <div className="relative min-w-[180px]">
          <Tag
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.categoryId || c.id} value={c.categoryId || c.id}>
                {c.name || c.categoryName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <SpinnerComp className="w-10 h-10 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">
              Đang tải danh sách món ăn...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-full bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
              <UtensilsCrossed size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">
              Không có món nào
            </h3>
            <p className="text-slate-400 max-w-xs mt-1">
              Thêm món ăn mới hoặc thay đổi bộ lọc.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
              {filteredItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col group
                    ${item.isAvailable ? "border-slate-200 hover:border-blue-200" : "border-slate-100 opacity-60"}`}
                >
                  {/* Image */}
                  <div className="relative h-36 bg-slate-100 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <UtensilsCrossed size={36} />
                      </div>
                    )}
                    {/* Available badge */}
                    <div
                      className={`absolute top-2 right-2 text-[9px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider
                        ${item.isAvailable
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-100 text-slate-400 border-slate-200"}`}
                    >
                      {item.isAvailable ? "Đang bán" : "Đã ẩn"}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">
                        {item.categoryName || "—"}
                      </p>
                      <h3 className="font-black text-slate-800 text-sm leading-tight line-clamp-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-blue-600 text-base">
                        {formatPrice(item.price)}
                      </span>
                      {item.avgCookingTime > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={11} />
                          {item.avgCookingTime} phút
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex items-center gap-2">
                    {/* Toggle available */}
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      disabled={toggleLoading === item.menuItemId}
                      title={item.isAvailable ? "Ẩn món" : "Hiện món"}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all
                        ${item.isAvailable
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                    >
                      {toggleLoading === item.menuItemId ? (
                        <SpinnerComp className="w-3 h-3 border-current border-t-transparent" />
                      ) : item.isAvailable ? (
                        <ToggleRight size={13} />
                      ) : (
                        <ToggleLeft size={13} />
                      )}
                      {item.isAvailable ? "Đang bán" : "Đã ẩn"}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setShowForm(true);
                      }}
                      title="Chỉnh sửa"
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="Xóa"
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <MenuItemFormModal
          mode={editItem ? "edit" : "create"}
          item={editItem}
          categories={categories}
          token={token}
          onClose={() => setShowForm(false)}
          onSuccess={fetchItems}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          item={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
