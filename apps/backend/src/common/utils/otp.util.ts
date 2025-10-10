export class OtpUtil {
  static generate(length = 6): string {
    // secure-ish numeric OTP without leading zeros bias
    const min = 10 ** (length - 1);
    const span = 9 * min;
    return Math.floor(min + Math.random() * span).toString();
  }
}
