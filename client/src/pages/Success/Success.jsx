import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { axiosFetch } from "../../utils";
import { useRecoilValue } from "recoil";
import { userState } from "../../atoms";
import "./Success.scss";

const Success = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const payment_intent = params.get("payment_intent");
  const user = useRecoilValue(userState);

  useEffect(() => {
    (async () => {
      try {
        await axiosFetch.patch("/orders", { payment_intent });

        // Fetch the order details using the payment intent
        const { data: orderData } = await axiosFetch.get(`/orders/payment-intent/${payment_intent}`);

        setTimeout(() => {
          // Redirect to the delivery page with the order ID
          navigate(`/delivery/${orderData._id}`);
        }, 5000); // Still keep a short delay before redirecting

      } catch ({ response }) {
        console.log(response.data.message);
        // In case of error, maybe redirect to orders page or show an error message
        // setTimeout(() => {
        //   navigate("/orders");
        // }, 5000);
      }
    })();
  }, [payment_intent, navigate]); // Added dependencies

  return (
    <div className="pay-message">
      Payment successful. You are being redirected to the orders page. Please do
      not close the page
    </div>
  );
};

export default Success;
