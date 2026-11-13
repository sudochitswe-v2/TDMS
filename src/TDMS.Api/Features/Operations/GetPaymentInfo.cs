namespace TDMS.Api.Features.Operations;

public record PaymentAccountDto(
    string Method,
    string AccountName,
    string AccountNumber,
    string Type,
    bool Recommended
);

public record PaymentInstructionsDto(
    string Instructions,
    List<PaymentAccountDto> Accounts
);

public class GetPaymentInfo
{
    public PaymentInstructionsDto Execute()
    {
        return new PaymentInstructionsDto(
            Instructions: "Transfer the exact subscription fee in MMK to any of the official platform accounts below. After transferring, note the last 6 digits of your transaction reference ID and capture a clear screenshot of the payment receipt. Submit these details under your chosen subscription tier for Operations verification.",
            Accounts: new List<PaymentAccountDto>
            {
                new("KBZPay", "TDMS Education Co., Ltd.", "09-977-123-456", "Mobile Wallet", true),
                new("WavePay", "TDMS Official Operations", "09-977-123-456", "Mobile Wallet", false),
                new("AYAPay", "TDMS Education Services", "09-977-123-456", "Mobile Wallet", false),
                new("CBPay", "TDMS Company Limited", "09-977-123-456", "Mobile Wallet", false),
                new("BankTransfer", "TDMS Platform Company Limited", "0123-4567-8901-2345", "KBZ Bank / CB Bank Account", false)
            }
        );
    }
}
