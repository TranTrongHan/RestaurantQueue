# API Documentation: Modify Voucher

This document describes the API endpoint for updating an existing voucher.

## Endpoint Details
- **Method**: `PUT`
- **URL**: `/api/admin/vouchers/{voucherId}`
- **Authentication**: Admin privileges required.
- **Description**: Updates the metadata and configuration of an existing voucher. The unique `voucherCode` is immutable and cannot be changed.

## Request Body (Input)
The request body should be a JSON object with the following fields.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `voucherName` | String | Yes | Display name of the voucher. |
| `voucherType` | Enum | Yes | `PERCENTAGE` or `FIXED`. |
| `discountValue` | Decimal | Yes | The discount amount (e.g., 10.0 for 10% or 50000 for 50k). |
| `maxDiscountAmount`| Decimal | No | Maximum amount to discount (for PERCENTAGE type). |
| `minOrderValue` | Decimal | No | Minimum order value required to apply. Default is 0. |
| `startDate` | DateTime | Yes | Start date in ISO format (e.g., `2026-04-16T00:00:00`). |
| `endDate` | DateTime | Yes | End date in ISO format. |
| `targetTierId` | Integer | No | ID of the Membership Tier this voucher targets. |
| `isNewMemberVoucher`| Boolean | No | `true` if this is a welcome voucher for new members. |
| `isLevelUpReward` | Boolean | No | `true` if this is a reward for leveling up. |
| `pointsRequired` | Integer | No | Points needed to redeem this voucher. Default is 0. |
| `applyType` | Enum | Yes | `ONLINE`, `DINE_IN`, or `BOTH`. |
| `description` | String | No | Detailed description of the voucher. |

### Configuration Rules
- A voucher **cannot** have both `isNewMemberVoucher` and `isLevelUpReward` set to `true`.
- If `isLevelUpReward` is `true`, `targetTierId` **must** be provided.
- If `isNewMemberVoucher` is `true`, `targetTierId` **must not** be provided.

## Response Body (Output)
Returns a standard `ApiResponse` wrapping a `VoucherResponse`.

### Success Response (200 OK)
```json
{
  "result": {
    "id": 1,
    "voucherCode": "SUMMER2026",
    "voucherName": "Updated Summer Deal",
    "voucherType": "PERCENTAGE",
    "discountValue": 15.0,
    "maxDiscountAmount": 50000.0,
    "minOrderValue": 200000.0,
    "startDate": "2026-04-16T00:00:00",
    "endDate": "2026-06-30T23:59:59",
    "targetTierName": "Gold",
    "isNewMemberVoucher": false,
    "isLevelUpReward": false,
    "pointsRequired": 100,
    "applyType": "BOTH",
    "description": "Updated summer discount for gold members."
  },
  "message": "Voucher updated"
}
```

## Error Handling
| Status Code | Error Code | Description |
| :--- | :--- | :--- |
| 404 | `VOUCHER_NOT_FOUND` | No voucher exists with the provided `voucherId`. |
| 400 | `INVALID_VOUCHER_CONFIG`| The configuration violates one of the [Rules](#configuration-rules) above. |
| 400 | `METHOD_ARGUMENT_NOT_VALID`| Missing required fields or invalid data types. |
