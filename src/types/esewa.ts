export interface EsewaStatusResponse {
  product_code: string;
  transaction_uuid: string;
  total_amount: string;
  status:
    | "COMPLETE"
    | "PENDING"
    | "FULL_REFUND"
    | "PARTIAL_REFUND"
    | "AMBIGUOUS"
    | "NOT_FOUND"
    | "CANCELED";
  ref_id?: string;
}