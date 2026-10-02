import { env } from "../../../config/env";
import type { EsewaStatusResponse } from "../../../types/esewa";

export const checkEsewaTransactionStatus = async (
  transactionUuid: string,
  totalAmount: string
): Promise<EsewaStatusResponse> => {
  const params = new URLSearchParams({
    product_code: env.ESEWA_PRODUCT_CODE,
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
  });

  const response = await fetch(
    `${env.ESEWA_STATUS_URL}?${params.toString()}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    throw new Error(
      `eSewa status request failed: ${response.status}`
    );
  }

  const data =
    (await response.json()) as EsewaStatusResponse;

  return data;
};