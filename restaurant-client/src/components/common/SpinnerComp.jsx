import { Spinner } from "react-bootstrap";

const SpinnerComp = () => {
  return (
   <Spinner variant="light" animation="border">
        <span className="visually-hidden">Đang tải...</span>
   </Spinner>
  );
}

export default SpinnerComp;