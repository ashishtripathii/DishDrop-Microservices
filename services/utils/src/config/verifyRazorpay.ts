import crypto from "crypto";

export const verifyRazorpaySignature = (
  oderId: string,
  paymentId: string,
  signature: string,
) => {
  const body = `${oderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
};
