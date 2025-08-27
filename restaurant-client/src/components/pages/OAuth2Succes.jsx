import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

const OAuth2Success = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [cookie, setCookie] = useCookies(["token"]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (token) {

            setCookie("token", token, { path: "/" });


            navigate("/", { replace: true });
        } else {

            navigate("/login", { replace: true });
        }
    }, [location, navigate, setCookie]);

    return <div>Đang đăng nhập...</div>;
};

export default OAuth2Success;
