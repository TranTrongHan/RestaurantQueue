import { Container } from "react-bootstrap"
import TableBookingForm from "../forms/TableBookingForm";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

const TableBookingPage = () => {
    return (

        <>
        <div className="d-flex flex-column min-vh-100">
            <Header />
            <Container className="flex-grow-1 my-5">
                <TableBookingForm />
            </Container>
            <Footer />
        </div>
        </>
    );
}

export default TableBookingPage;