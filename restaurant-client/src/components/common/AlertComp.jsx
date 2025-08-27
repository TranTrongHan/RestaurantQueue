import { Alert } from "react-bootstrap";

const AlertComp = ({ variant, lable }) => {
  return (
    <Alert variant={variant}>{lable}</Alert>
  );
}
export default AlertComp;