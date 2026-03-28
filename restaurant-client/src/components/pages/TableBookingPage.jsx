import TableBookingForm from "../forms/TableBookingForm";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { CalendarDays } from "lucide-react";

const TableBookingPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
            <Header />
            <main className="flex-1 flex flex-col items-center py-10 px-4">
                {/* Page Hero */}
                <div className="w-full max-w-2xl text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                        <CalendarDays size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Đặt bàn nhà hàng</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Điền thông tin bên dưới để đặt bàn. Chúng tôi sẽ xác nhận trong vòng 30 phút.
                    </p>
                </div>

                <TableBookingForm />
            </main>
            <Footer />
        </div>
    );
};

export default TableBookingPage;