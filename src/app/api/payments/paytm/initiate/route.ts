import { NextRequest, NextResponse } from "next/server";
import PaytmChecksum from "@/lib/paytmChecksum";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, milestone = "advance", userEmail, userName, userPhone } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ success: false, error: "Missing orderId or amount" }, { status: 400 });
    }

    const mid = process.env.PAYTM_MID;
    const mkey = process.env.PAYTM_MERCHANT_KEY;
    const website = process.env.PAYTM_WEBSITE || "DEFAULT";
    const env = (process.env.PAYTM_ENVIRONMENT || "PROD").toUpperCase();

    const paytmHost =
      env === "PROD" ? "securegw.paytm.in" : "securegw-stage.paytm.in";

    // Unique transaction ID for this milestone payment attempt
    const txnOrderId = `${orderId}_${milestone.toUpperCase()}_${Date.now()}`;
    const formattedAmount = Number(amount).toFixed(2);
    const callbackUrl = `${req.nextUrl.origin}/api/payments/paytm/callback?orderId=${orderId}&milestone=${milestone}`;

    // If live Paytm credentials are not yet set in .env.local, return simulation response
    if (!mid || !mkey) {
      return NextResponse.json({
        success: true,
        simulated: true,
        txnToken: `SIMULATED_TOKEN_${Date.now()}`,
        orderId: txnOrderId,
        baseOrderId: orderId,
        amount: formattedAmount,
        milestone,
        mid: "TEST_MID_SIMULATED",
        callbackUrl,
        message: "Paytm API credentials not configured yet in .env.local. Simulation mode active.",
      });
    }

    const paytmParams: Record<string, any> = {
      body: {
        requestType: "Payment",
        mid: mid,
        websiteName: website,
        orderId: txnOrderId,
        callbackUrl: callbackUrl,
        txnAmount: {
          value: formattedAmount,
          currency: "INR",
        },
        userInfo: {
          custId: userEmail || "CUST_" + Date.now(),
          email: userEmail || undefined,
          mobile: userPhone || undefined,
          firstName: userName || undefined,
        },
      },
    };

    const signature = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      mkey
    );
    paytmParams.head = { signature };

    const paytmRes = await fetch(
      `https://${paytmHost}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${txnOrderId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paytmParams),
      }
    );

    const paytmData = await paytmRes.json();

    if (paytmData.body?.resultInfo?.resultStatus === "S") {
      return NextResponse.json({
        success: true,
        simulated: false,
        txnToken: paytmData.body.txnToken,
        orderId: txnOrderId,
        baseOrderId: orderId,
        amount: formattedAmount,
        milestone,
        mid: mid,
        host: paytmHost,
        callbackUrl,
      });
    } else {
      console.error("Paytm transaction initiation failed:", paytmData);
      return NextResponse.json(
        {
          success: false,
          error: paytmData.body?.resultInfo?.resultMsg || "Payment initiation failed",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Paytm initiate API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
