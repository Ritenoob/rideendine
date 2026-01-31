# Commission + Settlement Contract Structure

> **Status:** ⚠️ PLANNED — Business rules defined. Not yet implemented in code.

## Parties
- Platform Operator (“Company”)
- Independent Home Cook (“Chef Partner”)

## Payment Handling
Platform is merchant of record:
- Customers pay platform directly
- Platform processes payments
- Platform releases chef earnings after fulfillment

## Revenue Split Example
Customer Payment: $50  
Platform Fee (20%): $10  
Chef Earnings (80%): $40  

## Settlement Schedule
Chefs are paid daily via batch payout after delivery completion.

## Eligibility
Payout occurs only when:
- Order marked Delivered
- No dispute
- Funds cleared

## Platform Rights
Platform may deduct:
- Commission
- Refunds
- Chargeback penalties

## Records
Chef has access to earnings dashboard and payout history.
